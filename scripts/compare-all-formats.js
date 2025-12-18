#!/usr/bin/env node
/**
 * 对比三种 API 的输出格式
 */

const { parseSchema, parseSchemaCompact, buildTokens } = require('..');

const schema = {
  version: 1,
  inputs: {
    video1: {
      type: 'video',
      file: 'https://cdn.example.com/input.mp4',
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
console.log('API 对比：三种方式生成 FFmpeg 命令');
console.log('='.repeat(80));
console.log();

// 1. parseSchemaCompact - 新的紧凑格式
console.log('1️⃣  parseSchemaCompact() - 紧凑格式（推荐用于容器）');
console.log('-'.repeat(80));
const compact = parseSchemaCompact(schema);
console.log(compact);
console.log();
console.log('✅ 特点:');
console.log('  - URL 自动加引号: "https://..."');
console.log('  - map 参数带引号: -map "[video_output]"');
console.log('  - 参数分组换行，易读');
console.log('  - 输出文件名: output.mp4');
console.log();

// 2. parseSchema - 原始格式
console.log('='.repeat(80));
console.log('2️⃣  parseSchema() - 原始格式（用于 shell 脚本）');
console.log('-'.repeat(80));
const original = parseSchema(schema);
console.log(original.substring(0, 400) + '...\n');
console.log('⚠️  特点:');
console.log('  - URL 无引号');
console.log('  - map 参数有引号: -map \'[video_output]\'');
console.log('  - 参数在一行');
console.log();

// 3. buildTokens - 数组格式
console.log('='.repeat(80));
console.log('3️⃣  buildTokens() - 数组格式（用于程序调用）');
console.log('-'.repeat(80));
const tokens = buildTokens(schema);
console.log('返回类型: Array');
console.log('参数数量:', tokens.length);
console.log('前 10 个参数:');
tokens.slice(0, 10).forEach((arg, i) => {
  console.log(`  [${i}] ${arg}`);
});
console.log('  ...');
console.log();
console.log('✅ 特点:');
console.log('  - 返回数组，无转义字符');
console.log('  - 直接传递给 spawn()');
console.log('  - 可序列化为 JSON');
console.log();

// 使用场景推荐
console.log('='.