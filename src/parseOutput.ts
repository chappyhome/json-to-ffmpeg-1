import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { SubtitleInput, getSubtitleCodec, normalizeLanguageCode } from "./utils/parseSubtitle";

/**
 * Parse output schema object and return command
 * with flags and arguments configured in options.
 * @param schema
 * @param subtitleInputs - Subtitle inputs for soft subtitle mode
 * @param inputFileCount - Number of input files (for calculating subtitle stream indices)
 */
export function parseOutput({
  schema,
  subtitleInputs = [],
  inputFileCount = 0,
}: {
  schema: VideoEditorFormat;
  subtitleInputs?: SubtitleInput[];
  inputFileCount?: number;
}): string {
  let outputCommand = "";

  const {
    file,
    framerate,
    videoCodec,
    audioCodec,
    width,
    height,
    flags,
    audioBitrate,
    crf,
    preset,
    startPosition,
    endPosition,
    scaleRatio,
  } = schema.output;
  const additionalFlags = flags.length > 0 ? flags.join(" ") : "";

  const renderWidth = Math.round(width * scaleRatio);
  const renderHeight = Math.round(height * scaleRatio);
  const resolution = `${renderWidth}x${renderHeight}`;

  // Add subtitle inputs
  if (subtitleInputs.length > 0) {
    for (const subtitle of subtitleInputs) {
      outputCommand += `-i "${subtitle.url}" \\\n`;
    }
  }

  // Map video and audio streams
  outputCommand += `-map '[video_output]' -map '[audio_output]' `;

  // Map subtitle streams
  if (subtitleInputs.length > 0) {
    for (let i = 0; i < subtitleInputs.length; i++) {
      const streamIndex = inputFileCount + i;
      outputCommand += `-map ${streamIndex}:s `;
    }
  }

  // Video and audio codecs
  outputCommand += `-c:v ${videoCodec} -c:a ${audioCodec} -b:a ${audioBitrate} `;

  // Subtitle codec
  if (subtitleInputs.length > 0) {
    const subtitleCodec = getSubtitleCodec(file);

    if (!subtitleCodec) {
      console.warn(
        `Warning: Output format (${file}) does not support subtitle streams. ` +
        `Subtitles will be ignored.`
      );
    } else {
      outputCommand += `-c:s ${subtitleCodec} `;

      // Add language metadata for each subtitle
      for (let i = 0; i < subtitleInputs.length; i++) {
        const langCode = normalizeLanguageCode(subtitleInputs[i].language);
        outputCommand += `-metadata:s:s:${i} language=${langCode} `;
      }
    }
  }

  // Other output parameters
  outputCommand += `-r ${framerate} -s ${resolution} -ss ${startPosition} -t ${
    endPosition - startPosition
  } -crf ${crf} -preset ${preset} ${additionalFlags} ${file}`;

  return outputCommand;
}
