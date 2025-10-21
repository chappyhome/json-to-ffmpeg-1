import { ImageClip } from "./types/Clip";
import { Inputs, ImageMetadata } from "./types/Inputs";
import { Output } from "./types/Output";
import { InputFiles } from "./types/InputFiles";
import { findInputIndex } from "./utils/findInputIndex";
import { findInput } from "./utils/findInput";
import { getRandomUID } from "./utils/uid";

/**
 * Parse an image clip object schema and return a ffmpeg filter command.
 * Supports both static images (PNG, JPG) and animated images (GIF).
 *
 * @param clip - The image clip to process
 * @param output - Output configuration
 * @param inputFiles - List of input files
 * @param inputs - All input sources (to access metadata)
 */
export function parseImageClip({
  clip,
  output,
  inputFiles,
  inputs,
}: {
  clip: ImageClip;
  output: Output;
  inputFiles: InputFiles;
  inputs: Inputs;
}): string {
  const { duration, source, transform, name } = clip;
  const { rotation, opacity } = transform;

  // Get scaled dimensions
  const width = Math.round(transform.width * output.scaleRatio);
  const height = Math.round(transform.height * output.scaleRatio);
  const x = Math.round(transform.x * output.scaleRatio);
  const y = Math.round(transform.y * output.scaleRatio);

  // Find input index
  const inputIndex = findInputIndex(inputFiles, source);

  // Get source metadata
  const input = findInput(inputs, source);
  const metadata = input?.metadata as ImageMetadata | undefined;

  // Determine if this is an animated GIF
  const isAnimated = metadata?.imageType === "animated" || metadata?.format === "gif";
  const shouldLoop = metadata?.loop !== false; // Default to true for GIFs

  let filters: string[] = [];

  if (isAnimated) {
    // ===== GIF Animation Handling =====

    /**
     * For GIF animations, we need to:
     * 1. Handle the loop setting (ignore_loop in input options, not filter)
     * 2. Set the frame rate (use metadata.frameRate or output.framerate)
     * 3. Extend the duration if needed
     */

    // Set frame rate for GIF
    const gifFrameRate = metadata?.frameRate || output.framerate;
    filters.push(`fps=${gifFrameRate}`);

    /**
     * If the GIF duration is shorter than the clip duration,
     * we need to loop it. The loop filter repeats the entire stream.
     */
    if (shouldLoop && input && input.duration > 0 && input.duration < duration) {
      const loopCount = Math.ceil(duration / input.duration);
      filters.push(`loop=${loopCount}:${Math.round(input.duration * gifFrameRate)}`);
    }

    /**
     * Set the start offset and trim to the exact clip duration.
     */
    filters.push(`setpts=PTS-STARTPTS`);
    filters.push(`trim=duration=${duration}`);
  } else {
    // ===== Static Image Handling =====

    /**
     * For static images (PNG, JPG), we use the loop filter
     * to extend the single frame to the desired duration.
     */
    filters.push(
      `loop=loop=${duration * output.framerate}:size=${
        duration * output.framerate
      }`,
    );

    /**
     * Set the start offset of the image video stream.
     */
    filters.push(`setpts=PTS-STARTPTS`);

    /**
     * Set framerate to the output framerate.
     */
    filters.push(`fps=${output.framerate}`);
  }

  /**
   * Scale the clip to the correct size.
   */
  filters.push(`scale=${width}:${height}`);

  /**
   * To change the opacity of the clip, we have to
   * make sure it has an alpha channel. Naive approach
   * is to set format to rgba. At the worst case, this
   * is redundant. Then we can set the alpha channel to
   * the desired opacity.
   */
  filters.push(`format=rgba,colorchannelmixer=aa=${opacity}`);

  /**
   * Base and clip track layers are used to rotate and position the clip.
   * Base layer is a transparent video stream that is used as a bigger background
   * for eventually scaled and rotated clip.
   */
  const baseTrackLayerName = `${getRandomUID(8)}_base`;
  const clipTrackLayerName = `${getRandomUID(8)}_clip`;

  const outputWidth = Math.round(output.width * output.scaleRatio);
  const outputHeight = Math.round(output.height * output.scaleRatio);

  let clipCommand = `color=black@0.0:s=${outputWidth}x${outputHeight}:d=${clip.duration}[${baseTrackLayerName}];\n`;
  clipCommand += `[${inputIndex}:v]${filters.join(
    ",",
  )}[${clipTrackLayerName}];\n`;

  let postOverlayFilters: string[] = [];

  /**
   * Rotation is applied to the combined stream after overlaying because
   * otherwise the clip would be cut outside of viewport.
   */
  postOverlayFilters.push(`rotate=${rotation}`);

  /**
   * Position translation is applied during overlay, because it allows
   * to position the clip relative to the base layer which is the viewport size.
   */
  clipCommand += `[${baseTrackLayerName}][${clipTrackLayerName}]overlay=${x}:${y}:format=auto,${postOverlayFilters.join(
    ",",
  )},fps=${output.framerate}[${name}];`;

  return clipCommand;
}
