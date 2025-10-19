# Cloudflare Worker Adapter

This directory contains a thin Cloudflare Worker adapter for json-to-ffmpeg. It provides an HTTP API for building FFmpeg commands from JSON timelines, with an extensible plugin system.

## Features

- ✅ Thin adapter - uses json-to-ffmpeg as core library
- ✅ Input validation with Zod
- ✅ Plugin-based timeline transformations
- ✅ Returns both shell command and args array
- ✅ No Node.js dependencies (Workers compatible)
- ✅ Full test coverage

## Quick Start

```bash
# Install dependencies
cd worker
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## API Usage

### Test /build endpoint

```bash
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @worker/test/fixtures/simple-timeline.json
```

### Test /version endpoint

```bash
curl http://localhost:8787/version
```

Response:
```json
{
  "workerVersion": "1.0.0",
  "libraryVersion": "1.2.3"
}
```

## Architecture

```
json-to-ffmpeg (main library)
└── worker/ (Cloudflare Worker adapter)
    ├── src/
    │   ├── index.ts          # Worker entry point
    │   ├── validation.ts     # Zod schemas
    │   ├── tokenizer.ts      # Command parser
    │   ├── plugin-manager.ts # Plugin orchestration
    │   └── plugins/          # Extensible plugins
    └── test/                 # Test suite
```

## Adding Plugins

Create a new plugin in `worker/src/plugins/`:

```typescript
// src/plugins/my-plugin.ts
import type { Plugin } from '../types';

export const myPlugin: Plugin = (timeline: any) => {
  // Transform timeline here
  return {
    timeline: { ...timeline, /* modifications */ },
    warnings: ['Optional warning message']
  };
};
```

Register in `src/index.ts`:

```typescript
manager.register(myPlugin);
```

## Library Integration

The worker uses json-to-ffmpeg via npm dependency:

```json
{
  "dependencies": {
    "json-to-ffmpeg": "file:.."
  }
}
```

This enables:
- ✅ Using latest library code
- ✅ Type safety with shared types
- ✅ New `buildTokens()` export for args array

## Tests

Two sample timelines included:
- `simple-timeline.json` - Single video clip
- `complex-timeline.json` - Multiple tracks with transitions

Both test that:
- Command string is non-empty
- Args array is valid
- filter_complex is present

## Deployment

Update `wrangler.toml` with your Cloudflare account details, then:

```bash
npm run deploy
```

## Documentation

Full documentation: `worker/README.md`

## License

MIT (same as parent project)
