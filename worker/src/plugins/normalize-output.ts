import type { Plugin, PluginResult } from '../types';

/**
 * Calculate total length of the timeline
 * Video length is the length of the longest track
 */
function calculateTotalLength(tracks: any): number {
  let maxLength = 0;

  if (!tracks || typeof tracks !== 'object') {
    return 0;
  }

  Object.values(tracks).forEach((track: any) => {
    if (!track.clips || !Array.isArray(track.clips)) {
      return;
    }

    track.clips.forEach((clip: any) => {
      const end = (clip.timelineTrackStart || 0) + (clip.duration || 0);
      if (end > maxLength) {
        maxLength = end;
      }
    });
  });

  return maxLength;
}

/**
 * Normalize output settings
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

  // Calculate endPosition if not provided or is null
  if (!output.endPosition || output.endPosition === null) {
    const totalLength = calculateTotalLength(timeline.tracks);

    if (totalLength > 0) {
      output.endPosition = totalLength;
      warnings.push(`endPosition was ${timeline.output.endPosition === null ? 'null' : 'not specified'}, calculated as ${totalLength} seconds from timeline`);
    } else {
      // Fallback: if we can't calculate, throw an error
      throw new Error('Cannot calculate endPosition: timeline has no clips or all clips have zero duration');
    }
  }

  return {
    timeline: {
      ...timeline,
      output,
    },
    warnings,
  };
};
