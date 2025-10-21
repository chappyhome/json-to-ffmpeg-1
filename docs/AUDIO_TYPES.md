# Audio Type Classification

## Overview

json-to-ffmpeg now supports audio type classification through `AudioMetadata`, enabling specialized handling for different audio purposes. You can now precisely control background music (BGM) and sound effects (SFX) with features like looping, fading, and precise timing.

## Features

- ✅ Support for BGM (Background Music)
  - Automatic looping when source is shorter than clip duration
  - Fade-in and fade-out support
  - Single instance per timeline
- ✅ Support for SFX (Sound Effects)
  - Precise timing with adelay filter
  - Multiple instances can trigger at different times
  - Optional fade-in and fade-out
- ✅ Support for Narration (Voice/Dialogue)
  - Synchronized SRT subtitle support
  - Customizable subtitle styling
  - Professional fade-in and fade-out
  - Multi-language support
- ✅ Backward compatible (defaults to SFX behavior)
- ✅ Automatic audio mixing with amix filter

## Audio Types

### BGM (Background Music)

Background music is designed for continuous playback with smooth fade transitions and automatic looping.

**Use cases:**
- Background soundtracks
- Ambient music
- Continuous atmospheric audio

**Characteristics:**
- Typically one BGM per timeline
- Loops automatically if source duration < clip duration
- Supports fade-in at start and fade-out at end

### SFX (Sound Effects)

Sound effects are designed for precise timing triggers at specific timeline positions.

**Use cases:**
- Button clicks
- Notification sounds
- Transition whooshes
- Event-triggered audio

**Characteristics:**
- Multiple SFX can exist on same track
- Uses adelay filter for precise timing
- Optional subtle fades for smoother playback

### Narration (Voice/Dialogue)

Narration provides voiceover with synchronized subtitle support for professional video content.

**Use cases:**
- Tutorial voiceovers
- Documentary narration
- Presentation commentary
- Educational content
- Podcast overlays

**Characteristics:**
- One or more narration clips per timeline
- SRT subtitle integration with customizable styling
- Professional fade-in and fade-out
- Multi-language support with metadata
- Automatically mixed with BGM and SFX

📖 **[Read the full Narration documentation](./NARRATION.md)**

## Usage

### 1. Background Music with Loop and Fade

```json
{
  "inputs": {
    "background_music": {
      "type": "audio",
      "file": "samples/bgm.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 3.5,
      "metadata": {
        "audioType": "bgm",
        "loop": true,
        "fadeIn": 1.5,
        "fadeOut": 1.0
      }
    }
  },
  "tracks": {
    "bgm_track": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "background_music",
          "timelineTrackStart": 0,
          "duration": 10,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 0.6
        }
      ]
    }
  }
}
```

**FFmpeg command generated:**
```
[0:a]atrim=0:10,asetpts=PTS-STARTPTS,
afade=t=in:st=0:d=1.5,
aloop=loop=3:size=1e9,
atrim=0:10,asetpts=PTS-STARTPTS,
afade=t=out:st=9:d=1,
volume=0.6[bgm_clip]
```

### 2. Sound Effect with Precise Timing

```json
{
  "inputs": {
    "button_click": {
      "type": "audio",
      "file": "samples/click.wav",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 0.3,
      "metadata": {
        "audioType": "sfx",
        "fadeIn": 0.05,
        "fadeOut": 0.05
      }
    }
  },
  "tracks": {
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click1",
          "source": "button_click",
          "timelineTrackStart": 1.5,
          "duration": 0.3,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0
        }
      ]
    }
  }
}
```

**FFmpeg command generated:**
```
[1:a]atrim=0:0.3,asetpts=PTS-STARTPTS,
adelay=1500|1500,
afade=t=in:st=0:d=0.05,
afade=t=out:st=0.25:d=0.05,
volume=1[click1]
```

### 3. Multiple Sound Effects

