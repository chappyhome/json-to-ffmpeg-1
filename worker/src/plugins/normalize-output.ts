import type { Plugin, PluginResult } from '../types';

/**
 * Example plugin: Normalize output settings
 * Ensures all required output fields have defaults
 */
export const normalizeOutputPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  if (!timeline.output) {
    throw new Error('Timeline must have an output field');
  }

  const defaults = {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    audioBitrate: '320k',
    preset: 'veryfast',
    crf: 23,
    framerate: 30,
    flags: [],
    startPosition: 0,
    scaleRatio: 1,
    tempDir: './tmp',
  };

  const output = { ...defaults, ...timeline.output };

  // Calculate endPosition if not provided
  if (!output.endPosition) {
    warnings.push('endPosition not specified, will be calculated from timeline');
  }

  return {
    timeline: {
      ...timeline,
      output,
    },
    warnings,
  };
};
