#!/usr/bin/env node
const { parseSchemaCompact, parseSchema } = require('..');

const schema = {
  version: 1,
  inputs: {
    video1: {
      type: 'video',
      file: 'https://pub-8771ad71fcfd48d7b296fcba63e1b1f2.r2.dev/outputs/1cfa7a4c-8284-4ed1-80fd-bb29fca2ccf1/output.mp4',
      hasAudio: true,
      hasVideo: true,
      duration: 10
    }
  },
  tracks: {
    main_track: {
      type: 'video',
      clips: [{
        name: 'clip1',
        source: 'video1',
        timelineTrackStart: 0,
        duration: 10,
        sourceStartOffset: 0,
        clipType: 'video',
        transform: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          opacity: 1
        }
      }]
    }
  },
  transitions: [],
  output: {
    tempDir: './tmp',
    file: 'output.mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    width: 1920,
    height: 1080,
    audioBitrate: '320k',
    preset: 'veryfast',
    crf: 23,
    framerate: 30,
    startPosition: 0,
    endPosition: 10,
    scaleRatio: 1,
    flags: ['-pix_fmt', 'yuv420p']
  }
};

console.log('='.repeat(80));
console.log('新格式: parseSchemaCompact() - 紧凑格式，适合容器');
console.log('='.repeat(80));
console.log();

try {
  const compactCommand = parseSchemaCompact(schema);
  console.log(compactCommand);
  console.log();
  console.log('✅ 特点:');
  console.log('  - URL 自动加引号');
  console.log('  - -map 参数无引号');
  console.log('  - 参数分组换行');
  console.log('  - 输出路径支持绝对路径');
} catch (err) {
  console.error('❌ 错误:', err.message);
}

console.log();
console.log('='.repeat(80));
console.log('旧格式: parseSchema() - 原始格式');
console.log('='.repeat(80));
console.log();

try {
  const oldCommand = parseSchema(schema);
  console.log(oldCommand.substring(0, 500) + '...');
} catch (err) {
  console.error('❌ 错误:', err.message);
}
