# json-to-ffmpeg Worker API

Cloudflare Worker API adapter for [json-to-ffmpeg](https://github.com/pilotpirxie/json-to-ffmpeg). Provides a thin, extensible HTTP API layer with plugin-based timeline transformations.

## Features

- **Thin Adapter**: Uses json-to-ffmpeg as core library, no command rewriting
- **Plugin System**: Extensible architecture for adding tracks/properties
- **Validation**: Lightweight zod-based input validation
- **Token Output**: Returns both shell command and args array
- **No Node Dependencies**: Pure Cloudflare Workers compatible

## Quick Start

```bash
cd worker
npm install
npm run dev

# In another terminal - test the API
./examples/curl-test.sh

# Or generate and execute FFmpeg command
./examples/test-with-ffmpeg.sh simple
```

## Public API

在线部署: https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev

详细接口文档: docs/API.md（项目根目录）

## API Endpoints

### POST /build

Build FFmpeg command from timeline JSON.

**Request:**
```bash
# Using the provided test fixture
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @test/fixtures/simple-timeline.json

# Or inline JSON with real samples
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "inputs": {
      "source1": {
        "type": "video",
        "file": "samples/bee1920.mp4",
        "hasAudio": false,
        "hasVideo": true,
        "duration": 40
      },
      "source2": {
        "type": "video",
        "file": "samples/book1920.mp4",
        "hasAudio": false,
        "hasVideo": true,
        "duration": 13
      }
    },
    "tracks": {
      "track_with_some_videos": {
        "type": "video",
        "clips": [{
          "name": "clip4",
          "source": "source1",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 27,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0,
            "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }]
      }
    },
    "transitions": [],
    "output": {
      "file": "output.mp4",
      "width": 1920,
      "height": 1080,
      "framerate": 30,
      "endPosition": 5
    }
  }'
```

**Response:**
```json
{
  "command": "#!/bin/bash\n...",
  "args": ["-y", "-i", "input.mp4", ...],
  "warnings": []
}
```

### GET /version

Get version information.

**Request:**
```bash
curl http://localhost:8787/version
```

**Response:**
```json
{
  "workerVersion": "1.0.0",
  "libraryVersion": "1.2.3"
}
```

### GET /health

Health check endpoint.

**Request:**
```bash
curl http://localhost:8787/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-06-20T12:00:00.000Z"
}
```

## Adding a New Plugin

Follow these 5 steps to add a new track/property plugin:

1. **Create plugin file**: `src/plugins/my-plugin.ts`
```typescript
import type { Plugin, PluginResult } from '../types';

export const myPlugin: Plugin = (timeline: any): PluginResult => {
  // Transform timeline
  const modified = { ...timeline };

  // Add warnings if needed
  const warnings: string[] = [];

  return { timeline: modified, warnings };
};
```

2. **Export plugin**: Add to `src/plugins/index.ts`
```typescript
export { myPlugin } from './my-plugin';
```

3. **Register plugin**: Add to `src/index.ts` createPluginManager()
```typescript
manager.register(myPlugin);
```

4. **Test plugin**: Add tests in `test/`

5. **Done**: Plugins run in order before library call

## Project Structure

```
worker/
├── src/
│   ├── index.ts              # Main Worker logic
│   ├── types.ts              # TypeScript types
│   ├── validation.ts         # Zod schemas
│   ├── tokenizer.ts          # Command parser
│   ├── plugin-manager.ts     # Plugin executor
│   └── plugins/
│       ├── index.ts          # Plugin exports
│       ├── normalize-output.ts
│       └── validate-tracks.ts
├── test/
│   ├── build.test.ts
│   ├── tokenizer.test.ts
│   └── fixtures/
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Run tests
npm test

# Deploy
npm run deploy
```

## Plugin Protocol

Plugins follow a simple protocol:

```typescript
type Plugin = (timeline: any) => PluginResult | any;

type PluginResult = {
  timeline: any;
  warnings?: string[];
};
```

- **Input**: Timeline JSON
- **Output**: Transformed timeline + optional warnings
- **Execution**: Sequential, in registration order
- **Error handling**: Throw Error to abort request

## Examples

### Test Fixtures

See `test/fixtures/` for example timelines:
- `simple-timeline.json` - 2 video clips with fade transition (from `short.spec.ts`)
- `complex-timeline.json` - Full-featured timeline with 5 clips, watermark, audio tracks, and multiple transitions (from `complex.spec.ts`)

Both use real samples from the parent `samples/` directory (bee1920.mp4, book1920.mp4, cows1920.mp4, etc.)

For details on samples and creating your own timelines, see [SAMPLES.md](./SAMPLES.md)

### Example Scripts

Located in `examples/`:

#### 1. `curl-test.sh` - API Testing
Tests all endpoints (health, version, build)
```bash
./examples/curl-test.sh
```

#### 2. `generate-ffmpeg.sh` - Generate Commands
Generates FFmpeg command and optionally executes it
```bash
# Simple timeline
./examples/generate-ffmpeg.sh simple

# Complex timeline
./examples/generate-ffmpeg.sh complex
```

Interactive prompt asks if you want to execute the command immediately.

#### 3. `extract-command.sh` - Extract Command Only
Extracts FFmpeg command from API response and saves to file
```bash
./examples/extract-command.sh path/to/timeline.json output.sh
bash output.sh  # Execute manually
```

#### 4. `test-with-ffmpeg.sh` - Complete Workflow (Recommended)
Full automated workflow with prerequisite checks
```bash
# Test simple timeline
./examples/test-with-ffmpeg.sh simple

# Test complex timeline
./examples/test-with-ffmpeg.sh complex
```

This script:
- ✓ Checks if worker is running
- ✓ Checks if FFmpeg is installed
- ✓ Verifies sample files exist
- ✓ Generates FFmpeg command
- ✓ Executes command and reports results

## License

MIT
