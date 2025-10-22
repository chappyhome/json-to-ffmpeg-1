#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseSchema } = require('../dist/index.js');

console.log('=== 中文Narration测试 ===\n');
console.log('测试纯中文narration + 字幕同步...\n');

// 读取中文narration timeline
const rootDir = path.join(__dirname, '..');
const timelineFile = path.join(rootDir, 'worker/test/fixtures/narration-zh-only.json');
const timeline = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));

try {
  // 生成FFmpeg命令
  const command = parseSchema(timeline);

  // 写入输出文件
  const outputFile = path.join(rootDir, 'scripts/tests/test-narration-zh-output.sh');
  fs.writeFileSync(outputFile, command);

  console.log('✅ FFmpeg命令生成成功！');
  console.log(`📄 输出文件: ${outputFile}\n`);

  console.log('=== 生成的命令预览 ===\n');
  console.log(command);
  console.log('\n=== 配置检查 ===\n');

  // 检查关键配置
  const checks = [
    {
      name: '中文字幕URL',
      test: () => command.includes('narration-zh.srt'),
      detail: () => {
        const match = command.match(/-i "(https:\/\/[^"]+narration-zh\.srt)"/);
        return match ? match[1] : 'Not found';
      }
    },
    {
      name: 'Narration从0秒开始',
      test: () => timeline.tracks.narration_track.clips[0].timelineTrackStart === 0,
      detail: () => `timelineTrackStart: ${timeline.tracks.narration_track.clips[0].timelineTrackStart}秒`
    },
    {
      name: '字幕流映射',
      test: () => command.includes('-map') && command.includes(':s'),
      detail: () => {
        const match = command.match(/-map (\d+):s/);
        return match ? `映射输入${match[1]}的字幕流` : 'Not found';
      }
    },
    {
      name: '中文语言元数据',
      test: () => command.includes('language=chi'),
      detail: () => 'language=chi (ISO 639-2)'
    },
    {
      name: 'mov_text编码',
      test: () => command.includes('-c:s mov_text'),
      detail: () => 'MP4标准字幕编码'
    }
  ];

  checks.forEach(check => {
    const passed = check.test();
    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} ${check.name}`);
    if (passed && check.detail) {
      console.log(`   ${check.detail()}`);
    }
  });

  console.log('\n=== 重要提示 ===\n');

  console.log('⚠️  字幕时间码要求：');
  console.log('   由于narration从第0秒开始 (timelineTrackStart: 0)');
  console.log('   你的SRT文件时间码应该从 00:00:00 开始');
  console.log('   例如：');
  console.log('   1');
  console.log('   00:00:00,000 --> 00:00:03,000');
  console.log('   第一句中文字幕');
  console.log('   ');
  console.log('   2');
  console.log('   00:00:03,000 --> 00:00:06,000');
  console.log('   第二句中文字幕\n');

  console.log('📝 执行生成的命令：');
  console.log(`   chmod +x ${outputFile}`);
  console.log(`   ${outputFile}\n`);

  console.log('🔍 验证输出视频：');
  console.log('   ffprobe -v error -show_streams output-narration-zh.mp4');
  console.log('   ffplay output-narration-zh.mp4  # 按 "v" 键切换字幕显示\n');

  console.log('⚠️  如果字幕和语音不同步：');
  console.log('   1. 检查你的 narration-zh.srt 时间码是否从 00:00:00 开始');
  console.log('   2. 确认 SRT 文件格式正确（UTF-8编码）');
  console.log('   3. 验证 narration-zh.mp3 的实际时长\n');

} catch (error) {
  console.error('❌ 生成命令出错:', error.message);
  console.error(error.stack);
  process.exit(1);
}
