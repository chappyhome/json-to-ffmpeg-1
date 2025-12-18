import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { parseInputs } from "./parseInputs";
import { parseTracks } from "./parseTracks";
import { InputFiles } from "./types/InputFiles";
import { SubtitleInput, getSubtitleCodec, normalizeLanguageCode } from "./utils/parseSubtitle";

export function parseSchemaCompact(
  schemaObjectOrString: VideoEditorFormat | string,
): string {
  const schema =
    typeof schemaObjectOrString === "string"
      ? JSON.parse(schemaObjectOrString)
      : schemaObjectOrString;

  if (schema.version !== 1) {
    throw new Error("Schema version not supported");
  }

  let outputCommand = "";
  const inputFiles: InputFiles = [];

  outputCommand += "ffmpeg -y \\\n";

  const inputsResult = parseInputs({ schema });
  inputFiles.push(...inputsResult.inputFiles);

  for (const inputFile of inputFiles) {
    const file = inputFile.file;
    const isUrl = file.startsWith('http://') || file.startsWith('https://');
    
    if (isUrl) {
      outputCommand += `-i "${file}" \\\n`;
    } else {
      outputCommand += `-i ${file} \\\n`;
    }
  }

  const { filterComplex, subtitleInputs } = parseTracks({
    schema,
    inputFiles,
  });

  outputCommand += `-filter_complex "${filterComplex}" \\\n`;

  if (subtitleInputs.length > 0) {
    for (const subtitle of subtitleInputs) {
      outputCommand += `-i "${subtitle.url}" \\\n`;
    }
  }

  outputCommand += `-map "[video_output]" -map "[audio_output]" \\\n`;

  if (subtitleInputs.length > 0) {
    for (let i = 0; i < subtitleInputs.length; i++) {
      const streamIndex = inputFiles.length + i;
      outputCommand += `-map ${streamIndex}:s `;
    }
    outputCommand += "\\\n";
  }

  const { videoCodec, crf, preset, framerate, width, height, scaleRatio } = schema.output;
  const renderWidth = Math.round(width * scaleRatio);
  const renderHeight = Math.round(height * scaleRatio);
  
  outputCommand += `-c:v ${videoCodec} -crf ${crf} -preset ${preset} -r ${framerate} -s ${renderWidth}x${renderHeight} \\\n`;

  const { audioCodec, audioBitrate } = schema.output;
  outputCommand += `-c:a ${audioCodec} -b:a ${audioBitrate} \\\n`;

  if (subtitleInputs.length > 0) {
    const subtitleCodec = getSubtitleCodec(schema.output.file);
    if (subtitleCodec) {
      outputCommand += `-c:s ${subtitleCodec} `;
      
      for (let i = 0; i < subtitleInputs.length; i++) {
        const langCode = normalizeLanguageCode(subtitleInputs[i].language);
        outputCommand += `-metadata:s:s:${i} language=${langCode} `;
      }
      
      outputCommand += "-disposition:s:0 default \\\n";
    }
  }

  const { startPosition, endPosition, flags } = schema.output;
  outputCommand += `-ss ${startPosition} -t ${endPosition - startPosition} `;
  
  if (flags && flags.length > 0) {
    outputCommand += flags.join(" ") + " ";
  }
  
  outputCommand += `\\\n${schema.output.file}`;

  return outputCommand;
}
