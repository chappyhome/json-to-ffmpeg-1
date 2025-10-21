# Narration with Subtitles

## Overview

The `narration` audio type enables voiceover/dialogue with synchronized subtitle support. This feature is perfect for tutorials, documentaries, presentations, and any content requiring spoken narration with on-screen text.

## Features

- ✅ **Narration Audio Processing**
  - Professional fade-in and fade-out
  - Precise timing control
  - Volume adjustment
  - No looping (single playback)

- ✅ **SRT Subtitle Support**
  - Local SRT file integration
  - URL-based subtitle files (planned)
  - Customizable subtitle styling
  - Multiple position options (top/middle/bottom)

- ✅ **Automatic Mixing**
  - Seamlessly mixes with BGM and SFX
  - Maintains audio clarity
  - Professional audio balance

## Quick Example

```json
{
  "inputs": {
    "narration_voice": {
      "type": "audio",
      "file": "samples/narration.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 10,
      "metadata": {
        "audioType": "narration",
        "fadeIn": 0.3,
        "fadeOut": 0.3,
        "subtitleFile": "subtitles/narration.srt",
        "subtitleStyle": {
          "fontFamily": "Arial",
          "fontSize": 28,
          "fontColor": "#FFFFFF",
          "backgroundColor": "#00000099",
          "position": "bottom",
          "marginV": 30
        },
        "language": "en",
        "speaker": "Narrator"
      }
    }
  },
  "tracks": {
    "narration_track": {
      "type": "audio",
      "clips": [
        {
          "name": "narration_clip",
          "source": "narration_voice",
          "timelineTrackStart": 1,
          "duration": 10,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0
        }
      ]
    }
  }
}
```

## SRT Subtitle Format

Narration uses standard SRT (SubRip) subtitle format:

```srt
1
00:00:01,000 --> 00:00:03,500
Welcome to our video presentation.

2
00:00:04,000 --> 00:00:07,000
Today we'll explore amazing features
of JSON to FFmpeg conversion.

3
00:00:08,000 --> 00:00:10,000
Let's get started!
```

### SRT File Structure

- **Index**: Sequential number for each subtitle
- **Timecode**: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
- **Text**: Subtitle content (can be multi-line)
- **Blank line**: Separator between subtitles

## AudioMetadata for Narration

### Complete Type Definition

```typescript
{
  audioType: "narration",

  // Audio Processing
  fadeIn?: number,        // Fade-in duration in seconds
  fadeOut?: number,       // Fade-out duration in seconds

  // Subtitle Files
  subtitleFile?: string,  // Local path to SRT file
  subtitleUrl?: string,   // URL to SRT file (future)

  // Subtitle Styling
  subtitleStyle?: {
    fontFamily?: string,      // Font name (e.g., "Arial")
    fontSize?: number,        // Font size in points
    fontColor?: string,       // Text color (hex: "#FFFFFF")
    backgroundColor?: string, // Background color (hex with alpha: "#00000099")
    position?: "top" | "bottom" | "middle",
    marginV?: number         // Vertical margin in pixels
  },

  // Metadata (Optional)
  language?: string,  // Language code (e.g., "en", "zh-CN")
  speaker?: string    // Speaker name
}
```

### Property Details

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `audioType` | "narration" | - | ✅ | Audio type identifier |
| `fadeIn` | number | - | ❌ | Fade-in duration (seconds) |
| `fadeOut` | number | - | ❌ | Fade-out duration (seconds) |
| `subtitleFile` | string | - | ⚠️ | Local SRT file path (required for subtitles) |
| `subtitleUrl` | string | - | ❌ | SRT file URL (future feature) |
| `subtitleStyle.fontFamily` | string | "Arial" | ❌ | Font family name |
| `subtitleStyle.fontSize` | number | 24 | ❌ | Font size in points |
| `subtitleStyle.fontColor` | string | "#FFFFFF" | ❌ | Text color (hex) |
| `subtitleStyle.backgroundColor` | string | "#00000080" | ❌ | Background color (hex with alpha) |
| `subtitleStyle.position` | string | "bottom" | ❌ | Subtitle position |
| `subtitleStyle.marginV` | number | 20 | ❌ | Vertical margin (pixels) |
| `language` | string | - | ❌ | Language code |
| `speaker` | string | - | ❌ | Speaker identifier |