```json
{
  "tracks": {
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click1",
          "source": "button_click",
          "timelineTrackStart": 1.5,
          "duration": 0.3,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0
        },
        {
          "name": "notification1",
          "source": "notification",
          "timelineTrackStart": 3.0,
          "duration": 0.8,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 0.9
        },
        {
          "name": "whoosh1",
          "source": "transition_whoosh",
          "timelineTrackStart": 5.5,
          "duration": 1.2,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 0.8
        }
      ]
    }
  }
}
```

**Result:** All SFX clips trigger at their specified timeline positions with individual delays.

### 4. BGM + Multiple SFX (Mixed Audio)

Combining BGM and SFX creates a rich audio composition:

```json
{
  "tracks": {
    "bgm_track": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "background_music",
          "timelineTrackStart": 0,
          "duration": 10,
          "clipType": "audio",
          "volume": 0.6
        }
      ]
    },
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click1",
          "source": "button_click",
          "timelineTrackStart": 1.5,
          "duration": 0.3,
          "clipType": "audio",
          "volume": 1.0
        },
        {
          "name": "notification1",
          "source": "notification",
          "timelineTrackStart": 3.0,
          "duration": 0.8,
          "clipType": "audio",
          "volume": 0.9
        }
      ]
    }
  }
}
```

**Result:** BGM plays continuously with looping and fades, while SFX trigger at precise times over the BGM. Tracks are mixed using the `amix` filter.

## AudioMetadata Type Definition

```typescript
export type AudioMetadata = {
  /**
   * Type of audio content:
   * - bgm: Background music (single instance, continuous playback with fade in/out and looping)
   * - sfx: Sound effects (multiple instances, precise timing triggers)
   * - narration: Dialogue/voiceover (planned for future)
   * Default: "sfx"
   */
  audioType?: "bgm" | "sfx" | "narration";

  /**
   * Whether to loop audio if source duration is shorter than clip duration
   * Only applies to BGM type
   * Default: false
   */
  loop?: boolean;

  /**
   * Duration in seconds for audio fade-in at the start of the clip
   * Applies to both BGM and SFX
   */
  fadeIn?: number;

  /**
   * Duration in seconds for audio fade-out at the end of the clip
   * Applies to both BGM and SFX
   */
  fadeOut?: number;
};
```

### Property Details

| Property | Type | Default | BGM | SFX | Description |
|----------|------|---------|-----|-----|-------------|
| `audioType` | "bgm" \| "sfx" \| "narration" | "sfx" | ✅ | ✅ | Audio purpose classification |
| `loop` | boolean | false | ✅ | ❌ | Loop audio when source < clip duration |
| `fadeIn` | number | - | ✅ | ✅ | Fade-in duration in seconds |
| `fadeOut` | number | - | ✅ | ✅ | Fade-out duration in seconds |

## Complete Example

See [audio-types-timeline.json](../worker/test/fixtures/audio-types-timeline.json) for a complete example containing:
- Background music with looping and fades
- Multiple sound effects with precise timing
- Automatic audio mixing

## Testing

Use the following command to test audio type classification:

```bash
# Generate FFmpeg command
node test-audio-types.js

# View generated command
cat test-audio-types-output.sh

# Execute command (requires actual audio files)
chmod +x test-audio-types-output.sh
./test-audio-types-output.sh
```

## FFmpeg Filter Chains

### BGM Filter Chain

```
atrim → asetpts → afade(in) → aloop → atrim → asetpts → afade(out) → volume
```

**Filters used:**
- `atrim`: Trim audio to duration and offset
- `asetpts`: Reset presentation timestamp
- `afade=t=in`: Fade-in at start
- `aloop`: Loop audio to extend duration
- `afade=t=out`: Fade-out at end
- `volume`: Adjust volume level

### SFX Filter Chain

```
atrim → asetpts → adelay → afade(in) → afade(out) → volume
```

**Filters used:**
- `atrim`: Trim audio to duration and offset
- `asetpts`: Reset presentation timestamp
- `adelay`: Delay audio start for precise timing
- `afade=t=in`: Optional fade-in
- `afade=t=out`: Optional fade-out
- `volume`: Adjust volume level

