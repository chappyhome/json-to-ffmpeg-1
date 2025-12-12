#!/usr/bin/env node
/**
 * Generate FFmpeg commands from a manifest using the distribute+build pipeline.
 * Default manifest: worker/test/fixtures/input-with-metadata-pair3.json
 * Usage:
 *   node scripts/distribute-build-from-manifest.js [manifest.json] [--numOutputs=3] [--combineMode=pair|single|all] [--strictNoSplit] [--allowSplit]
 */

const fs = require('fs');
const path = require('path');
const {
  distributeTimelines,
  parseSchema,
} = require('..');

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    if (arg.startsWith('--numOutputs=')) {
      args.numOutputs = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--combineMode=')) {
      args.combineMode = arg.split('=')[1];
    } else if (arg === '--strictNoSplit') {
      args.strictNoSplit = true;
    } else if (arg === '--allowSplit') {
      args.strictNoSplit = false;
    }
  }
  return args;
}

async function main() {
  const [, , manifestArg, ...rest] = process.argv;
  const manifestPath = manifestArg && !manifestArg.startsWith('--')
    ? manifestArg
    : path.join(__dirname, '..', 'worker', 'test', 'fixtures', 'input-with-metadata-pair3.json');

  const overrides = parseArgs(
    manifestArg && manifestArg.startsWith('--')
      ? [manifestArg, ...rest]
      : rest,
  );

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  const result = distributeTimelines(manifest, overrides);
  if (!result.ok) {
    console.error('[error] distribute failed:', result.error);
    process.exit(1);
  }

  console.log('[info] strategy:', result.strategy);
  console.log(`[info] outputs: ${result.outputs.length}`);

  result.outputs.forEach((item, idx) => {
    try {
      const command = parseSchema(item.timeline);
      console.log('\n==============================');
      console.log(`[${idx}] variantKey=${item.variantKey}`);
      console.log(command);
    } catch (err) {
      console.error(`\n[${idx}] variantKey=${item.variantKey} build error:`, err);
    }
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
