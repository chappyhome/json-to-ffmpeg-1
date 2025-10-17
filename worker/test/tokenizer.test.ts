import { describe, it, expect } from 'vitest';
import { tokenizeCommand, parseFFmpegArgs } from '../src/tokenizer';

describe('Tokenizer tests', () => {
  it('should tokenize simple command', () => {
    const cmd = 'ffmpeg -i input.mp4 output.mp4';
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toEqual(['ffmpeg', '-i', 'input.mp4', 'output.mp4']);
  });

  it('should handle quoted strings', () => {
    const cmd = 'ffmpeg -i "file with spaces.mp4" output.mp4';
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toEqual(['ffmpeg', '-i', 'file with spaces.mp4', 'output.mp4']);
  });

  it('should handle single quotes', () => {
    const cmd = "ffmpeg -i 'file.mp4' output.mp4";
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toEqual(['ffmpeg', '-i', 'file.mp4', 'output.mp4']);
  });

  it('should handle backslash line continuations', () => {
    const cmd = 'ffmpeg -i file.mp4 \\ \noutput.mp4';
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toContain('ffmpeg');
    expect(tokens).toContain('-i');
    expect(tokens).toContain('file.mp4');
    expect(tokens).toContain('output.mp4');
  });

  it('should handle line continuations', () => {
    const cmd = 'ffmpeg -i input.mp4 \\\n-c:v libx264 \\\noutput.mp4';
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toContain('ffmpeg');
    expect(tokens).toContain('-i');
    expect(tokens).toContain('input.mp4');
    expect(tokens).toContain('-c:v');
    expect(tokens).toContain('libx264');
    expect(tokens).toContain('output.mp4');
  });

  it('should parse ffmpeg args correctly', () => {
    const cmd = 'ffmpeg -y -i input.mp4 -c:v libx264 output.mp4';
    const args = parseFFmpegArgs(cmd);

    expect(args[0]).toBe('-y');
    expect(args).toContain('-i');
    expect(args).toContain('input.mp4');
    expect(args).toContain('output.mp4');
  });

  it('should handle bash shebang', () => {
    const cmd = '#!/bin/bash\nffmpeg -i input.mp4 output.mp4';
    const tokens = tokenizeCommand(cmd);

    expect(tokens).toEqual(['ffmpeg', '-i', 'input.mp4', 'output.mp4']);
  });
});