## Implementation Details

### File Modifications

1. **parseAudioClip.ts**
   - Added metadata reading from inputs
   - Type detection (bgm vs sfx)
   - Type-specific filter chain generation
   - BGM: fade + loop + fade
   - SFX: delay + optional fades

2. **parseClip.ts**
   - Pass `inputs` and `output` to parseAudioClip

3. **Inputs.ts**
   - Enhanced AudioMetadata documentation
   - Added JSDoc comments for all fields

### Processing Flow

```
JSON Input (audioType in metadata)
        ↓
parseClip.ts (router)
        ↓
parseAudioClip.ts (type-aware filtering)
        ↓
        +-- BGM: afade + aloop + afade + volume
        |
        +-- SFX: adelay + optional fades + volume
        ↓
parseTrack.ts (audio track composition)
        ↓
        +-- Single track: concat filter
        |
        +-- Multiple tracks: amix filter
        ↓
Final FFmpeg command
```

## Best Practices

### BGM (Background Music)

1. **Volume:** Set volume to 0.5-0.7 to leave headroom for SFX
2. **Fade duration:** Use 1-2 seconds for smooth transitions
3. **Looping:** Enable `loop: true` for continuous playback
4. **Source duration:** Use audio at least 3-5 seconds long for natural looping

### SFX (Sound Effects)

1. **Volume:** Keep at 0.8-1.0 for clear presence
2. **Fade duration:** Use short fades (0.05-0.1s) to avoid artifacts
3. **Timing:** Use `timelineTrackStart` for precise positioning
4. **Multiple SFX:** Space them out to avoid overwhelming the mix

### Audio Mixing

1. **Track organization:** Separate BGM and SFX into different tracks
2. **Volume balance:** BGM should be lower than SFX
3. **Avoid clipping:** Total volume of all tracks should not exceed 1.0

## Backward Compatibility

All existing audio configurations continue to work:

```json
{
  "inputs": {
    "legacy_audio": {
      "type": "audio",
      "file": "samples/audio.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 5
      // No metadata - defaults to SFX behavior
    }
  }
}
```

**Default behavior:**
- `audioType` defaults to "sfx"
- No looping
- No fades
- Same output as before

## Limitations and Future Enhancements

### Current Limitations

1. **BGM timing:** BGM always starts at timelineTrackStart (no delay)
2. **Loop precision:** aloop uses large sample count for simplicity
3. **Narration subtitles:** Applied to entire video timeline (not clip-specific timing)

### Future Enhancements

- [x] ~~Narration audio type with subtitle sync~~ **Implemented!**
- [ ] Advanced looping with precise sample count
- [ ] Audio ducking (lower BGM when narration/SFX plays)
- [ ] Cross-fade between BGM clips
- [ ] Per-clip audio effects (EQ, reverb, etc.)
- [ ] Narration subtitle timing offset (independent of audio)
- [ ] Multiple subtitle tracks per narration

## Related Documentation

- [AudioMetadata Type Definition](../src/types/Inputs.ts)
- [parseAudioClip Implementation](../src/parseAudioClip.ts)
- [Narration Documentation](./NARRATION.md) ⭐ **New!**
- [Design Documents](../AUDIO_TYPE_DESIGN_INDEX.md)
- [Text Rendering Documentation](./TEXT_RENDERING.md)
- [GIF Animation Documentation](./GIF_ANIMATION.md)

## Troubleshooting

### Issue: BGM not looping

**Solution:** Ensure `loop: true` is set in metadata and source duration < clip duration

### Issue: SFX not at correct time

**Solution:** Check `timelineTrackStart` value in clip configuration

### Issue: Audio clipping

**Solution:** Reduce volume levels, especially for BGM (try 0.6 or lower)

### Issue: Fade sounds abrupt

**Solution:** Increase fade duration (`fadeIn` / `fadeOut` values)
