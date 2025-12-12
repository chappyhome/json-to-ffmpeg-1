#!/usr/bin/env node
// Thin wrapper to run the root-level distributor from the worker directory.
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootScript = resolve(__dirname, '..', '..', 'scripts', 'distribute-from-manifest.js');

// Reuse same argv; the root script reads process.argv[2]/[3]
await import(pathToFileURL(rootScript).href);
