import { Clip } from "./types/Clip";
import { parseVideoClip } from "./parseVideoClip";
import { parseAudioClip } from "./parseAudioClip";
import { parseTextClip } from "./parseTextClip";
import { Output } from "./types/Output";
import { InputFiles } from "./types/InputFiles";
import { Inputs } from "./types/Inputs";

/**
 * This is simple intermediate function that serves
 * as a router for the different clip type parsers.
 * @param clip
 * @param output
 * @param inputFiles
 * @param inputs
 */
export function parseClip({
  clip,
  output,
  inputFiles,
  inputs,
}: {
  clip: Clip;
  output: Output;
  inputFiles: InputFiles;
  inputs: Inputs;
}): string {
  let clipString = "";

  if (clip.clipType === "video" || clip.clipType === "image") {
    clipString += parseVideoClip({ clip, inputFiles, output });
  } else if (clip.clipType === "audio") {
    clipString += parseAudioClip({ clip, inputFiles });
  } else if (clip.clipType === "text") {
    clipString += parseTextClip({ clip, output, inputs });
  }

  return clipString + "\n";
}
