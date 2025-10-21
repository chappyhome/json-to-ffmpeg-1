# Audio Type Classification - Architecture Diagrams

## Current vs. Proposed Architecture

### Current Audio Processing Flow

```
VideoEditorFormat (JSON)
        |
        v
parseInputs.ts
  - Handles input files
  - No audio-specific logic
        |
        v
parseClip.ts (router)
        |
        v
parseAudioClip.ts
  - atrim (trim audio)
  - asetpts (reset timestamp)
  - volume (adjust volume)
  - Returns: [input:a]filters[name];
        |
        v
parseTrack.ts
  - Concatenates all clips
  - Uses concat filter for audio
  - All clips treated the same
        |
        v
parseTracks.ts
  - Combines audio tracks with amix
  - Final audio output
```

**LIMITATION:** All audio treated identically, no type-aware processing

---

### Proposed Audio Processing Flow (Phase 1)

```
VideoEditorFormat (JSON)
        |
        v
parseInputs.ts (unchanged)
  - Handles input files
        |
        v
parseClip.ts (modified)
  - Passes: clip, inputFiles, inputs, output
        |
        v
parseAudioClip.ts (ENHANCED)
  
  1. Read metadata from inputs
  2. Get audioType: "bgm" | "sfx" (default: "sfx")
  3. Build type-specific filter chain:
  
     FOR BGM:
     - atrim (trim)
     - asetpts (reset PTS)
     - afade=t=in (fade-in if specified)
     - aloop (loop if needed)
     - afade=t=out (fade-out if specified)
     - volume (adjust volume)
     
     FOR SFX:
     - atrim (trim)
     - asetpts (reset PTS)
     - adelay (precise timing)
     - afade=t=in (optional fade-in)
     - afade=t=out (optional fade-out)
     - volume (adjust volume)
  
  - Returns: [input:a]filters[name];
        |
        v
parseTrack.ts (minimal changes)
  - Continues using concat for sequential playback
  - Phase 2: Will add amix detection
        |
        v
parseTracks.ts (unchanged)
  - Combines audio tracks
```

**IMPROVEMENT:** Type-aware metadata processing, fade/loop/delay support

---

### Proposed Audio Processing Flow (Phase 2 - Future)

```
VideoEditorFormat (JSON)
        |
        v
parseClip.ts
        |
        v
parseAudioClip.ts
  - All clips filtered individually
        |
        v
parseTrack.ts (ENHANCED)
  
  1. Analyze audio track composition:
     - Check if track has BGM clips
     - Check if track has SFX clips
  
  2. Build appropriate command:
  
     IF single BGM or sequential SFX:
       Use concat filter (backward compatible)
       [clip1][clip2][clip3]concat=n=3:v=0:a=1[output]
     
     ELIF mixed BGM + SFX:
       Use amix filter (simultaneous playback)
       [bgm_filtered][sfx1_filtered][sfx2_filtered]amix=inputs=3:duration=longest[output]
        |
        v
parseTracks.ts
```

**FEATURE:** Support simultaneous BGM + SFX playback

---

## Data Flow for Different Audio Types

### BGM (Background Music) Flow

```
Input: bgm.mp3 (2 seconds)
Metadata: {
  audioType: "bgm",
  fadeIn: 1,
  fadeOut: 0.5,
  loop: true
}
Clip config: duration: 5, timelineTrackStart: 0

         |
         v
[0:a] -----+
           |
           v (atrim=0:7)
        [trim] -----+
                   |
                   v (asetpts=PTS-STARTPTS)
                [pts_reset] -----+
                                |
                                v (afade=t=in:st=0:d=1)
                             [fade_in] -----+
                                           |
                                           v (aloop=3:60)
                                        [looped] -----+
                                                     |
                                                     v (afade=t=out:st=4.5:d=0.5)
                                                  [fade_out] -----+
                                                                 |
                                                                 v (volume=1)
                                                              [output] ===
```

**Result:** BGM fades in, loops to fill 5-second duration, fades out

---

### SFX (Sound Effects) Flow

```
Input: beep.wav (0.5 seconds)
Metadata: {
  audioType: "sfx",
  fadeIn: 0.1,
  fadeOut: 0.1
}
Clip config: duration: 0.5, timelineTrackStart: 2.5 (starts at 2.5s in timeline)

         |
         v
[0:a] -----+
           |
           v (atrim=0:0.5)
        [trim] -----+
                   |
                   v (asetpts=PTS-STARTPTS)
                [pts_reset] -----+
                                |
                                v (adelay=2500|2500)
                             [delayed] -----+
                                           |
                                           v (afade=t=in:st=0:d=0.1)
                                        [fade_in] -----+
                                                     |
                                                     v (afade=t=out:st=0.4:d=0.1)
                                                  [fade_out] -----+
                                                                 |
                                                                 v (volume=1)
                                                              [output] ===
```

**Result:** SFX delayed to 2.5s position with smooth fade in/out

---

## Type Detection Logic

