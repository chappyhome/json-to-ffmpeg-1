import { Track } from "./types/Tracks";
import { parseClip } from "./parseClip";
import { Output } from "./types/Output";
import { getRandomUID } from "./utils/uid";
import { Transition } from "./types/Transition";
import { InputFiles } from "./types/InputFiles";
import { Inputs } from "./types/Inputs";

/**
 * Real length of the transition is shorter
 * because xfade and concat filters need frames
 * from the second clip to create a transition.
 * We need to subtract those frames from the
 * transition so transition won't fully overlap
 * the second clip. FFmpeg will round the frame
 * count to the nearest frame, so we need to
 * subtract two frames.
 */
const SAFE_FRAMES_FOR_TRANSITION = 2;

type ClipToConcat = {
  label: string;
  duration: number;
  isGap: boolean;
};

/**
 * Parse a single track into a string.
 * @param trackName
 * @param track
 * @param output
 * @param totalLength
 * @param transitions
 * @param inputFiles
 * @param inputs
 */
export function parseTrack({
  trackName,
  track,
  output,
  totalLength,
  transitions,
  inputFiles,
  inputs,
}: {
  trackName: string;
  track: Track;
  output: Output;
  totalLength: number;
  transitions: Transition[];
  inputFiles: InputFiles;
  inputs: Inputs;
}): string {
  let clipsCommand = "";

  let clipsToConcat: ClipToConcat[] = [];
  let previousClipEndTime = 0;

  /**
   * Check if all audio clips are SFX (sound effects) early.
   * This determines whether we need to create gaps.
   */
  const allClipsAreSFX = track.type === "audio" && track.clips.every((clip) => {
    if (clip.clipType !== "audio") return false;
    const input = inputs[clip.source];
    const metadata = input?.metadata as any;
    const audioType = metadata?.audioType || "sfx";
    return audioType === "sfx";
  });

  /**
   * Fill all gaps between clips with transparent video or silence,
   * add the gap to the clipsCommand, add the gap label to the concat array,
   * add the clip to the concat array.
   *
   * Skip gap creation for SFX tracks since they use amix with adelay for timing.
   */
  for (const clip of track.clips) {
    if (!allClipsAreSFX && clip.timelineTrackStart > previousClipEndTime) {
      const gap = getGapFiller({
        trackType: track.type,
        output,
        duration: clip.timelineTrackStart - previousClipEndTime,
      });

      clipsCommand += gap.command;
      clipsToConcat.push({
        label: gap.gapLabelName,
        duration: clip.timelineTrackStart - previousClipEndTime,
        isGap: true,
      });
    }

    clipsCommand += parseClip({ clip, output, inputFiles, inputs });
    clipsToConcat.push({
      label: clip.name,
      duration: clip.duration,
      isGap: false,
    });
    previousClipEndTime = clip.timelineTrackStart + clip.duration;
  }

  /**
   * If the last clip ends before the totalLength of the video, fill the gap
   * with transparent video or silence, add the gap to the clipsCommand, add
   * the gap label to the concat array.
   *
   * Skip gap creation for SFX tracks since they use apad for final padding.
   */
  if (!allClipsAreSFX && previousClipEndTime < totalLength) {
    const gap = getGapFiller({
      trackType: track.type,
      output,
      duration: totalLength - previousClipEndTime,
    });

    clipsCommand += gap.command;
    clipsToConcat.push({
      label: gap.gapLabelName,
      duration: totalLength - previousClipEndTime,
      isGap: true,
    });
  }

  /**
   * If the track is audio, concat the clips into one audio stream using the concat filter.
   * If the track is video, concat every two clips into one video stream using the xfade filter. Then
   * concat next video clip with the previous xfade output. Repeat until all clips are concatenated.
   *
   * There are three situations when we need to use xfade filter:
   * 1. When transition is from void (transparent or black) to a clip.
   * 2. When transition is from a clip to void.
   * 3. When transition is from a clip to another clip.
   *
   * In all three situations, we need to use xfade filter to create a smooth transition.
   * Otherwise, use concat filter. There may be maximum two transitions per clip because
   * it may be on the beginning and on the end of the clip.
   */
  let clipGroupLabels: {
    label: string;
    duration: number;
    isGap: boolean;
    originalLabel: string;
  }[] = [];

  /**
   * Only for transition from/to void.
   */
  if (track.type === "video") {
    for (let i = 0; i < clipsToConcat.length; i++) {
      let currentClip = clipsToConcat[i];
      let originalClipToConcatLabel = currentClip.label;

      if (currentClip.isGap) {
        clipGroupLabels.push({
          label: currentClip.label,
          duration: currentClip.duration,
          isGap: true,
          originalLabel: originalClipToConcatLabel,
        });
        continue;
      }

      const width = Math.round(output.width * output.scaleRatio);
      const height = Math.round(output.height * output.scaleRatio);

      const transitionStart = transitions.find(
        (t) => t.from === null && t.to === originalClipToConcatLabel,
      );
      if (transitionStart) {
        const safeTransitionDuration =
          transitionStart.duration -
          (1 / output.framerate) * SAFE_FRAMES_FOR_TRANSITION;

        clipsCommand += `color=c=black@0.0:s=${width}x${height}:d=${transitionStart.duration}[void_${currentClip.label}];\n`;

        const transitionData = getXfadeTransition({
          from: `void_${currentClip.label}`,
          to: currentClip.label,
          duration: safeTransitionDuration,
          type: transitionStart.type,
          output,
          offset: 0,
          labelPrefix: "start",
        });

        clipsCommand += transitionData.command;

        currentClip = {
          label: transitionData.transitionLabelName,
          duration: currentClip.duration,
          isGap: false,
        };
      }

      const transitionEnd = transitions.find(
        (t) => t.from === originalClipToConcatLabel && t.to === null,
      );
      if (transitionEnd) {
        const safeTransitionDuration =
          transitionEnd.duration -
          (1 / output.framerate) * SAFE_FRAMES_FOR_TRANSITION;

        clipsCommand += `color=c=black@0.0:s=${width}x${height}:d=${transitionEnd.duration}[void_${currentClip.label}];\n`;

        const transitionData = getXfadeTransition({
          from: currentClip.label,
          to: `void_${currentClip.label}`,
          duration: safeTransitionDuration,
          type: transitionEnd.type,
          output,
          offset: currentClip.duration - transitionEnd.duration,
          labelPrefix: "end",
        });

        clipsCommand += transitionData.command;

        currentClip = {
          label: transitionData.transitionLabelName,
          duration: currentClip.duration,
          isGap: false,
        };
      }

      clipGroupLabels.push({
        label: currentClip.label,
        duration: currentClip.duration,
        isGap: false,
        originalLabel: originalClipToConcatLabel,
      });
    }

    let previousClipGroup: {
      label: string;
      duration: number;
      isGap: boolean;
      originalLabel: string;
    } = clipGroupLabels[0];

    /**
     * If there is only one clip without any gaps, there is no need for any transition.
     * Instead map the clip to the track name and continue to the next track.
     */
    if (clipGroupLabels.length === 1) {
      clipsCommand += `[${previousClipGroup.label}]setpts=PTS-STARTPTS[${trackName}];\n`;
      return clipsCommand;
    }

    for (let i = 1; i < clipGroupLabels.length; i++) {
      const currentClipGroup = clipGroupLabels[i];
      const isLastClipGroup = i === clipGroupLabels.length - 1;

      const transition = transitions.find(
        (t) =>
          t.from === previousClipGroup.originalLabel &&
          t.to === currentClipGroup.originalLabel,
      );

      const useConcat =
        previousClipGroup.isGap || currentClipGroup.isGap || !transition;

      const transitionData = useConcat
        ? getConcatTransition({
            from: previousClipGroup.label,
            to: currentClipGroup.label,
            output,
            labelPrefix: "between",
            customLabel: isLastClipGroup ? trackName : undefined,
          })
        : getXfadeTransition({
            from: previousClipGroup.label,
            to: currentClipGroup.label,
            duration: transition?.duration || 0,
            type: transition?.type || "fade",
            output,
            offset: previousClipGroup.duration - transition?.duration || 0,
            labelPrefix: "between",
            customLabel: isLastClipGroup ? trackName : undefined,
          });

      clipsCommand += transitionData.command;

      previousClipGroup = {
        label: transitionData.transitionLabelName,
        duration:
          previousClipGroup.duration +
          currentClipGroup.duration -
          (transition?.duration || 0),
        isGap: false,
        originalLabel: currentClipGroup.originalLabel,
      };
    }
  }

  if (track.type === "audio") {
    /**
     * Use the allClipsAreSFX flag from earlier to decide processing method.
     * SFX clips use adelay for precise timing and should be mixed with amix instead of concat.
     * BGM (background music) clips should use concat as they need sequential playback.
     */

    if (allClipsAreSFX && track.clips.length > 0) {
      /**
       * For SFX tracks: use amix to combine all sound effects.
       * Each SFX clip needs front padding (silence) to position it at the correct timeline position.
       * Strategy: anullsrc (silence) + concat (SFX) to create properly timed clips, then amix them.
       */

      const paddedClipLabels: string[] = [];

      for (let i = 0; i < track.clips.length; i++) {
        const clip = track.clips[i];
        const clipData = clipsToConcat.find(c => c.label === clip.name && !c.isGap);
        if (!clipData) continue;

        const paddedLabel = `${clip.name}_padded`;

        if (clip.timelineTrackStart > 0) {
          // Create silence for the delay
          const silenceLabel = `silence_${clip.name}`;
          clipsCommand += `anullsrc=channel_layout=stereo:sample_rate=44100:d=${clip.timelineTrackStart}[${silenceLabel}];\n`;

          // Concat silence + audio clip
          clipsCommand += `[${silenceLabel}][${clip.name}]concat=n=2:v=0:a=1[${paddedLabel}];\n`;
        } else {
          // No delay needed, use clip directly
          clipsCommand += `[${clip.name}]acopy[${paddedLabel}];\n`;
        }

        paddedClipLabels.push(paddedLabel);
      }

      if (paddedClipLabels.length === 1) {
        // Single SFX: just pad with silence to match total length
        const clipLabel = paddedClipLabels[0];
        clipsCommand += `[${clipLabel}]apad=whole_dur=${totalLength}[${trackName}];\n`;
      } else if (paddedClipLabels.length > 1) {
        // Multiple SFX: use amix to combine them, then pad to total length
        for (const label of paddedClipLabels) {
          clipsCommand += `[${label}]`;
        }
        clipsCommand += `amix=inputs=${paddedClipLabels.length}:duration=longest[${trackName}_premix];\n`;
        clipsCommand += `[${trackName}_premix]apad=whole_dur=${totalLength}[${trackName}];\n`;
      }
    } else {
      /**
       * For BGM or mixed tracks: use concat as before.
       * This handles sequential playback with gaps.
       */
      for (const clip of clipsToConcat) {
        clipsCommand += `[${clip.label}]`;
      }

      clipsCommand += `concat=n=${clipsToConcat.length}:v=0:a=1[${trackName}];\n`;
    }
  }

  return clipsCommand;
}

