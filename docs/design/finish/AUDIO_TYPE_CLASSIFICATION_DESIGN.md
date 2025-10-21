# Audio Type Classification Implementation Design

## Executive Summary

This document outlines the architecture for implementing audio type classification (`bgm` vs `sfx`) in the json-to-ffmpeg codebase. The implementation follows established patterns from the TextMetadata and ImageMetadata implementations, with special consideration for FFmpeg audio filter composition.

---

## Current State Analysis

### Existing AudioMetadata Type (src/types/Inputs.ts)

**Current definition (lines 20-29):**
```typescript
export type AudioMetadata = {
  audioType?: "bgm" | "sfx" | "narration";
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  subtitle?: string;
  language?: string;
  speaker?: string;
  category?: string;
};
```

**Observation:** The type already includes `audioType` field with the required values! However, the metadata is not being utilized in the actual audio processing pipeline.

### Current Audio Processing (parseAudioClip.ts)

**Current implementation (lines 10-41):**
- Only applies basic audio trimming (`atrim`)
- Resets PTS (Presentation Timestamp)
- Applies volume adjustment
- Does NOT read or use metadata
- Ignores `audioType`, `loop`, `fadeIn`, `fadeOut` properties

**Limitation:** Generic audio processing treats all audio the same way regardless of type.

### Audio Track Processing (parseTrack.ts)

**Current approach (lines 279-285):**
- All audio clips are concatenated sequentially using the `concat` filter
- No support for simultaneous playback with mixing
- No support for independent BGM looping/fading during SFX playback

---

## Design Requirements

### 1. AudioMetadata Enhancements

**Current state:** Type is already well-designed, needs better documentation

**Enhancement needed:**
- Add comments explaining each `audioType`:
  - `bgm`: Background music (single instance, continuous playback with fade in/out)
  - `sfx`: Sound effects (multiple instances, precise timing, can overlap)
  - `narration`: Dialogue/voiceover (planned for future)

- Clarify field meanings:
  - `fadeIn`: Duration in seconds for audio fade-in at clip start
  - `fadeOut`: Duration in seconds for audio fade-out at clip end
  - `loop`: For BGM - whether to loop if duration < clip duration

### 2. FFmpeg Filter Strategy

#### For BGM Clips:
1. **Trim audio** to correct duration and offset
2. **Apply fade-in** using `afade` filter if fadeIn specified
3. **Apply fade-out** using `afade` filter if fadeOut specified
4. **Loop audio** if `loop: true` and source duration < clip duration using `aloop`
5. **Adjust volume** as normal

**Filter chain example:**
```
[input:a] atrim=offset:offset+duration, asetpts=PTS-STARTPTS, afade=t=in:st=0:d=2, afade=t=out:st=8:d=1, volume=1 [bgm_output]
```

#### For SFX Clips:
1. **Trim audio** to correct duration and offset
2. **Apply adelay** to shift audio start time based on `timelineTrackStart`
3. **Adjust volume** as normal
4. **No looping** - SFX is expected to be exact duration

**Filter chain example:**
```
[input:a] atrim=offset:offset+duration, asetpts=PTS-STARTPTS, adelay=5000|5000, volume=1 [sfx_output]
```

#### Audio Track Composition (NEW):
Instead of simple concatenation, audio tracks should:

1. **If single BGM:** Apply fade + loop directly
2. **If multiple clips (mixed BGM+SFX):**
   - Create individual filtered streams for each clip
   - Use `amix` filter to combine all streams
   - The `amix` filter allows simultaneous playback with automatic ducking

**Example for mixed track:**
```
[bgm_filtered] [sfx1_filtered] [sfx2_filtered] amix=inputs=3:duration=longest [mixed_output]
```

---

## Implementation Architecture

### 1. Enhanced parseAudioClip.ts

**Changes:**
- Accept `inputs` and `inputs` for metadata access (similar to parseImageClip.ts)
- Read AudioMetadata from source
- Determine `audioType` (default to "sfx" if not specified)
- Build filter chain based on type

