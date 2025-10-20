import { TextClip } from "./types/Clip";
import { findInput } from "./utils/findInput";
import { Output } from "./types/Output";
import { getRandomUID } from "./utils/uid";
import { Inputs, TextMetadata } from "./types/Inputs";

/**
 * Escape text for FFmpeg drawtext filter
 * @param text
 */
function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\n/g, '\\n');
}

/**
 * Convert hex color to FFmpeg color format
 * Supports: #RGB, #RRGGBB, #RRGGBBAA
 * @param hex
 */
function hexToFFmpegColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) {
    return hex;
  }

  // Remove # prefix
  const h = hex.substring(1);

  // Handle #RGB format
  if (h.length === 3) {
    const r = h[0] + h[0];
    const g = h[1] + h[1];
    const b = h[2] + h[2];
    return `0x${r}${g}${b}`;
  }

  // Handle #RRGGBB format
  if (h.length === 6) {
    return `0x${h}`;
  }

  // Handle #RRGGBBAA format
  if (h.length === 8) {
    // FFmpeg uses AARRGGBB format
    const rr = h.substring(0, 2);
    const gg = h.substring(2, 4);
    const bb = h.substring(4, 6);
    const aa = h.substring(6, 8);
    return `0x${aa}${rr}${gg}${bb}`;
  }

  return hex;
}

/**
 * Parse a text clip object schema and return a ffmpeg filter command.
 * @param clip
 * @param output
 * @param inputs
 */
export function parseTextClip({
  clip,
  output,
  inputs,
}: {
  clip: TextClip;
  output: Output;
  inputs: Inputs;
}): string {
  const { duration, source, transform, name } = clip;
  const { rotation, opacity } = transform;

  const width = Math.round(transform.width * output.scaleRatio);
  const height = Math.round(transform.height * output.scaleRatio);
  const x = Math.round(transform.x * output.scaleRatio);
  const y = Math.round(transform.y * output.scaleRatio);

  // Get text metadata from source
  const input = findInput(inputs, source);
  if (!input || input.type !== 'text' || !input.metadata) {
    throw new Error(`Text source "${source}" not found or invalid`);
  }

  const metadata = input.metadata as TextMetadata;

  // Default values
  const text = escapeDrawText(metadata.text);
  const fontFamily = metadata.fontFamily || 'Arial';
  const fontSize = metadata.fontSize || 48;
  const fontColor = hexToFFmpegColor(metadata.fontColor || '#FFFFFF');
  const backgroundColor = metadata.backgroundColor
    ? hexToFFmpegColor(metadata.backgroundColor)
    : undefined;
  const textAlign = metadata.textAlign || 'left';
  const fontWeight = metadata.fontWeight || 'normal';
  const boxPadding = metadata.boxPadding || 10;

  // Build drawtext filter parameters
  const drawtextParams: string[] = [
    `text='${text}'`,
    `fontsize=${fontSize}`,
    `fontcolor=${fontColor}`,
  ];

  // Font configuration: prefer fontFile (explicit path) over fontFamily (system font)
  if (metadata.fontFile) {
    // Use explicit font file path
    drawtextParams.splice(1, 0, `fontfile=${metadata.fontFile}`);
  } else if (fontFamily) {
    // Use system font name (FFmpeg will search for it)
    drawtextParams.splice(1, 0, `font='${fontFamily}'`);
  }

  // Position
  drawtextParams.push(`x=${x}`);
  drawtextParams.push(`y=${y}`);

  // Box/background
  if (backgroundColor) {
    drawtextParams.push('box=1');
    drawtextParams.push(`boxcolor=${backgroundColor}`);
    drawtextParams.push(`boxborderw=${boxPadding}`);
  }

  // Text alignment (left/center/right)
  // Note: FFmpeg drawtext doesn't have direct alignment,
  // we would need to calculate x position based on text width
  // For now, we'll use the x position as-is

  // Stroke/border
  if (metadata.stroke) {
    const strokeColor = hexToFFmpegColor(metadata.stroke.color);
    const strokeWidth = metadata.stroke.width || 1;
    drawtextParams.push(`borderw=${strokeWidth}`);
    drawtextParams.push(`bordercolor=${strokeColor}`);
  }

  // Shadow
  if (metadata.shadow) {
    const shadowColor = hexToFFmpegColor(metadata.shadow.color);
    const shadowX = metadata.shadow.offsetX || 2;
    const shadowY = metadata.shadow.offsetY || 2;
    drawtextParams.push(`shadowcolor=${shadowColor}`);
    drawtextParams.push(`shadowx=${shadowX}`);
    drawtextParams.push(`shadowy=${shadowY}`);
  }

  // Create base transparent layer
  const baseTrackLayerName = `${getRandomUID(8)}_base`;
  const textTrackLayerName = `${getRandomUID(8)}_text`;

  const outputWidth = Math.round(output.width * output.scaleRatio);
  const outputHeight = Math.round(output.height * output.scaleRatio);

  // Generate filter command
  let clipCommand = `color=black@0.0:s=${outputWidth}x${outputHeight}:d=${duration}[${baseTrackLayerName}];\n`;

  // Apply drawtext on base layer
  const drawtextFilter = `drawtext=${drawtextParams.join(':')}`;
  clipCommand += `[${baseTrackLayerName}]${drawtextFilter}`;

  // Apply opacity if needed
  if (opacity < 1) {
    clipCommand += `,format=rgba,colorchannelmixer=aa=${opacity}`;
  }

  clipCommand += `[${textTrackLayerName}];\n`;

  // Apply rotation if needed
  let postFilters: string[] = [];
  if (rotation !== 0) {
    postFilters.push(`rotate=${rotation}`);
  }

  if (postFilters.length > 0) {
    clipCommand += `[${textTrackLayerName}]${postFilters.join(',')}[${name}];`;
  } else {
    clipCommand += `[${textTrackLayerName}]null[${name}];`;
  }

  return clipCommand;
}
