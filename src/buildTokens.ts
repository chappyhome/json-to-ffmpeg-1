import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { parseInputs } from "./parseInputs";
import { parseTracks } from "./parseTracks";
import { parseOutput } from "./parseOutput";
import { preprocessClips } from "./preprocessClips";
import { InputFiles } from "./types/InputFiles";

/**
 * Build FFmpeg command as array of tokens (arguments)
 * This is preferred for programmatic use vs shell command string
 */
export function buildTokens(
  schemaObjectOrString: VideoEditorFormat | string,
): string[] {
  const schema =
    typeof schemaObjectOrString === "string"
      ? JSON.parse(schemaObjectOrString)
      : schemaObjectOrString;

  if (schema.version !== 1) {
    throw new Error("Schema version not supported");
  }

  const tokens: string[] = [];
  const inputFiles: InputFiles = [];

  // Add -y flag for overwrite
  tokens.push('-y');

  // Parse inputs
  const inputsResult = parseInputs({ schema });
  inputFiles.push(...inputsResult.inputFiles);

  // Parse input arguments (remove trailing backslash and newlines)
  const inputArgs = inputsResult.command
    .replace(/\\\n/g, '')
    .trim()
    .split(/\s+/)
    .filter(arg => arg.length > 0);

  tokens.push(...inputArgs);

  // Build filter complex
  const { filterComplex, finalVideoStream } = parseTracks({
    schema,
    inputFiles,
  });

  tokens.push('-filter_complex', filterComplex);

  // Parse output arguments
  const outputCommand = parseOutput({ schema, videoStreamName: finalVideoStream });
  const outputArgs = outputCommand
    .trim()
    .split(/\s+/)
    .filter(arg => arg.length > 0);

  tokens.push(...outputArgs);

  return tokens;
}
