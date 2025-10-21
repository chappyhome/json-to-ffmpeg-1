const { parseSchema } = require('./dist/index.js');
const fs = require('fs');

console.log('=== Testing GIF Animation Support ===\n');

// Read the GIF timeline
const timeline = JSON.parse(
  fs.readFileSync('./worker/test/fixtures/gif-timeline.json', 'utf8')
);

console.log('Timeline inputs:');
Object.entries(timeline.inputs).forEach(([name, input]) => {
  console.log(`  - ${name}: type=${input.type}, file=${input.file}`);
  if (input.metadata) {
    console.log(`    metadata:`, input.metadata);
  }
});

console.log('\nTimeline clips:');
Object.entries(timeline.tracks).forEach(([trackName, track]) => {
  console.log(`  Track: ${trackName}`);
  track.clips.forEach(clip => {
    console.log(`    - ${clip.name}: source=${clip.source}, clipType=${clip.clipType}, duration=${clip.duration}s`);
  });
});

console.log('\n=== Generated FFmpeg Command ===\n');

try {
  // Generate FFmpeg command
  const command = parseSchema(timeline);

  console.log(command);

  // Save to file
  fs.writeFileSync('test-gif-output.sh', command);
  console.log('\n✓ Command saved to test-gif-output.sh');
  console.log('\nTo execute the command:');
  console.log('  chmod +x test-gif-output.sh');
  console.log('  ./test-gif-output.sh');

  // Analyze the command for GIF-specific features
  console.log('\n=== Command Analysis ===');

  if (command.includes('-ignore_loop 0')) {
    console.log('✓ Found looping GIF input (-ignore_loop 0)');
  }

  if (command.includes('-ignore_loop 1')) {
    console.log('✓ Found non-looping GIF input (-ignore_loop 1)');
  }

  if (command.includes('fps=24')) {
    console.log('✓ Found custom frame rate (fps=24) for GIF');
  }

  if (command.includes('loop=loop=')) {
    console.log('✓ Found loop filter for static images');
  }

  console.log('\n=== Test Complete ===');

} catch (error) {
  console.error('\n❌ Error generating command:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