## Usage Examples

### 1. Basic Narration with Default Subtitle Style

```json
{
  "inputs": {
    "voice": {
      "type": "audio",
      "file": "narration.mp3",
      "duration": 5,
      "metadata": {
        "audioType": "narration",
        "subtitleFile": "narration.srt"
      }
    }
  }
}
```

**Result**: Narration plays with white text on semi-transparent black background at the bottom of the screen.

### 2. Custom Subtitle Styling

```json
{
  "metadata": {
    "audioType": "narration",
    "subtitleFile": "narration.srt",
    "subtitleStyle": {
      "fontFamily": "Helvetica",
      "fontSize": 32,
      "fontColor": "#FFFF00",
      "backgroundColor": "#0000FF80",
      "position": "top",
      "marginV": 40
    }
  }
}
```

**Result**: Yellow text on semi-transparent blue background, positioned at the top with 40px margin.

### 3. Professional Narration with Fades

```json
{
  "metadata": {
    "audioType": "narration",
    "fadeIn": 0.5,
    "fadeOut": 0.5,
    "subtitleFile": "narration.srt",
    "subtitleStyle": {
      "fontSize": 26,
      "fontColor": "#FFFFFF",
      "backgroundColor": "#00000099"
    },
    "language": "en",
    "speaker": "Professional Narrator"
  }
}
```

**Result**: Smooth audio transitions with professional-looking subtitles.

### 4. Multiple Languages

```json
{
  "inputs": {
    "narration_en": {
      "type": "audio",
      "file": "narration-en.mp3",
      "duration": 10,
      "metadata": {
        "audioType": "narration",
        "subtitleFile": "subtitles-en.srt",
        "language": "en"
      }
    },
    "narration_zh": {
      "type": "audio",
      "file": "narration-zh.mp3",
      "duration": 10,
      "metadata": {
        "audioType": "narration",
        "subtitleFile": "subtitles-zh.srt",
        "language": "zh-CN",
        "subtitleStyle": {
          "fontFamily": "PingFang SC"
        }
      }
    }
  }
}
```

**Result**: Different narration tracks for different languages.

### 5. Complete Example: Tutorial Video

```json
{
  "version": 1,
  "inputs": {
    "tutorial_video": {
      "type": "video",
      "file": "tutorial.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 30
    },
    "bgm": {
      "type": "audio",
      "file": "background.mp3",
      "duration": 60,
      "metadata": {
        "audioType": "bgm",
        "loop": true,
        "fadeIn": 2.0,
        "fadeOut": 2.0
      }
    },
    "narration": {
      "type": "audio",
      "file": "tutorial-narration.mp3",
      "duration": 25,
      "metadata": {
        "audioType": "narration",
        "fadeIn": 0.5,
        "fadeOut": 0.5,
        "subtitleFile": "tutorial-subtitles.srt",
        "subtitleStyle": {
          "fontFamily": "Arial",
          "fontSize": 28,
          "fontColor": "#FFFFFF",
          "backgroundColor": "#00000099",
          "position": "bottom",
          "marginV": 30
        },
        "language": "en",
        "speaker": "Tutorial Host"
      }
    },
    "click": {
      "type": "audio",
      "file": "click.wav",
      "duration": 0.3,
      "metadata": {
        "audioType": "sfx"
      }
    }
  },
  "tracks": {
    "video_track": {
      "type": "video",
      "clips": [
        {
          "name": "main_video",
          "source": "tutorial_video",
          "timelineTrackStart": 0,
          "duration": 30,
          "clipType": "video"
        }
      ]
    },
    "bgm_track": {
      "type": "audio",
      "clips": [
        {
          "name": "bg_music",
          "source": "bgm",
          "timelineTrackStart": 0,
          "duration": 30,
          "volume": 0.3
        }
      ]
    },
    "narration_track": {
      "type": "audio",
      "clips": [
        {
          "name": "voice",
          "source": "narration",
          "timelineTrackStart": 2,
          "duration": 25,
          "volume": 1.0
        }
      ]
    },
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click1",
          "source": "click",
          "timelineTrackStart": 5,
          "duration": 0.3,
          "volume": 0.8
        }
      ]
    }
  }
}
```