**Function signature:**
```typescript
export function parseAudioClip({
  clip,
  inputFiles,
  inputs,  // ADD: for metadata access
  output,  // ADD: for adelay calculation (timeline context)
}: {
  clip: AudioClip;
  inputFiles: InputFiles;
  inputs: Inputs;        // ADD
  output: Output;        // ADD
}): string;
```

**Key logic:**
```typescript
const audioType = metadata?.audioType || "sfx";

if (audioType === "bgm") {
  // BGM: fade, loop, continuous playback
  filters.push(`afade=t=in:st=0:d=${fadeIn || 0}`);
  if (shouldLoop) {
    filters.push(`aloop=${loopCount}`);
  }
  filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut || 0}`);
} else if (audioType === "sfx") {
  // SFX: precise timing with delay
  const delayMs = Math.round(clip.timelineTrackStart * 1000);
  if (delayMs > 0) {
    filters.push(`adelay=${delayMs}|${delayMs}`);
  }
  // SFX may have subtle fade for smoother cuts
  if (fadeIn) filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  if (fadeOut) filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
}
```

**Helper function needed:**
```typescript
function calculateAudioLoopCount(
  sourceDuration: number,
  clipDuration: number,
  frameRate: number
): number {
  // Similar to image GIF looping (parseImageClip.ts:70-71)
  return Math.ceil(clipDuration / sourceDuration);
}
```

### 2. Modified parseTrack.ts (Audio Handling)

**Current limitation:** Lines 279-285 always use `concat` filter

**New approach:** Detect audio track composition type

```typescript
if (track.type === "audio") {
  // Check if track has mixed audio types
  const hasBGM = clipsToConcat.some(clip => 
    isBackgroundMusic(clip, inputs)
  );
  const hasSFX = clipsToConcat.some(clip => 
    isSoundEffect(clip, inputs)
  );

  if (hasBGM && !hasSFX) {
    // Single BGM: use simple concat (may be looping internally)
    useSimpleConcat();
  } else if (!hasBGM && hasSFX) {
    // Multiple SFX: sequence them with concat
    useSimpleConcat();
  } else {
    // Mixed: use amix for simultaneous playback
    useMixForSimultaneousPlayback();
  }
}
```

**Helper functions:**
```typescript
function isBackgroundMusic(clip: ClipToConcat, inputs: Inputs): boolean {
  // Check metadata from inputs
}

