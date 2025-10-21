import { AudioClip } from "./types/Clip";
import { Inputs, AudioMetadata } from "./types/Inputs";
import { Output } from "./types/Output";
import { InputFiles } from "./types/InputFiles";
import { findInputIndex } from "./utils/findInputIndex";
import { findInput } from "./utils/findInput";

/**
 * Parse an audio clip object schema and return a ffmpeg filter command.
 * Supports different audio types with specific behaviors:
 * - BGM: Background music with fade-in/out and looping support
 * - SFX: Sound effects with precise timing via adelay
 *
 * @param clip - The audio clip to process
 * @param inputFiles - List of input files
 * @param inputs - All input sources (to access metadata)
 * @param output - Output configuration (for timing calculations)
 */
export function parseAudioClip({
  clip,
  inputFiles,
  inputs,
  output,
}: {
  clip: AudioClip;
  inputFiles: InputFiles;
  inputs: Inputs;
  output: Output;
}): string {
  const { duration, sourceStartOffset, source, volume, name, timelineTrackStart } = clip;

  const inputIndex = findInputIndex(inputFiles, source);

  // Get source metadata
  const input = findInput(inputs, source);
  const metadata = input?.metadata as AudioMetadata | undefined;

  // Determine audio type (default to "sfx" for backward compatibility)
  const audioType = metadata?.audioType || "sfx";

  let filters: string[] = [];

  /**
   * The atrim filter is used to cut the clip
   * to the correct duration and from the
   * correct start offset.
   */
  filters.push(`atrim=${sourceStartOffset}:${sourceStartOffset + duration}`);

  /**
   * Reset the presentation timestamp to 0 after trimming.
   */
  filters.push(`asetpts=PTS-STARTPTS`);

  // Type-specific filter processing
  if (audioType === "bgm") {
    /**
     * BGM (Background Music) processing:
     * - Apply fade-in at the start
     * - Apply fade-out at the end
     * - Loop audio if source is shorter than clip duration
     */

    // Fade-in
    if (metadata?.fadeIn) {
      const fadeInDuration = metadata.fadeIn;
      filters.push(`afade=t=in:st=0:d=${fadeInDuration}`);
    }

    // Looping support
    if (metadata?.loop && input) {
      const sourceDuration = input.duration;
      // Only loop if source is shorter than clip duration
      if (sourceDuration > 0 && sourceDuration < duration) {
        // Calculate loop count needed
        const loopCount = Math.ceil(duration / sourceDuration);
        // aloop syntax: loop=<loop_count>:<sample_count>
        // For simplicity, use a large sample count (size=1e9 means loop for entire duration)
        filters.push(`aloop=loop=${loopCount}:size=1e9`);
        // Trim to exact duration after looping
        filters.push(`atrim=0:${duration}`);
        filters.push(`asetpts=PTS-STARTPTS`);
      }
    }

    // Fade-out
    if (metadata?.fadeOut) {
      const fadeOutDuration = metadata.fadeOut;
      const fadeOutStart = duration - fadeOutDuration;
      filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }

  } else if (audioType === "sfx") {
    /**
     * SFX (Sound Effects) processing:
     * - No delay here - timing will be handled by parseTrack using anullsrc padding
     * - Optional fade-in/out for smoother playback
     */

    // Optional fade-in for SFX
    if (metadata?.fadeIn) {
      const fadeInDuration = metadata.fadeIn;
      filters.push(`afade=t=in:st=0:d=${fadeInDuration}`);
    }

    // Optional fade-out for SFX
    if (metadata?.fadeOut) {
      const fadeOutDuration = metadata.fadeOut;
      const fadeOutStart = duration - fadeOutDuration;
      filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }

  } else if (audioType === "narration") {
    /**
     * Narration (Voice/Dialogue) processing:
     * - Similar to SFX for audio timing (no looping)
     * - Optional fade-in/out for professional sound
     * - Subtitle handling is done separately in video filter chain
     */

    // Optional fade-in for narration
    if (metadata?.fadeIn) {
      const fadeInDuration = metadata.fadeIn;
      filters.push(`afade=t=in:st=0:d=${fadeInDuration}`);
    }

    // Optional fade-out for narration
    if (metadata?.fadeOut) {
      const fadeOutDuration = metadata.fadeOut;
      const fadeOutStart = duration - fadeOutDuration;
      filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }
  }

  /**
   * Set the volume of the clip.
   */
  filters.push(`volume=${volume}`);

  return `[${inputIndex}:a]${filters.join(",")}[${name}];`;
}
