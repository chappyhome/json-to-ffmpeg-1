#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseSchema } = require('../dist/index.js');

// Read the narration timeline JSON
const rootDir = path.join(__dirname, '..');
const timelineFile = path.join(rootDir, 'worker/test/fixtures/narration-timeline.json');
const timeline = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));

console.log('=== Narration Feature Test ===\n');
console.log('Testing narration audio type with subtitle integration...\n');

try {
  // Generate FFmpeg command
  const command = parseSchema(timeline);

  // Write to output file
  const outputFile = path.join(rootDir, 'scripts/tests/test-narration-output.sh');
  fs.writeFileSync(outputFile, command);

  console.log('✅ FFmpeg command generated successfully!');
  console.log(`📄 Output file: ${outputFile}\n`);

  console.log('=== Generated Command Preview ===\n');
  console.log(command);
  console.log('\n=== Test Complete ===\n');

  console.log('📝 To execute the generated command:');
  console.log(`   chmod +x ${outputFile}`);
  console.log(`   ${outputFile}`);
  console.log('\n⚠️  Note: Requires actual audio/video files in samples/ directory');

} catch (error) {
  console.error('❌ Error generating command:', error.message);
  console.error(error.stack);
  process.exit(1);
}
