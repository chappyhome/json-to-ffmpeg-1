# Implementation Details

## What Was Built

A thin Cloudflare Worker API adapter for json-to-ffmpeg with:

1. **Core Adapter** (`src/index.ts`)
   - POST /build - Generate FFmpeg commands from JSON
   - GET /version - Version information
   - GET /health - Health check

2. **Plugin System** (`src/plugin-manager.ts`)
   - Sequential plugin execution
   - Warning accumulation
   - Flexible plugin protocol

3. **Library Enhancement** (`../src/buildTokens.ts`)
   - New `buildTokens()` export
   - Returns args array instead of shell string
   - Fallback tokenizer in Worker if unavailable

4. **Validation** (`src/validation.ts`)
   - Lightweight Zod schemas
   - Minimal required fields
   - Plugins can add more validation

5. **Built-in Plugins**
   - `normalize-output` - Adds default output settings
   - `validate-tracks` - Ensures track structure is valid

6. **Comprehensive Tests**
   - Command generation tests
   - Tokenizer tests
   - Two sample timelines

## Key Design Decisions

### 1. Thin Adapter Philosophy
- Worker does NOT rewrite library code
- Worker does NOT hand-craft FFmpeg commands
- Worker does NOT execute FFmpeg
- Worker ONLY: validate → transform → call library

### 2. Library as npm Dependency
```json
"json-to-ffmpeg": "file:.."
```
- Allows using library code directly
- Shared types for safety
- Can add optional exports like `buildTokens()`

### 3. Plugin Protocol
```typescript
type Plugin = (timeline: any) => PluginResult | any;
```
- Simple function signature
- Can return just timeline or { timeline, warnings }
- Executed in order
- Allows extensibility without core changes

### 4. Return Format
```json
{
  "command": "#!/bin/bash\n...",
  "args": ["-y", "-i", "input.mp4", ...],
  "warnings": ["optional warnings"]
}
```
- Command for humans/debugging
- Args for programmatic use
- Warnings for plugin messages

### 5. Tokenizer as Fallback
- Prefer `buildTokens()` from library
- Fall back to parsing command string
- Handles quotes, escapes, line continuations

## File Structure

```
json-to-ffmpeg/
├── src/
│   ├── buildTokens.ts        # NEW: Export args array
│   └── index.ts              # MODIFIED: Export buildTokens
└── worker/
    ├── src/
    │   ├── index.ts          # Worker entry point
    │   ├── types.ts          # Type definitions
    │   ├── validation.ts     # Zod schemas
    │   ├── tokenizer.ts      # Fallback parser
    │   ├── plugin-manager.ts # Plugin orchestrator
    │   └── plugins/
    │       ├── index.ts      # Plugin exports
    │       ├── normalize-output.ts
    │       └── validate-tracks.ts
    ├── test/
    │   ├── build.test.ts     # Build tests
    │   ├── tokenizer.test.ts # Tokenizer tests
    │   └── fixtures/
    │       ├── simple-timeline.json
    │       └── complex-timeline.json
    ├── examples/
    │   └── curl-test.sh      # Example requests
    ├── package.json
    ├── wrangler.toml
    ├── tsconfig.json
    └── README.md
```

## Adding a New Track/Attribute Plugin

Example: Add support for custom watermark positioning

### Step 1: Create plugin file
```typescript
// src/plugins/watermark-position.ts
import type { Plugin, PluginResult } from '../types';

export const watermarkPositionPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  // Find watermark clips
  for (const [trackName, track] of Object.entries(timeline.tracks)) {
    const trackData = track as any;

    for (const clip of trackData.clips) {
      if (clip.name.includes('watermark')) {
        // Add default position if not specified
        if (!clip.watermarkPosition) {
          clip.watermarkPosition = 'top-right';
          warnings.push(`Watermark ${clip.name} using default position`);
        }

        // Transform to coordinates
        const positions = {
          'top-right': { x: 1610, y: 10 },
          'top-left': { x: 10, y: 10 },
          'bottom-right': { x: 1610, y: 920 },
          'bottom-left': { x: 10, y: 920 },
        };

        const pos = positions[clip.watermarkPosition];
        if (pos && clip.transform) {
          clip.transform.x = pos.x;
          clip.transform.y = pos.y;
        }
      }
    }
  }

  return { timeline, warnings };
};
```

### Step 2: Export plugin
```typescript
// src/plugins/index.ts
export { watermarkPositionPlugin } from './watermark-position';
```

### Step 3: Register plugin
```typescript
// src/index.ts
import { watermarkPositionPlugin } from './plugins';

function createPluginManager(): PluginManager {
  const manager = new PluginManager();
  manager.register(validateTracksPlugin);
  manager.register(normalizeOutputPlugin);
  manager.register(watermarkPositionPlugin); // Add here
  return manager;
}
```

### Step 4: Test plugin
```typescript
// test/watermark.test.ts
it('should apply watermark position', () => {
  const timeline = {
    version: 1,
    tracks: {
      watermark: {
        clips: [{
          name: 'watermark_logo',
          watermarkPosition: 'top-left',
          transform: { x: 0, y: 0 }
        }]
      }
    }
  };

  const result = watermarkPositionPlugin(timeline);
  expect(result.timeline.tracks.watermark.clips[0].transform.x).toBe(10);
});
```

### Step 5: Use it
```bash
curl -X POST http://localhost:8787/build -d '{
  "version": 1,
  "tracks": {
    "main": { "clips": [...] },
    "watermark": {
      "clips": [{
        "name": "watermark_logo",
        "watermarkPosition": "top-right"
      }]
    }
  }
}'
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run test/build.test.ts

# Watch mode
npm run test:watch
```

## Deployment

```bash
# Development
npm run dev  # Starts wrangler dev server

# Production
npm run build
npm run deploy
```

## Constraints Satisfied

✅ TypeScript + ESM
✅ Cloudflare Workers compatible (no Node.js APIs)
✅ Zod validation
✅ Plugin system for extensibility
✅ Returns { command, args }
✅ Does not modify library core behavior
✅ Adds optional buildTokens() export
✅ Minimal wrangler.toml
✅ npm scripts: dev/build/deploy
✅ README with curl examples
✅ 5-step plugin guide
✅ Tests with assertions

## Production Checklist

- [ ] Update WORKER_VERSION in src/index.ts
- [ ] Configure wrangler.toml with account details
- [ ] Set up environment variables if needed
- [ ] Run full test suite
- [ ] Build and verify dist/
- [ ] Deploy to Cloudflare
- [ ] Test deployed endpoints
- [ ] Monitor logs for errors

## License

MIT
