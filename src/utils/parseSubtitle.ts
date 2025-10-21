import { AudioMetadata } from "../types/Inputs";

/**
 * Convert hex color to FFmpeg ASS subtitle color format
 * FFmpeg uses BGR format with alpha: &HAABBGGRR
 * @param hexColor - Color in hex format (e.g., "#FFFFFF" or "#FFFFFF80")
 * @returns FFmpeg ASS color format (e.g., "&HFFFFFFFF")
 */
function hexToAssColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Parse RGB and optional alpha
  let r: string, g: string, b: string, a: string = "FF";

  if (hex.length === 6) {
    // RGB format: #RRGGBB
    r = hex.substring(0, 2);
    g = hex.substring(2, 4);
    b = hex.substring(4, 6);
  } else if (hex.length === 8) {
    // RGBA format: #RRGGBBAA
    r = hex.substring(0, 2);
    g = hex.substring(2, 4);
    b = hex.substring(4, 6);
    a = hex.substring(6, 8);
  } else {
    // Default to white
    return "&HFFFFFFFF";
  }

  // Convert to FFmpeg format: &HAABBGGRR
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

/**
 * Generate FFmpeg subtitle filter with custom styling
 * @param subtitlePath - Path to SRT subtitle file
 * @param metadata - Audio metadata containing subtitle styling options
 * @returns FFmpeg subtitles filter string
 */
export function generateSubtitleFilter(
  subtitlePath: string,
  metadata?: AudioMetadata
): string {
  const style = metadata?.subtitleStyle;

  // Default subtitle style
  const defaults = {
    fontFamily: "Arial",
    fontSize: 24,
    fontColor: "#FFFFFF",
    backgroundColor: "#00000080",
    position: "bottom" as const,
    marginV: 20,
  };

  const fontFamily = style?.fontFamily || defaults.fontFamily;
  const fontSize = style?.fontSize || defaults.fontSize;
  const fontColor = style?.fontColor || defaults.fontColor;
  const backgroundColor = style?.backgroundColor || defaults.backgroundColor;
  const marginV = style?.marginV || defaults.marginV;

  // Convert position to ASS alignment
  // ASS Alignment: 1=left-bottom, 2=center-bottom, 3=right-bottom
  //                4=left-middle, 5=center-middle, 6=right-middle
  //                7=left-top, 8=center-top, 9=right-top
  let alignment: number;
  switch (style?.position || defaults.position) {
    case "top":
      alignment = 8; // center-top
      break;
    case "middle":
      alignment = 5; // center-middle
      break;
    case "bottom":
    default:
      alignment = 2; // center-bottom
      break;
  }

  // Convert colors to ASS format
  const primaryColor = hexToAssColor(fontColor);
  const backColor = hexToAssColor(backgroundColor);

  // Escape subtitle path for FFmpeg (replace single quotes and backslashes)
  const escapedPath = subtitlePath
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");

  // Build force_style parameter
  const forceStyle = [
    `FontName=${fontFamily}`,
    `FontSize=${fontSize}`,
    `PrimaryColour=${primaryColor}`,
    `BackColour=${backColor}`,
    `Alignment=${alignment}`,
    `MarginV=${marginV}`,
  ].join(",");

  // Generate subtitles filter
  return `subtitles=filename='${escapedPath}':force_style='${forceStyle}'`;
}

/**
 * Collect all subtitle filters from narration clips
 * Returns array of objects containing subtitle info for each narration clip
 */
export interface SubtitleInfo {
  clipName: string;
  subtitlePath: string;
  filter: string;
  timelineStart: number;
  duration: number;
}

/**
 * Escape special characters in subtitle file path for FFmpeg
 */
export function escapeSubtitlePath(path: string): string {
  return path
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");
}
