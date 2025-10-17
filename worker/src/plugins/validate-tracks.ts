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

  for (const [trackName, track] of Object.entries(timeline.tracks)) {
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
    timeline,
    warnings,
  };
};
