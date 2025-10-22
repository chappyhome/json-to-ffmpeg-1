import { Clip } from "./types/Clip";
import { parseVideoClip } from "./parseVideoClip";
import { parseImageClip } from "./parseImageClip";
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

  // Check input type to determine the correct parser
  const input = inputs[clip.source];

  if (clip.clipType === "video") {
    // If the declared clip type is video but the input source is text/image,
    // route to the proper parser to avoid unnecessary preprocessing.
    if (input && input.type === "text") {
      clipString += parseTextClip({ clip: clip as any, output, inputs });
    } else if (input && input.type === "image") {
      clipString += parseImageClip({ clip: clip as any, inputFiles, output, inputs });
    } else {
      clipString += parseVideoClip({ clip, inputFiles, output });
    }
  } else if (clip.clipType === "image") {
    clipString += parseImageClip({ clip, inputFiles, output, inputs });
  } else if (clip.clipType === "audio") {
    clipString += parseAudioClip({ clip, inputFiles, inputs, output });
  } else if (clip.clipType === "text") {
    // Support explicit text clipType as well
    clipString += parseTextClip({ clip, output, inputs });
  }

  return clipString + "\n";
}
