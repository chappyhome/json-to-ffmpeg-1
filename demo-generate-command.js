#!/usr/bin/env node

/**
 * 演示: 输入 JSON timeline, 输出可执行的 FFmpeg 命令字符串
 *
 * 用法:
 *   node demo-generate-command.js worker/test/fixtures/simple-timeline.json
 *   node demo-generate-command.js worker/test/fixtures/simple-timeline.json > output.sh
 */

const { parseSchema } = require('./dist/src/index.js');
const fs = require('fs');
const path = require('path');

// 获取命令行参数
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('用法: node demo-generate-command.js <timeline.json>');
  console.error('');
  console.error('示例:');
  console.error('  node demo-generate-command.js worker/test/fixtures/simple-timeline.json');
  console.error('  node demo-generate-command.js worker/test/fixtures/simple-timeline.json > output.sh');
  process.exit(1);
}

// 检查文件是否存在
if (!fs.existsSync(inputFile)) {
  console.error(`错误: 文件不存在: ${inputFile}`);
  process.exit(1);
}

try {
  // 读取 JSON 文件
  const timelineJson = fs.readFileSync(inputFile, 'utf8');
  const timeline = JSON.parse(timelineJson);

  // 生成 FFmpeg 命令字符串
  const ffmpegCommand = parseSchema(timeline);

  // 输出命令
  console.log(ffmpegCommand);

} catch (error) {
  console.error(`错误: ${error.message}`);
  process.exit(1);
}
