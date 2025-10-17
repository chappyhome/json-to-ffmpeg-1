import { describe, it, expect } from 'vitest';
import { parseSchema, buildTokens } from 'json-to-ffmpeg';
import simpleTimeline from './fixtures/simple-timeline.json';
import complexTimeline from './fixtures/complex-timeline.json';

describe('Build command tests', () => {
  it('should generate non-empty command for simple timeline', () => {
    const command = parseSchema(simpleTimeline);

    expect(command).toBeTruthy();
    expect(command.length).toBeGreaterThan(0);
    expect(command).toContain('ffmpeg');
    expect(command).toContain('-filter_complex');
  });

  it('should generate non-empty command for complex timeline', () => {
    const command = parseSchema(complexTimeline);

    expect(command).toBeTruthy();
    expect(command.length).toBeGreaterThan(0);
    expect(command).toContain('ffmpeg');
    expect(command).toContain('-filter_complex');
  });

  it('should generate valid args array for simple timeline', () => {
    const args = buildTokens(simpleTimeline);

    expect(args).toBeTruthy();
    expect(Array.isArray(args)).toBe(true);
    expect(args.length).toBeGreaterThan(0);

    // Should contain key ffmpeg arguments
    expect(args).toContain('-y');
    expect(args).toContain('-filter_complex');

    // Should have output file
    expect(args).toContain('output.mp4');
  });

  it('should generate valid args array for complex timeline with filter_complex', () => {
    const args = buildTokens(complexTimeline);

    expect(args).toBeTruthy();
    expect(Array.isArray(args)).toBe(true);
    expect(args.length).toBeGreaterThan(0);

    // Should contain filter_complex
    const filterIndex = args.indexOf('-filter_complex');
    expect(filterIndex).toBeGreaterThan(-1);

    // Filter complex should be followed by the actual filter string
    expect(args[filterIndex + 1]).toBeTruthy();
    expect(args[filterIndex + 1].length).toBeGreaterThan(0);

    // Should contain video codec
    expect(args).toContain('-c:v');
    expect(args.indexOf('-c:v')).toBeGreaterThan(-1);
  });

  it('should handle both command string and args array formats', () => {
    const command = parseSchema(simpleTimeline);
    const args = buildTokens(simpleTimeline);

    // Both should be non-empty
    expect(command.length).toBeGreaterThan(0);
    expect(args.length).toBeGreaterThan(0);

    // Command should be a string
    expect(typeof command).toBe('string');

    // Args should be an array of strings
    expect(Array.isArray(args)).toBe(true);
    args.forEach(arg => {
      expect(typeof arg).toBe('string');
    });
  });
});
