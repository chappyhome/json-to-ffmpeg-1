#!/usr/bin/env node

/**
 * Generate timeline JSON outputs from an asset manifest.
 *
 * Usage:
 *   node scripts/distribute-from-manifest.js \
 *     [manifestPath=worker/test/fixtures/input-with-metadata.json] \
 *     [outputDir=outputs/distributed]
 *     [--numOutputs=3] [--combineMode=pair|single|all] [--strictNoSplit|--allowSplit]
 *
 * The manifest's uiConfig (combineMode/strictNoSplit/variantCount/etc.)
 * drives how many outputs are produced; you can also override via the
 * manifest itself before calling this script.
 */

const fs = require('fs');
const path = require('path');
const { distributeTimelines } = require('..');

const argv = process.argv.slice(2);
const positional = argv.filter((arg) => !arg.startsWith('--'));

const manifestPath =
  positional[0] ||
  path.join(__dirname, '..', 'worker', 'test', 'fixtures', 'input-with-metadata.json');
const outputDir =
  positional[1] ||
  path.join(__dirname, '..', 'outputs', 'distributed');

const overrides = argv.reduce((acc, arg) => {
  if (arg.startsWith('--numOutputs=')) {
    acc.numOutputs = Number(arg.split('=')[1]);
  } else if (arg.startsWith('--combineMode=')) {
    acc.combineMode = arg.split('=')[1];
  } else if (arg === '--strictNoSplit') {
    acc.strictNoSplit = true;
  } else if (arg === '--allowSplit') {
    acc.strictNoSplit = false;
  }
  return acc;
}, {});

if (!fs.existsSync(manifestPath)) {
  console.error(`[error] manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const result = distributeTimelines(manifest, overrides);

if (!result.ok) {
  console.error('[error] distribution failed:', result.error);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

console.log('[info] strategy:', result.strategy);

result.outputs.forEach((output, idx) => {
  const fileName = `${output.variantKey || `variant-${idx + 1}`}.json`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(output.timeline, null, 2), 'utf8');
  console.log(
    `[ok] wrote ${filePath} (duration=${output.timeline.output.endPosition}s, combineMode=${result.strategy.combineMode})`,
  );
});

console.log('[done] distribution completed.');