/**
 * Get a gap filler command depending on the track type.
 * For video, it will be a transparent video, for audio, it will be silence.
 * @param trackType
 * @param output
 * @param duration
 */
export function getGapFiller({
  trackType,
  output,
  duration,
}: {
  trackType: "video" | "audio";
  output: Output;
  duration: number;
}): { command: string; gapLabelName: string } {
  const gapLabelName = `gap_${getRandomUID()}`;
  const width = Math.round(output.width * output.scaleRatio);
  const height = Math.round(output.height * output.scaleRatio);

  return {
    command:
      trackType === "video"
        ? `color=c=black@0.0:s=${width}x${height}:d=${duration}[${gapLabelName}];\n`
        : `anullsrc=channel_layout=stereo:sample_rate=44100:d=${duration}[${gapLabelName}];\n`,
    gapLabelName,
  };
}

export function getXfadeTransition({
  from,
  to,
  duration,
  type,
  output,
  offset,
  labelPrefix,
  customLabel,
}: {
  from: string;
  to: string;
  duration: number;
  type: string;
  output: Output;
  offset: number;
  labelPrefix?: string;
  customLabel?: string;
}): {
  command: string;
  transitionLabelName: string;
} {
  let commandToReturn = "";
  const { framerate } = output;

  const fromIntermediateLabel = `fps_${from}_${getRandomUID(8)}`;
  const toIntermediateLabel = `fps_${to}_${getRandomUID(8)}`;

  commandToReturn += `[${from}]fps=${framerate}[${fromIntermediateLabel}];\n`;
  commandToReturn += `[${to}]fps=${framerate}[${toIntermediateLabel}];\n`;

  const transitionLabelName = customLabel
    ? customLabel
    : `${labelPrefix || ""}_xfade_${getRandomUID()}`;

  commandToReturn += `[${fromIntermediateLabel}][${toIntermediateLabel}]xfade=transition=${type}:duration=${duration}:offset=${offset},fps=${framerate}[${transitionLabelName}];\n`;

  return {
    command: commandToReturn,
    transitionLabelName,
  };
}

export function getConcatTransition({
  from,
  to,
  output,
  labelPrefix,
  customLabel,
}: {
  from: string;
  to: string;
  output: Output;
  labelPrefix?: string;
  customLabel?: string;
}): {
  command: string;
  transitionLabelName: string;
} {
  const transitionLabelName = customLabel
    ? customLabel
    : `${labelPrefix || ""}_concat_${getRandomUID()}`;

  const { framerate } = output;
  return {
    command: `[${from}][${to}]concat=n=2:v=1:a=0,fps=${framerate}[${transitionLabelName}];\n`,
    transitionLabelName,
  };
}