**Result**: Complete tutorial video with background music, narration with subtitles, and sound effects.

## FFmpeg Command Generation

### Audio Filter Chain (Narration)

```bash
[N:a]atrim=0:10,asetpts=PTS-STARTPTS,
afade=t=in:st=0:d=0.5,
afade=t=out:st=9.5:d=0.5,
volume=1.0[narration_clip]
```

**Filters Used:**
- `atrim`: Extract audio segment
- `asetpts`: Reset timestamp
- `afade=t=in`: Fade-in effect
- `afade=t=out`: Fade-out effect
- `volume`: Volume adjustment

### Subtitle Filter Chain

```bash
[video_output]subtitles=filename='subtitles/narration.srt':
force_style='FontName=Arial,FontSize=28,PrimaryColour=&HFFFFFFFF,
BackColour=&H99000000,Alignment=2,MarginV=30'[video_with_subtitles]
```

**Parameters:**
- `filename`: Path to SRT file
- `force_style`: ASS subtitle styling
  - `FontName`: Font family
  - `FontSize`: Font size in points
  - `PrimaryColour`: Text color (ASS format: `&HAABBGGRR`)
  - `BackColour`: Background color (ASS format with alpha)
  - `Alignment`: Position (2=center-bottom, 5=center-middle, 8=center-top)
  - `MarginV`: Vertical margin in pixels

## Color Format Conversion

The subtitle system automatically converts hex colors to FFmpeg's ASS format:

| Input (Hex) | ASS Format | Description |
|-------------|------------|-------------|
| `#FFFFFF` | `&HFFFFFFFF` | White text, opaque |
| `#00000080` | `&H80000000` | Black background, 50% transparent |
| `#FF0000` | `&HFF0000FF` | Red text, opaque |
| `#FFFF00CC` | `&HCCFFFF00` | Yellow text, 80% opaque |

## Subtitle Position Reference

```
┌─────────────────────────┐
│    position: "top"      │ ← Alignment: 8
│                         │
│  position: "middle"     │ ← Alignment: 5
│                         │
│   position: "bottom"    │ ← Alignment: 2
└─────────────────────────┘
```

## Best Practices

### Audio Quality

1. **Volume Levels**
   - Narration: 0.9 - 1.0 (primary audio)
   - BGM: 0.3 - 0.5 (background)
   - SFX: 0.7 - 1.0 (emphasis)

2. **Fade Timing**
   - Narration fade-in: 0.3 - 0.5 seconds
   - Narration fade-out: 0.3 - 0.5 seconds
   - Avoid very short fades (< 0.1s) for voice

3. **Audio Format**
   - Preferred: MP3 or AAC
   - Sample rate: 44100 Hz or 48000 Hz
   - Bitrate: 128-320 kbps

### Subtitle Styling

1. **Readability**
   - Font size: 24-32 points for 1080p
   - Use high contrast (white text on dark background)
   - Add background for better visibility
   - Keep text concise and clear

2. **Positioning**
   - Bottom: Standard for most content
   - Top: When bottom content is important
   - Middle: Rarely used, avoid overlapping

3. **Colors**
   - White text (`#FFFFFF`) is most readable
   - Semi-transparent black background (`#00000080` to `#000000CC`)
   - Avoid bright colors that strain eyes

### Subtitle Timing

1. **Sync with Audio**
   - Start subtitles slightly before speech
   - End subtitles slightly after speech
   - Minimum display time: 1 second
   - Maximum display time: 7 seconds

2. **Line Length**
   - Max 42 characters per line
   - Max 2 lines per subtitle
   - Break at natural phrase boundaries

