import { VideoEditorFormat } from "./types/VideoEditingFormat";
import { parseInputs } from "./parseInputs";
import { parseTracks } from "./parseTracks";
import { parseOutput } from "./parseOutput";
import { preprocessClips } from "./preprocessClips";
import { InputFiles } from "./types/InputFiles";

export function parseSchema(
  schemaObjectOrString: VideoEditorFormat | string,
  onlyFilterComplex: boolean = false,
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

  outputCommand += preprocessClips({
    schema,
  });

  outputCommand += "ffmpeg -y \\\n";

  const inputsResult = parseInputs({
    schema,
  });

  outputCommand += inputsResult.command;
  inputFiles.push(...inputsResult.inputFiles);

  const { filterComplex, subtitleInputs } = parseTracks({
    schema,
    inputFiles,
  });

  if (onlyFilterComplex) {
    return filterComplex;
  }

  outputCommand += '-filter_complex "';
  outputCommand += filterComplex;
  outputCommand += '" \\\n';
  outputCommand += parseOutput({
    schema,
    subtitleInputs,
    inputFileCount: inputFiles.length,
  });

  return outputCommand;
}

// Re-export buildTokens
export { buildTokens } from "./buildTokens";
export type { VideoEditorFormat } from "./types/VideoEditingFormat";
export {
  distributeTimelines,
  type InputWithMetadata,
  type DistributionResult,
  type DistributionOverrides,
  type CombineMode,
  type DistributionStrategy,
  type DistributionOutput,
} from "./distribute/distributeTimelines";

export { generateBatchTimelines } from "./one-click/generateTimeline";
export * from "./one-click/types";
