#!/usr/bin/env node

const { parseSchema } = require('../dist/index.js');
const fs = require('fs');
const path = require('path');

// 读取 text-timeline-custom-font.json
const timelinePath = path.join(__dirname, '../worker/test/fixtures/text-timeline-custom-font.json');

try {
  const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));

  // 生成 FFmpeg 命令
  const command = parseSchema(timeline);

  console.log('=== Custom Font Test - Generated FFmpeg Command ===\n');

  // 只显示包含字体配置的行
  console.log('📝 Font configurations:');
  console.log('─'.repeat(80));
  const lines = command.split('\n');
  lines.forEach(line => {
    if (line.includes('drawtext')) {
      // 提取 drawtext 部分
      const match = line.match(/drawtext=([^[]+)/);
      if (match) {
        console.log('\n' + match[1].split(':').join('\n  :'));
      }
    }
  });
  console.log('\n' + '─'.repeat(80));

  // 保存完整命令
  const outputPath = path.join(__dirname, '../test-custom-font-output.sh');
  fs.writeFileSync(outputPath, command);
  console.log(`\n✓ Full command saved to ${outputPath}`);

  // 总结
  console.log('\n📊 Summary:');
  const systemFont = command.match(/font='([^']+)'/);
  const customFont = command.match(/fontfile=([^:]+)/);

  if (systemFont) {
    console.log(`  ✓ System font: ${systemFont[1]}`);
  }
  if (customFont) {
    console.log(`  ✓ Custom font file: ${customFont[1]}`);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
