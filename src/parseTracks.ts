import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { parseTrack } from "./parseTrack";
import { calculateTotalLength } from "./calculateTotalLength";
import { getRandomUID } from "./utils/uid";
import { InputFiles } from "./types/InputFiles";
import { AudioMetadata } from "./types/Inputs";
import { SubtitleInput } from "./utils/parseSubtitle";

/**
 * Loop over each track, parse it, and combine
 * as two streams. One for video and one for audio.
 * @param schema
 * @param inputFiles
 * @returns Object containing filterComplex command and subtitle inputs for soft subtitle mode
 */
export function parseTracks({
  schema,
  inputFiles,
}: {
  schema: VideoEditorFormat;
  inputFiles: InputFiles;
}): {
  filterComplex: string;
  subtitleInputs: SubtitleInput[];
} {
  const totalLength = calculateTotalLength(schema.tracks, schema.transitions);

  /**
   * Create a black base video stream to overlay.
   * It's background of the whole video, visible on the bottom.
   */
  const width = Math.round(schema.output.width * schema.output.scaleRatio);
  const height = Math.round(schema.output.height * schema.output.scaleRatio);
  let tracksCommand = `color=c=black:s=${width}x${height}:d=${totalLength}[base];\n`;

  /**
   * Loop over each track object schema and parse it.
   */
  for (const [trackName, track] of Object.entries(schema.tracks)) {
    tracksCommand += parseTrack({
      trackName,
      track,
      output: schema.output,
      totalLength,
      transitions: schema.transitions,
      inputFiles,
      inputs: schema.inputs,
    });
  }

  /**
   * Combine all video and audio tracks into two video streams.
   * Combine all videos into one video stream overlaying each other.
   * The lowest video stream is the base video stream, then
   * streams from the tracks are on top one by one. To combine
   * them, intermediate overlay streams are created.
   */
  const videoTracks = Object.entries(schema.tracks).filter(
    ([, track]) => track.type === "video",
  );
  const audioTracks = Object.entries(schema.tracks).filter(
    ([, track]) => track.type === "audio",
  );

  let previousTrackName = "base";
  for (let i = 0; i < videoTracks.length; i++) {
    const [videoTrackName] = videoTracks[i];

    let combinedOverlayName =
      i === videoTracks.length - 1
        ? "video_output"
        : `${getRandomUID(8)}_combined_track`;

    tracksCommand += `[${previousTrackName}][${videoTrackName}]overlay=0:0[${combinedOverlayName}];\n`;
    previousTrackName = combinedOverlayName;
  }

  /**
   * Collect all narration clips with subtitles for soft subtitle mode
   * Subtitles will be added as separate input streams
   */
  const subtitleInputs: SubtitleInput[] = [];

  // Scan all audio tracks for narration clips with subtitles
  for (const [, track] of audioTracks) {
    if (track.clips) {
      for (const clip of track.clips) {
        if (clip.clipType === "audio") {
          const source = schema.inputs[clip.source];
          const metadata = source?.metadata as AudioMetadata | undefined;

          if (metadata?.audioType === "narration") {
            // Check if subtitle file is provided (local path or URL)
            const subtitleFile = metadata.subtitleFile;
            const subtitleUrl = metadata.subtitleUrl;
            const url = subtitleFile || subtitleUrl;

            if (url) {
              // Warn if subtitleStyle is used (not supported in soft subtitle mode)
              if (metadata.subtitleStyle) {
                console.warn(
                  `Warning: subtitleStyle is not supported in soft subtitle mode for clip "${clip.name}". ` +
                  `Subtitle styling depends on the player.`
                );
              }

              const timelineStart = clip.timelineTrackStart || 0;

              // Warn if subtitle timing might not match audio
              if (timelineStart > 0) {
                console.warn(
                  `Warning: Clip "${clip.name}" starts at ${timelineStart}s in timeline. ` +
                  `Soft subtitle SRT timecodes MUST be adjusted to match this offset. ` +
                  `For example, if your SRT has "00:00:00 --> 00:00:05", it should be ` +
                  `"00:00:${String(Math.floor(timelineStart)).padStart(2, '0')} --> 00:00:${String(Math.floor(timelineStart + 5)).padStart(2, '0')}" ` +
                  `to sync with the audio.`
                );
              }

              subtitleInputs.push({
                url,
                language: metadata.language,
                sourceClip: clip.name,
                timelineTrackStart: timelineStart,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Audio tracks are combined by mixing them together.
   * The output of the mix is the final audio stream.
   */
  for (const [audioTrackName] of audioTracks) {
    tracksCommand += `[${audioTrackName}]`;
  }
  if (audioTracks.length > 1) {
    tracksCommand += `amix=inputs=${audioTracks.length}:duration=longest[audio_output];`;
  } else if (audioTracks.length === 1) {
    tracksCommand += `volume=1[audio_output];`;
  } else {
    tracksCommand += `anullsrc=channel_layout=stereo:sample_rate=44100:d=${totalLength}[audio_output];`;
  }

  return {
    filterComplex: tracksCommand,
    subtitleInputs,
  };
}
