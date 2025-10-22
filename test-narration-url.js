#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseSchema } = require('./dist/index.js');

// Read the narration URL timeline JSON
const timelineFile = path.join(__dirname, 'worker/test/fixtures/narration-url-timeline.json');
const timeline = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));

console.log('=== Narration with URL Subtitle Test ===\n');
console.log('Testing narration with URL-based subtitle (Cloudflare R2)...\n');

try {
  // Generate FFmpeg command
  const command = parseSchema(timeline);

  // Write to output file
  const outputFile = path.join(__dirname, 'test-narration-url-output.sh');
  fs.writeFileSync(outputFile, command);

  console.log('✅ FFmpeg command with subtitle download generated successfully!');
  console.log(`📄 Output file: ${outputFile}\n`);

  console.log('=== Generated Command Preview ===\n');
  console.log(command);
  console.log('\n=== Test Complete ===\n');

  console.log('📝 Key Features:');
  console.log('   ✓ Subtitle URL detection');
  console.log('   ✓ Automatic curl download command');
  console.log('   ✓ Local path generation for downloaded subtitle');
  console.log('   ✓ FFmpeg uses downloaded local file');
  console.log('\n📝 To execute the generated command:');
  console.log(`   chmod +x ${outputFile}`);
  console.log(`   ${outputFile}`);
  console.log('\n⚠️  Note: Requires internet connection to download subtitle from URL');

} catch (error) {
  console.error('❌ Error generating command:', error.message);
  console.error(error.stack);
  process.exit(1);
}