```
parseAudioClip()
    |
    v
Get source name from clip
    |
    v
Find source in inputs object
    |
    v
Check source.metadata exists?
    |
    +-- NO --> Default to SFX behavior
    |
    +-- YES
         |
         v
      metadata = source.metadata as AudioMetadata
         |
         v
      audioType = metadata.audioType || "sfx"
         |
         +-- "bgm"       --> BGM filter chain
         |
         +-- "sfx"       --> SFX filter chain
         |
         +-- "narration" --> Reserved for future
         |
         +-- undefined   --> SFX filter chain
```

---

## Filter Chain Construction Pseudocode

### For BGM:

```typescript
let filters: string[] = [];

// Core trimming
filters.push(`atrim=${sourceStartOffset}:${sourceStartOffset + duration}`);
filters.push(`asetpts=PTS-STARTPTS`);

// BGM-specific: fade in
if (metadata.fadeIn > 0) {
  filters.push(`afade=t=in:st=0:d=${metadata.fadeIn}`);
}

// BGM-specific: looping
if (metadata.loop && sourceDuration < duration) {
  const loopCount = Math.ceil(duration / sourceDuration);
  const framesPerLoop = Math.round(sourceDuration * 30); // fps assumed 30
  filters.push(`aloop=${loopCount}:${framesPerLoop}`);
}

// BGM-specific: fade out
if (metadata.fadeOut > 0) {
  const fadeOutStart = duration - metadata.fadeOut;
  filters.push(`afade=t=out:st=${fadeOutStart}:d=${metadata.fadeOut}`);
}

// Final volume
filters.push(`volume=${volume}`);

// Result: [0:a]filter1,filter2,filter3[name];
return `[${inputIndex}:a]${filters.join(",")}[${name}];`;
```

### For SFX:

```typescript
let filters: string[] = [];

// Core trimming
filters.push(`atrim=${sourceStartOffset}:${sourceStartOffset + duration}`);
filters.push(`asetpts=PTS-STARTPTS`);

// SFX-specific: delay for timeline positioning
const delayMs = Math.round(timelineTrackStart * 1000);
if (delayMs > 0) {
  filters.push(`adelay=${delayMs}|${delayMs}`);
}

// Optional SFX fade for smoother transitions
if (metadata.fadeIn > 0) {
  filters.push(`afade=t=in:st=0:d=${metadata.fadeIn}`);
}

if (metadata.fadeOut > 0) {
  const fadeOutStart = duration - metadata.fadeOut;
  filters.push(`afade=t=out:st=${fadeOutStart}:d=${metadata.fadeOut}`);
}

// Final volume
filters.push(`volume=${volume}`);

// Result: [0:a]filter1,filter2,filter3[name];
return `[${inputIndex}:a]${filters.join(",")}[${name}];`;
```

---

## Integration Points - Before & After

### Before (Current)

```
parseClip.ts line 35-36:
if (clip.clipType === "audio") {
  clipString += parseAudioClip({ clip, inputFiles });
}

parseAudioClip signature:
export function parseAudioClip({
  clip,
  inputFiles,
}: {...}): string
```

### After (Phase 1)

```
parseClip.ts line 35-36:
if (clip.clipType === "audio") {
  clipString += parseAudioClip({ 
    clip, 
    inputFiles,
    inputs,    // ADD
    output,    // ADD
  });
}

parseAudioClip signature:
export function parseAudioClip({
  clip,
  inputFiles,
  inputs,    // ADD
  output,    // ADD
}: {...}): string
```

---

## Test Scenario: BGM + SFX on Different Timeline Positions

```
Timeline (seconds):
0s           2.5s        5s          7s
|============|===========|===========|===========|
[    BGM (looped, faded)    ]
            [SFX1]    [SFX2]  [SFX3]

JSON representation:
{
  "tracks": {
    "audio": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "background_music",
          "timelineTrackStart": 0,
          "duration": 5,
          "metadata": { audioType: "bgm", loop: true, fadeIn: 0.5 }
        },
        {
          "name": "sfx_clip1",
          "source": "beep",
          "timelineTrackStart": 2.5,
          "duration": 0.3,
          "metadata": { audioType: "sfx" }
        },
        {
          "name": "sfx_clip2",
          "source": "pop",
          "timelineTrackStart": 4,
          "duration": 0.2,
          "metadata": { audioType: "sfx" }
        },
        {
          "name": "sfx_clip3",
          "source": "ding",
          "timelineTrackStart": 5.5,
          "duration": 0.25,
          "metadata": { audioType: "sfx" }
        }
      ]
    }
  }
}

Phase 1 Output (Sequential):
[bgm_filtered]
[sfx_clip1_delayed_and_filtered]
[sfx_clip2_delayed_and_filtered]
[sfx_clip3_delayed_and_filtered]
concat=n=4:v=0:a=1[audio_track]

Phase 2 Output (Mixed):
[bgm_filtered]
[sfx_clip1_delayed_and_filtered]
[sfx_clip2_delayed_and_filtered]
[sfx_clip3_delayed_and_filtered]
amix=inputs=4:duration=longest[audio_track]
```

---

## Parameter Flow Examples

### Example 1: BGM with Metadata