3. **Reading Speed**
   - Adults: 15-20 characters per second
   - Allow time for reading and comprehension

## Testing

### Test Your Narration

```bash
# Build the project
npm run build

# Run narration test
node test-narration.js

# Execute generated command
chmod +x test-narration-output.sh
./test-narration-output.sh
```

### Verify Output

```bash
# Check audio streams
ffprobe -v error -show_streams output-narration-test.mp4

# Check subtitle rendering
ffplay output-narration-test.mp4
```

## Troubleshooting

### Issue: Subtitles not appearing

**Possible Causes:**
1. SRT file path is incorrect
2. SRT file format is invalid
3. Subtitle timing is outside video duration

**Solution:**
- Verify `subtitleFile` path is correct
- Validate SRT format (use online validators)
- Check subtitle timecodes match audio duration

### Issue: Subtitles with wrong colors

**Possible Causes:**
1. Hex color format is invalid
2. Alpha channel not specified

**Solution:**
- Use proper hex format: `#RRGGBB` or `#RRGGBBAA`
- Add alpha channel for transparency: `#00000080`

### Issue: Audio clipping or distortion

**Possible Causes:**
1. Combined volume levels exceed 1.0
2. No fade transitions

**Solution:**
- Reduce BGM volume when narration plays
- Add fade-in and fade-out
- Use `volume < 0.5` for background music

### Issue: Subtitle text cut off

**Possible Causes:**
1. Font size too large
2. Margin too small

**Solution:**
- Reduce `fontSize` to 24-28
- Increase `marginV` to 30-50 pixels
- Test with different screen sizes

## Limitations

### Current Limitations

1. **URL Subtitles**: `subtitleUrl` not yet implemented (use `subtitleFile` for local files)
2. **Multiple Subtitle Tracks**: Only one subtitle file per narration clip
3. **Subtitle Timing**: Subtitles apply to entire video, not just narration duration
4. **Font Files**: Custom fonts require system font availability

### Future Enhancements

- [ ] URL-based subtitle file support
- [ ] Multiple subtitle languages per narration
- [ ] Time-offset for subtitles (independent of audio timing)
- [ ] Custom font file loading
- [ ] Subtitle fade-in/fade-out effects
- [ ] Advanced subtitle positioning (x, y coordinates)
- [ ] Subtitle animation effects

## Related Documentation

- [Audio Type Classification](./AUDIO_TYPES.md)
- [AudioMetadata Type Definition](../src/types/Inputs.ts)
- [parseAudioClip Implementation](../src/parseAudioClip.ts)
- [Subtitle Utilities](../src/utils/parseSubtitle.ts)
- [Text Rendering](./TEXT_RENDERING.md)
- [GIF Animation](./GIF_ANIMATION.md)

## Examples

### Example Files

- [Narration Timeline JSON](../worker/test/fixtures/narration-timeline.json)
- [Sample SRT Subtitle](../worker/test/fixtures/sample-narration.srt)
- [Test Script](../test-narration.js)

## SRT Resources

### SRT Editors

- [Subtitle Edit](https://www.nikse.dk/subtitleedit/) (Free, Windows/Linux)
- [Aegisub](http://www.aegisub.org/) (Free, Cross-platform)
- [Kapwing](https://www.kapwing.com/subtitle-maker) (Online)

### SRT Validators

- [SRT Validator](https://www.srt-validator.com/)
- [SubtitleTools](https://subtitletools.com/validate-subtitle-file)

### SRT Converters

- [SubtitleConverter](https://subtitleconverter.com/)
- Convert from VTT, ASS, SSA to SRT format

## Performance Notes

### FFmpeg Subtitle Processing

- Subtitles are burned into video (hardcoded)
- This increases rendering time
- Output file size may be slightly larger
- Cannot be disabled after rendering

### Optimization Tips

1. **Pre-process subtitles**: Validate SRT files before rendering
2. **Font caching**: Use system fonts when possible
3. **Parallel processing**: Process multiple videos with different configs
4. **Preview mode**: Use lower resolution for testing

## License

MIT - See main repository license
