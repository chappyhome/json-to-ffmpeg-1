#!/usr/bin/env node

const { parseSchema } = require('../dist/index.js');
const fs = require('fs');
const path = require('path');

// 读取 text-timeline.json（相对于 scripts/ 目录）
const timelinePath = path.join(__dirname, '../worker/test/fixtures/text-timeline.json');

try {
  const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));

  // 生成 FFmpeg 命令
  const command = parseSchema(timeline);

  console.log('=== Generated FFmpeg Command ===\n');
  console.log(command);

  // 保存命令到项目根目录
  const outputPath = path.join(__dirname, '../test-text-output.sh');
  fs.writeFileSync(outputPath, command);
  console.log(`\n✓ Command saved to ${outputPath}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