function isSoundEffect(clip: ClipToConcat, inputs: Inputs): boolean {
  // Check metadata from inputs
}
```

### 3. Updated parseClip.ts

**Change:** Pass additional parameters to parseAudioClip

```typescript
if (clip.clipType === "audio") {
  clipString += parseAudioClip({ 
    clip, 
    inputFiles,
    inputs,      // ADD
    output,      // ADD
  });
}
```

### 4. parseInputs.ts (Minor Enhancement)

**Current state:** Already handles audio input files correctly (lines 58-59)

**No changes needed:** Audio inputs are already processed correctly

---

## FFmpeg Audio Filter Reference

### Core Filters Needed

| Filter | Purpose | Usage |
|--------|---------|-------|
| `atrim` | Trim audio to duration/offset | `atrim=start:end` |
| `asetpts` | Reset presentation timestamp | `asetpts=PTS-STARTPTS` |
| `volume` | Adjust volume level | `volume=1.5` |
| `afade` | Fade audio in/out | `afade=t=in:st=0:d=2` or `afade=t=out:st=8:d=1` |
| `aloop` | Loop audio stream | `aloop=5:20` (repeat 5 times, 20 frames per loop) |
| `adelay` | Delay audio start time | `adelay=5000\|5000` (5 seconds delay for stereo) |
| `amix` | Mix multiple audio streams | `amix=inputs=3:duration=longest` |
| `concat` | Concatenate audio sequentially | `concat=n=2:v=0:a=1` |

### Filter Chain Order

**For optimal results, apply filters in this order:**
1. **Trim**: `atrim` - extract the correct segment
2. **Reset PTS**: `asetpts=PTS-STARTPTS` - ensure proper timing
3. **Delay (SFX only)**: `adelay` - for precise timing
4. **Fade-in**: `afade=t=in`
5. **Fade-out**: `afade=t=out`
6. **Loop (BGM only)**: `aloop` - extend duration if needed
7. **Volume**: `volume` - final volume adjustment

---

## Implementation Phases

### Phase 1: Core Audio Type Filtering (This PR)

**Files to modify:**
1. `src/parseAudioClip.ts` - Add metadata reading and type-based filtering
2. `src/parseClip.ts` - Pass inputs and output to parseAudioClip
3. `src/types/Inputs.ts` - Enhanced documentation/comments

**Features:**
- BGM fade-in/fade-out support
- BGM looping support
- SFX timing delay support
- Proper filter chain composition

### Phase 2: Audio Track Mixing (Follow-up PR)

**Files to modify:**
1. `src/parseTrack.ts` - Implement amix for mixed tracks
2. Add helper functions for track composition detection

**Features:**
- Support simultaneous BGM + SFX playback
- Automatic volume ducking with amix
- Maintain backward compatibility with sequential concatenation

### Phase 3: Documentation & Testing

**Files to create:**
1. `AUDIO_TYPE_IMPLEMENTATION.md` - User guide
2. `worker/test/fixtures/audio-types-timeline.json` - Test fixture
3. Test cases for BGM looping, fading, SFX timing

---

## Code Integration Points

### 1. parseClip.ts (lines 35-36)

**Before:**
```typescript
} else if (clip.clipType === "audio") {
  clipString += parseAudioClip({ clip, inputFiles });
```

**After:**
```typescript
} else if (clip.clipType === "audio") {
  clipString += parseAudioClip({ clip, inputFiles, inputs, output });
```

### 2. parseAudioClip.ts (entire file)

**Before:**
```typescript
export function parseAudioClip({
  clip,
  inputFiles,
}: {
  clip: AudioClip;
  inputFiles: InputFiles;
}): string
```

**After:**
```typescript
export function parseAudioClip({
  clip,
  inputFiles,
  inputs,
  output,
}: {
  clip: AudioClip;
  inputFiles: InputFiles;
  inputs: Inputs;
  output: Output;
}): string
```

### 3. parseTrack.ts (lines 279-285)

**Before:**
```typescript
if (track.type === "audio") {
  for (const clip of clipsToConcat) {
    clipsCommand += `[${clip.label}]`;
  }
  clipsCommand += `concat=n=${clipsToConcat.length}:v=0:a=1[${trackName}];\n`;
}
```

**After:**
```typescript
if (track.type === "audio") {
  // Phase 2: Check for mixed audio types
  const audioComposition = analyzeAudioTrackComposition(
    clipsToConcat,
    inputs
  );
  
  if (audioComposition === "mixed") {
    // Use amix for simultaneous playback
    clipsCommand += buildAudioMixCommand(clipsToConcat, trackName);
  } else {
    // Use concat for sequential playback
    for (const clip of clipsToConcat) {
      clipsCommand += `[${clip.label}]`;
    }
    clipsCommand += `concat=n=${clipsToConcat.length}:v=0:a=1[${trackName}];\n`;
  }
}
```

---

## Example Test Cases

### Test Case 1: Simple BGM with Fade
```json
{
  "audioType": "bgm",
  "fadeIn": 1.5,
  "fadeOut": 1.0,
  "loop": true,
  // Input audio: 2 seconds, Clip duration: 5 seconds
}
```

**Expected filter output:**
```
afade=t=in:st=0:d=1.5, aloop=3:60, afade=t=out:st=4:d=1
```

### Test Case 2: SFX with Timing
```json
{
  "audioType": "sfx",
  "fadeIn": 0.5,
  "fadeOut": 0.3,
  // Clip starts at 2.5 seconds in timeline
}
```

**Expected filter output:**
```
adelay=2500|2500, afade=t=in:st=0:d=0.5, afade=t=out:st=4.7:d=0.3
```

### Test Case 3: Multiple SFX Sequential
```json
[
  { "audioType": "sfx", "timelineTrackStart": 1 },
  { "audioType": "sfx", "timelineTrackStart": 3.5 },
  { "audioType": "sfx", "timelineTrackStart": 5 }
]
```

**Expected:** Three audio streams concatenated sequentially

### Test Case 4: BGM + Multiple SFX (Phase 2)
```json
{
  "bgm": { "audioType": "bgm", "loop": true },
  "sfx": [
    { "audioType": "sfx", "timelineTrackStart": 1 },
    { "audioType": "sfx", "timelineTrackStart": 3.5 }
  ]
}
```

**Expected:** BGM loops continuously, SFX play at precise times over BGM

---

## Backward Compatibility

**Key principle:** Maintain backward compatibility with existing configs

1. **Default behavior:** If `audioType` is not specified, default to `"sfx"`
2. **Metadata is optional:** Existing audio clips without metadata continue to work
3. **No breaking changes:** All existing audio tracks produce same output as before

**Migration path:**
- Existing configs continue to work without changes
- New configs can opt-in to BGM with `metadata.audioType: "bgm"`
- Phase 2 (mixed audio) only activates if both BGM and SFX detected

---

## Performance Considerations

### Filter Complexity
- Simple fade-in/out: Minimal CPU impact
- Looping: Loops are internal to FFmpeg, no significant overhead
- Delay: adelay is very lightweight
- Mixing (amix): Linear complexity with number of streams (Phase 2)

### Memory Usage
- Audio is typically low memory vs video
- Looping: Uses circular buffer, memory proportional to audio duration
- Mixing: Memory proportional to number of simultaneous streams

### Optimization Notes
- `adelay` should use same value for all channels (e.g., `adelay=5000|5000` for stereo)
- `afade` uses small internal buffer, CPU efficient
- `aloop` reuses source buffer, memory efficient

---

## Testing Strategy

### Unit Tests Needed
1. **Metadata parsing:**
   - AudioMetadata correctly extracted from inputs
   - Default values applied correctly
   
2. **Filter generation:**
   - BGM fade-in/out filters generated correctly
   - BGM loop count calculated correctly
   - SFX delay calculated correctly
   
3. **Filter composition:**
   - Filters applied in correct order
   - Multiple filters combined correctly with commas

### Integration Tests Needed
1. **BGM looping:** Audio loops correctly when source < clip duration
2. **BGM fading:** Fade-in/out applied at correct times
3. **SFX timing:** Sound effects trigger at exact timeline positions
4. **Mixed audio:** BGM and SFX play simultaneously (Phase 2)

### Example Test Fixture
See section "Example Test Cases" for specific test scenarios

---

## Documentation Updates Needed

### Files to Create
1. `AUDIO_TYPE_IMPLEMENTATION.md` - Implementation guide
2. `AUDIO_TYPES_USER_GUIDE.md` - End-user documentation

### Files to Update
1. `README.md` - Add audio type classification to features
2. `src/types/Inputs.ts` - Add JSDoc comments
3. `src/parseAudioClip.ts` - Add function documentation

---

## Risk Assessment & Mitigation

### Risk: Incorrect Filter Syntax
**Mitigation:** Comprehensive filter chain validation in tests

### Risk: Timing Issues with adelay
**Mitigation:** Ensure adelay values match audio channel configuration

### Risk: Memory with Long Loops
**Mitigation:** Document loop limitations, provide warnings for excessive loops

### Risk: Phase 2 (amix) Audio Level Issues
**Mitigation:** Document recommended volume ducking settings, provide examples

---

## Summary of Changes by File

| File | Changes | Type |
|------|---------|------|
| src/parseAudioClip.ts | Major - Add metadata reading, type detection, filter composition | Implementation |
| src/parseClip.ts | Minor - Pass inputs, output params | Integration |
| src/parseTrack.ts | Minor (Phase 1) / Major (Phase 2) - Audio composition logic | Enhancement |
| src/types/Inputs.ts | Minor - Documentation comments | Documentation |
| Documentation | Create new files, update existing | Documentation |
| Tests | Create test fixtures and cases | Testing |

