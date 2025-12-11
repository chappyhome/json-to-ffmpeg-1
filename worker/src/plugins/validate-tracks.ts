import type { Plugin, PluginResult } from '../types';

/**
 * Example plugin: Validate track structure
 * Ensures tracks have required fields
 */
export const validateTracksPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  if (!timeline.tracks || typeof timeline.tracks !== 'object') {
    throw new Error('Timeline must have a tracks object');
  }

  // Clone to avoid mutating the original timeline and to strip comment-only keys
  const sanitizedTimeline = {
    ...timeline,
    tracks: { ...timeline.tracks },
    inputs: { ...timeline.inputs },
  };

  // Remove inline comments from tracks and inputs (keys like "_comment...")
  for (const key of Object.keys(sanitizedTimeline.tracks)) {
    if (key.startsWith('_comment')) {
      delete sanitizedTimeline.tracks[key];
    }
  }
  for (const key of Object.keys(sanitizedTimeline.inputs ?? {})) {
    if (key.startsWith('_comment')) {
      delete sanitizedTimeline.inputs[key];
    }
  }

  for (const [trackName, track] of Object.entries(sanitizedTimeline.tracks)) {

    const trackData = track as any;

    if (!trackData.type) {
      throw new Error(`Track "${trackName}" missing type field`);
    }

    if (!['video', 'audio'].includes(trackData.type)) {
      warnings.push(`Track "${trackName}" has unusual type: ${trackData.type}`);
    }

    if (!trackData.clips || !Array.isArray(trackData.clips)) {
      throw new Error(`Track "${trackName}" missing clips array`);
    }

    if (trackData.clips.length === 0) {
      warnings.push(`Track "${trackName}" has no clips`);
    }
  }

  return {
    timeline: sanitizedTimeline,
    warnings,
  };
};
