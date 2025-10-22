#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseSchema } = require('./dist/index.js');

console.log('=== Soft Subtitle Feature Test ===\n');
console.log('Testing narration audio type with soft subtitle (mov_text) support...\n');

// Read the soft subtitle timeline JSON
const timelineFile = path.join(__dirname, 'worker/test/fixtures/soft-subtitle-timeline.json');
const timeline = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));

try {
  // Generate FFmpeg command
  const command = parseSchema(timeline);

  // Write to output file
  const outputFile = path.join(__dirname, 'test-soft-subtitle-output.sh');
  fs.writeFileSync(outputFile, command);

  console.log('✅ FFmpeg command generated successfully!');
  console.log(`📄 Output file: ${outputFile}\n`);

  console.log('=== Generated Command Preview ===\n');
  console.log(command);
  console.log('\n=== Verification Checklist ===\n');

  // Verify soft subtitle features
  const checks = [
    {
      name: 'Direct URL support',
      test: () => command.includes('-i "https://') && command.includes('.srt"'),
      description: 'Subtitle URLs should be added as FFmpeg inputs'
    },
    {
      name: 'No curl downloads',
      test: () => !command.includes('curl'),
      description: 'Soft subtitles should not require downloading'
    },
    {
      name: 'Subtitle stream mapping',
      test: () => command.includes('-map') && /map \d+:s/.test(command),
      description: 'Subtitle streams should be mapped to output'
    },
    {
      name: 'mov_text codec',
      test: () => command.includes('-c:s mov_text'),
      description: 'MP4 should use mov_text subtitle codec'
    },
    {
      name: 'Language metadata (English)',
      test: () => command.includes('language=eng'),
      description: 'English subtitle should have correct language code'
    },
    {
      name: 'Language metadata (Chinese)',
      test: () => command.includes('language=chi'),
      description: 'Chinese subtitle should have correct language code'
    },
    {
      name: 'No subtitle filters',
      test: () => !command.includes('subtitles='),
      description: 'Should not use hardcoded subtitle filters'
    },
    {
      name: 'No force_style',
      test: () => !command.includes('force_style'),
      description: 'Soft subtitles do not support custom styling'
    }
  ];

  let passCount = 0;
  checks.forEach(check => {
    const passed = check.test();
    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} ${check.name}`);
    console.log(`   ${check.description}`);
    if (!passed) {
      console.log(`   ⚠️  Check failed!`);
    }
    if (passed) passCount++;
  });

  console.log(`\n📊 Results: ${passCount}/${checks.length} checks passed\n`);

  if (passCount === checks.length) {
    console.log('🎉 All checks passed! Soft subtitle implementation is correct.\n');
  } else {
    console.log('⚠️  Some checks failed. Please review the implementation.\n');
    process.exit(1);
  }

  console.log('=== Test Complete ===\n');

  console.log('📝 Expected FFmpeg behavior:');
  console.log('   • Subtitle URLs are fetched directly by FFmpeg (no curl)');
  console.log('   • Subtitles are embedded as separate streams (mov_text codec)');
  console.log('   • Multiple language tracks are supported');
  console.log('   • Subtitles can be toggled on/off by the player');
  console.log('   • No video re-encoding required (fast processing)');
  console.log('   • Styling is controlled by the player, not the video\n');

  console.log('📝 To execute the generated command:');
  console.log(`   chmod +x ${outputFile}`);
  console.log(`   ${outputFile}`);
  console.log('\n⚠️  Note: Requires:');
  console.log('   • Actual audio/video files in samples/ directory');
  console.log('   • Valid subtitle URLs (or replace with local .srt files)');
  console.log('   • FFmpeg with mov_text codec support');

} catch (error) {
  console.error('❌ Error generating command:', error.message);
  console.error(error.stack);
  process.exit(1);
}
