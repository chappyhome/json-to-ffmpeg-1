#!/usr/bin/env node

const { parseSchema } = require('../dist/src/index.js');
const fs = require('fs');

// 读取 text-timeline.json
const path = require('path');
const timelinePath = path.join(__dirname, 'worker/test/fixtures/text-timeline.json');
const timeline = JSON.parse(
  fs.readFileSync(timelinePath, 'utf8')
);

try {
  // 生成 FFmpeg 命令
  const command = parseSchema(timeline);

  console.log('=== Generated FFmpeg Command ===\n');
  console.log(command);

  // 保存命令到文件
  fs.writeFileSync('./test-text-output.sh', command);
  console.log('\n✓ Command saved to test-text-output.sh');

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
