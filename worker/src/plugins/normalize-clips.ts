import type { Plugin, PluginResult } from '../types';

/**
 * Normalize clip null values with sensible defaults
 * Prevents "null" strings in FFmpeg commands
 */
export const normalizeClipsPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  if (!timeline.tracks || typeof timeline.tracks !== 'object') {
    return { timeline, warnings };
  }

  if (!timeline.inputs || typeof timeline.inputs !== 'object') {
    throw new Error('Timeline must have an inputs object to normalize clips');
  }

  // Clone timeline to avoid mutation
  const normalizedTimeline = {
    ...timeline,
    tracks: { ...timeline.tracks },
  };

  // Process each track
  for (const [trackName, track] of Object.entries(normalizedTimeline.tracks)) {
    const trackData = track as any;

    if (!trackData.clips || !Array.isArray(trackData.clips)) {
      continue;
    }

    // Normalize each clip in the track
    trackData.clips = trackData.clips.map((clip: any) => {
      const normalizedClip = { ...clip };

      // Get source input to determine defaults
      const sourceInput = timeline.inputs[clip.source];
      if (!sourceInput) {
        warnings.push(`Clip "${clip.name}" references unknown source "${clip.source}"`);
        return normalizedClip;
      }

      // Normalize duration (use source duration if null)
      if (normalizedClip.duration === null || normalizedClip.duration === undefined) {
        normalizedClip.duration = sourceInput.duration || 0;
        warnings.push(`Clip "${clip.name}": duration was null, using source duration ${normalizedClip.duration}`);
      }

      // Normalize sourceStartOffset (default to 0)
      if (normalizedClip.sourceStartOffset === null || normalizedClip.sourceStartOffset === undefined) {
        normalizedClip.sourceStartOffset = 0;
        warnings.push(`Clip "${clip.name}": sourceStartOffset was null, using default 0`);
      }

      // Normalize volume for audio clips (default to 1.0)
      if (clip.clipType === 'audio' && (normalizedClip.volume === null || normalizedClip.volume === undefined)) {
        normalizedClip.volume = 1.0;
        warnings.push(`Clip "${clip.name}": volume was null, using default 1.0`);
      }

      return normalizedClip;
    });
  }

  return {
    timeline: normalizedTimeline,
    warnings,
  };
};
