const { parseSchema } = require('./dist/index.js');
const fs = require('fs');

console.log('=== Testing Audio Type Classification ===\n');

// Read the audio types timeline
const timeline = JSON.parse(
  fs.readFileSync('./worker/test/fixtures/audio-types-timeline.json', 'utf8')
);

console.log('Timeline inputs:');
Object.entries(timeline.inputs).forEach(([name, input]) => {
  console.log(`  - ${name}: type=${input.type}, file=${input.file}, duration=${input.duration}s`);
  if (input.metadata) {
    console.log(`    metadata:`, input.metadata);
  }
});

console.log('\nTimeline tracks:');
Object.entries(timeline.tracks).forEach(([trackName, track]) => {
  console.log(`  Track: ${trackName} (type=${track.type})`);
  track.clips.forEach(clip => {
    console.log(`    - ${clip.name}: source=${clip.source}, start=${clip.timelineTrackStart}s, duration=${clip.duration}s, volume=${clip.volume}`);
  });
});

console.log('\n=== Generated FFmpeg Command ===\n');

try {
  // Generate FFmpeg command
  const command = parseSchema(timeline);

  console.log(command);

  // Save to file
  fs.writeFileSync('test-audio-types-output.sh', command);
  console.log('\n✓ Command saved to test-audio-types-output.sh');
  console.log('\nTo execute the command:');
  console.log('  chmod +x test-audio-types-output.sh');
  console.log('  ./test-audio-types-output.sh');

  // Analyze the command for audio-specific features
  console.log('\n=== Command Analysis ===');

  // BGM features
  if (command.includes('afade=t=in')) {
    console.log('✓ Found fade-in filter (afade=t=in)');
  }

  if (command.includes('afade=t=out')) {
    console.log('✓ Found fade-out filter (afade=t=out)');
  }

  if (command.includes('aloop=')) {
    console.log('✓ Found audio loop filter (aloop)');
  }

  // SFX features
  if (command.includes('adelay=')) {
    console.log('✓ Found audio delay filter (adelay) for SFX timing');
  }

  // Check video output
  if (command.includes('[video_output]')) {
    console.log('✓ Found video output mapping');
  }

  if (command.includes('[audio_output]')) {
    console.log('✓ Found audio output mapping');
  }

  // Count clips
  const videoClips = command.match(/video_clip/g);
  const bgmClips = command.match(/bgm_clip/g);
  const sfxClips = command.match(/(click|notification|whoosh)/g);

  console.log(`\n✓ Video clips: ${videoClips ? videoClips.length : 0}`);
  console.log(`✓ BGM clips: ${bgmClips ? bgmClips.length : 0}`);
  console.log(`✓ SFX clips: ${sfxClips ? sfxClips.length : 0}`);

  console.log('\n=== Test Complete ===');

} catch (error) {
  console.error('\n❌ Error generating command:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
