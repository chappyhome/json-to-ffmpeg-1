import { VideoEditorFormat } from "./types/VideoEditingFormat";

export function preprocessClips({
  schema,
}: {
  schema: VideoEditorFormat;
}): string {
  // Preprocessing disabled: generate a single ffmpeg command that uses original inputs directly.
  // Keeping this function for API compatibility, but returning an empty string.
  return "";
}