```
Input Source Definition:
{
  "background_music": {
    "type": "audio",
    "file": "music.mp3",
    "duration": 3.5,
    "metadata": {
      "audioType": "bgm",
      "fadeIn": 1.5,
      "fadeOut": 1.0,
      "loop": true
    }
  }
}

Clip Definition:
{
  "name": "bgm_intro",
  "source": "background_music",
  "timelineTrackStart": 0,
  "duration": 10,
  "sourceStartOffset": 0,
  "clipType": "audio",
  "volume": 0.8
}

Parameters passed to parseAudioClip:
{
  clip: {
    name: "bgm_intro",
    source: "background_music",
    duration: 10,
    sourceStartOffset: 0,
    timelineTrackStart: 0,
    volume: 0.8
  },
  inputFiles: [{ name: "background_music", file: "music.mp3" }],
  inputs: {
    background_music: {
      type: "audio",
      metadata: {
        audioType: "bgm",
        fadeIn: 1.5,
        fadeOut: 1.0,
        loop: true
      }
    }
  },
  output: { framerate: 30 }
}

Generated Filter Chain:
atrim=0:10, asetpts=PTS-STARTPTS, afade=t=in:st=0:d=1.5, 
aloop=3:30, afade=t=out:st=9:d=1, volume=0.8
```

### Example 2: SFX with Precise Timing

```
Input Source Definition:
{
  "click_sfx": {
    "type": "audio",
    "file": "click.wav",
    "duration": 0.1,
    "metadata": {
      "audioType": "sfx",
      "fadeIn": 0.01,
      "fadeOut": 0.02
    }
  }
}

Clip Definitions (Multiple):
[
  {
    name: "click_1",
    source: "click_sfx",
    timelineTrackStart: 1.5,
    duration: 0.1,
    volume: 1.0
  },
  {
    name: "click_2",
    source: "click_sfx",
    timelineTrackStart: 3.2,
    duration: 0.1,
    volume: 0.7
  }
]

Generated Filter Chains:
click_1: atrim=0:0.1, asetpts=PTS-STARTPTS, adelay=1500|1500,
         afade=t=in:st=0:d=0.01, afade=t=out:st=0.08:d=0.02, volume=1
         
click_2: atrim=0:0.1, asetpts=PTS-STARTPTS, adelay=3200|3200,
         afade=t=in:st=0:d=0.01, afade=t=out:st=0.08:d=0.02, volume=0.7

Phase 1 Result (Sequential Concat):
[click_1][click_2]concat=n=2:v=0:a=1[audio_track]

(Note: Each SFX triggers at exact timeline position)
```

---

## Key Differences: BGM vs SFX

| Aspect | BGM | SFX |
|--------|-----|-----|
| **Count** | Single instance per track | Multiple instances |
| **Duration** | Can extend via looping | Exact duration |
| **Timing** | Continuous from start | Precise timeline positions |
| **Overlapping** | Can overlap with SFX | Can overlap with each other |
| **Fading** | Critical (in/out) | Optional (for smoothness) |
| **Filter Key** | `aloop` | `adelay` |
| **Playback** | Continuous | Event-triggered |
| **Example** | Background music | Door slam, notification beep |

---

## FFmpeg Command Examples

### Example 1: Simple BGM Loop

```bash
# Input: 2-second background music, clip duration 5 seconds
ffmpeg -i music.mp3 -filter_complex \
  "[0:a]atrim=0:5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,\
   aloop=3:60,afade=t=out:st=4:d=1,volume=1[output]" \
  -map "[output]" -f mp3 output.mp3
```

### Example 2: SFX with Delay

```bash
# 0.3 second beep starting at 2.5s in timeline
ffmpeg -i beep.wav -filter_complex \
  "[0:a]atrim=0:0.3,asetpts=PTS-STARTPTS,adelay=2500|2500,\
   volume=1[output]" \
  -map "[output]" -f wav output.wav
```

### Example 3: Multiple SFX Sequential (Phase 1)

```bash
ffmpeg -i click1.wav -i click2.wav -i click3.wav -filter_complex \
  "[0:a]atrim=0:0.1,asetpts=PTS-STARTPTS,adelay=1000|1000,volume=1[c1];\
   [1:a]atrim=0:0.1,asetpts=PTS-STARTPTS,adelay=2500|2500,volume=1[c2];\
   [2:a]atrim=0:0.1,asetpts=PTS-STARTPTS,adelay=4000|4000,volume=1[c3];\
   [c1][c2][c3]concat=n=3:v=0:a=1[output]" \
  -map "[output]" output.wav
```

### Example 4: BGM + SFX Mixed (Phase 2)

```bash
ffmpeg -i music.mp3 -i click1.wav -i click2.wav -filter_complex \
  "[0:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,\
   aloop=2:30,afade=t=out:st=9:d=1,volume=1[bgm];\
   [1:a]atrim=0:0.1,asetpts=PTS-STARTPTS,adelay=2500|2500,volume=1[sfx1];\
   [2:a]atrim=0:0.1,asetpts=PTS-STARTPTS,adelay=5000|5000,volume=1[sfx2];\
   [bgm][sfx1][sfx2]amix=inputs=3:duration=longest[output]" \
  -map "[output]" output.mp3
```

