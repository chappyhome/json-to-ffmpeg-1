import { describe, expect, it } from 'vitest';
import {
  distributeTimelines,
  type InputWithMetadata,
} from 'json-to-ffmpeg';
import inputWithMetadata from './fixtures/input-with-metadata.json';

describe('distributeTimelines', () => {
  it('combineMode=all strictNoSplit=true produces single merged timeline', () => {
    const result = distributeTimelines(inputWithMetadata as InputWithMetadata, {
      combineMode: 'all',
      strictNoSplit: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.outputs).toHaveLength(1);
    const timeline = result.outputs[0].timeline;
    expect(timeline.version).toBe(1);
    expect(timeline.inputs).toBeTruthy();
    expect(timeline.tracks).toBeTruthy();

    const videoTrack = timeline.tracks.video_track;
    expect(videoTrack?.clips.length).toBe(3);
    expect(timeline.output.endPosition).toBeCloseTo(45);
  });

  it('combineMode=single numOutputs=2 follows main video order', () => {
    const result = distributeTimelines(inputWithMetadata as InputWithMetadata, {
      combineMode: 'single',
      numOutputs: 2,
      strictNoSplit: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.outputs).toHaveLength(2);
    const durations = result.outputs.map((o) => o.timeline.output.endPosition);
    expect(durations).toEqual([20, 15]);
    result.outputs.forEach((output) => {
      const videoTrack = output.timeline.tracks.video_track;
      expect(videoTrack?.clips.length).toBe(1);
    });
  });

  it('combineMode=single numOutputs beyond mainVideoCount errors when strictNoSplit=true', () => {
    const result = distributeTimelines(inputWithMetadata as InputWithMetadata, {
      combineMode: 'single',
      numOutputs: 4,
      strictNoSplit: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INSUFFICIENT_MAIN_VIDEOS');
  });

  it('combineMode=pair builds pair combinations up to numOutputs', () => {
    const result = distributeTimelines(inputWithMetadata as InputWithMetadata, {
      combineMode: 'pair',
      numOutputs: 3,
      strictNoSplit: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.outputs).toHaveLength(3);
    const durations = result.outputs.map((o) => o.timeline.output.endPosition);
    expect(durations).toEqual([35, 30, 25]);
    result.outputs.forEach((output) => {
      const videoTrack = output.timeline.tracks.video_track;
      expect(videoTrack?.clips.length).toBe(2);
    });
  });
});
