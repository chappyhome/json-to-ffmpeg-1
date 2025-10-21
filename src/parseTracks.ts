import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { parseTrack } from "./parseTrack";
import { calculateTotalLength } from "./calculateTotalLength";
import { getRandomUID } from "./utils/uid";
import { InputFiles } from "./types/InputFiles";
import { AudioMetadata } from "./types/Inputs";
import { generateSubtitleFilter } from "./utils/parseSubtitle";

/**
 * Loop over each track, parse it, and combine
 * as two streams. One for video and one for audio.
 * @param schema
 * @param inputFiles
 * @returns Object containing filterComplex command and final video stream name
 */
export function parseTracks({
  schema,
  inputFiles,
}: {
  schema: VideoEditorFormat;
  inputFiles: InputFiles;
}): { filterComplex: string; finalVideoStream: string } {
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
   * Collect all narration clips with subtitles and apply subtitle filters
   * to the final video output
   */
  const narrationClipsWithSubtitles: Array<{
    subtitlePath: string;
    metadata: AudioMetadata;
  }> = [];

  // Scan all audio tracks for narration clips with subtitles
  for (const [, track] of audioTracks) {
    if (track.clips) {
      for (const clip of track.clips) {
        if (clip.clipType === "audio") {
          const source = schema.inputs[clip.source];
          const metadata = source?.metadata as AudioMetadata | undefined;

          if (metadata?.audioType === "narration") {
            // Check if subtitle file is provided (local path takes precedence)
            const subtitlePath = metadata.subtitleFile || metadata.subtitleUrl;
            if (subtitlePath) {
              narrationClipsWithSubtitles.push({
                subtitlePath,
                metadata,
              });
            }
          }
        }
      }
    }
  }

  // Apply subtitle filters to video output
  // Note: For simplicity, we're applying all subtitles sequentially
  // In a real scenario, you might want to handle timing more precisely
  let finalVideoStream = "video_output";

  if (narrationClipsWithSubtitles.length > 0) {
    let currentVideoStream = "video_output";

    for (let i = 0; i < narrationClipsWithSubtitles.length; i++) {
      const { subtitlePath, metadata } = narrationClipsWithSubtitles[i];
      const subtitleFilter = generateSubtitleFilter(subtitlePath, metadata);
      const outputStream =
        i === narrationClipsWithSubtitles.length - 1
          ? "video_with_subtitles"
          : `${getRandomUID(8)}_subtitle_${i}`;

      tracksCommand += `[${currentVideoStream}]${subtitleFilter}[${outputStream}];\n`;
      currentVideoStream = outputStream;
    }

    finalVideoStream = currentVideoStream;
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
    finalVideoStream,
  };
}
