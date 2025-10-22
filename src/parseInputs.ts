import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { InputFiles } from "./types/InputFiles";
import { ImageMetadata } from "./types/Inputs";

/**
 * Return all the inputs as a part of ffmpeg command.
 * Uses original input files directly (no preprocessing).
 */
export function parseInputs({ schema }: { schema: VideoEditorFormat }): {
  command: string;
  inputFiles: InputFiles;
} {
  let inputsCommand = "";
  const inputFiles: InputFiles = [];

  // Include all non-text inputs directly
  for (const [inputName, input] of Object.entries(schema.inputs)) {
    if (input.type === "text") {
      // Text is rendered with drawtext and does not need an input file
      continue;
    }

    if (input.type === "image" && input.metadata) {
      const metadata = input.metadata as ImageMetadata;
      const isAnimated = metadata.imageType === "animated" || metadata.format === "gif";
      const shouldLoop = metadata.loop !== false; // default to true

      if (isAnimated) {
        // Control GIF looping at input level
        inputsCommand += `${shouldLoop ? "-ignore_loop 0" : "-ignore_loop 1"} -i ${input.file} \\\n`;
      } else {
        inputsCommand += `-i ${input.file} \\\n`;
      }
    } else {
      // video/audio or image without metadata
      inputsCommand += `-i ${input.file} \\\n`;
    }

    inputFiles.push({ name: inputName, file: input.file });
  }

  return { command: inputsCommand, inputFiles };
}

