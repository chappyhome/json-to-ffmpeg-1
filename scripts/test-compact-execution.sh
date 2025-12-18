#!/bin/bash
# 测试 parseSchemaCompact 生成的命令是否可以在 shell 中执行

echo "生成测试命令..."
node -e "
const { parseSchemaCompact } = require('.');
const schema = {
  version: 1,
  inputs: {
    video1: {
      type: 'video',
      file: 'https://pub-8771ad71fcfd48d7b296fcba63e1b1f2.r2.dev/outputs/test/output.mp4',
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
        duration: 5,
        sourceStartOffset: 0,
        clipType: 'video',
        transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 }
      }]
    }
  },
  transitions: [],
  output: {
    tempDir: './tmp',
    file: './outputs/test-compact.mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    width: 1920,
    height: 1080,
    audioBitrate: '320k',
    preset: 'veryfast',
    crf: 23,
    framerate: 30,
    startPosition: 0,
    endPosition: 5,
    scaleRatio: 1,
    flags: ['-pix_fmt', 'yuv420p']
  }
};
console.log(parseSchemaCompact(schema));
" > /tmp/test-ffmpeg-compact.sh

echo "生成的命令:"
cat /tmp/test-ffmpeg-compact.sh
echo ""
echo "----------------------------------------"
echo "测试命令语法..."

# 测试 bash 语法
if bash -n /tmp/test-ffmpeg-compact.sh; then