# Soft Subtitle Timing Sync Guide

## Problem: Subtitle and Audio Timing Mismatch

### What's Happening?

When using soft subtitles with multiple narration clips at different timeline positions, you may experience subtitle and audio being out of sync:

**Symptom:**
- Chinese subtitles display while English audio plays
- Subtitles finish before the audio ends
- Subtitles appear at wrong times

**Root Cause:**

Soft subtitle SRT files have timecodes **relative to the entire video** (starting from `00:00:00`), but narration clips may start at different positions in your timeline.

## Example Problem

### Your Timeline Configuration

```json
{
  "tracks": {
    "narration_track": {
      "type": "audio",
      "clips": [
        {
          "name": "narration_en_clip",
          "source": "narration_en",
          "timelineTrackStart": 1,    // ← Starts at 1 second
          "duration": 10
        },
        {
          "name": "narration_zh_clip",
          "source": "narration_zh",
          "timelineTrackStart": 11,   // ← Starts at 11 seconds
          "duration": 4
        }
      ]
    }
  }
}
```

### Original SRT Files (WRONG)

**narration-en.srt:**
```srt
1
00:00:00,000 --> 00:00:05,000
Welcome to our tutorial.

2
00:00:05,000 --> 00:00:10,000
Let's get started.
```

**narration-zh.srt:**
```srt
1
00:00:00,000 --> 00:00:02,000
欢迎来到我们的教程。

2
00:00:02,000 --> 00:00:04,000
让我们开始吧。
```

### What Happens? ❌

| Video Timeline | English Audio | Chinese Audio | English Subtitle | Chinese Subtitle |
|---------------|---------------|---------------|------------------|------------------|
| 0-1s | (silent) | (none) | "Welcome..." (WRONG!) | "欢迎..." (WRONG!) |
| 1-6s | "Welcome..." | (none) | "Let's get..." (WRONG!) | (none) |
| 6-11s | "Let's get..." | (none) | (none) | (none) |
| 11-13s | (none) | "欢迎..." | (none) | (none) ❌ |
| 13-15s | (none) | "让我们..." | (none) | (none) ❌ |

**Result:** Subtitles appear at 0-5 seconds while audio plays at 1-11 seconds (English) and 11-15 seconds (Chinese). Complete mismatch!

## Solution: Adjust SRT Timecodes

### Corrected SRT Files (CORRECT)

**narration-en.srt:** (Offset by +1 second to match `timelineTrackStart: 1`)
```srt
1
00:00:01,000 --> 00:00:06,000
Welcome to our tutorial.

2
00:00:06,000 --> 00:00:11,000
Let's get started.
```

**narration-zh.srt:** (Offset by +11 seconds to match `timelineTrackStart: 11`)
```srt
1
00:00:11,000 --> 00:00:13,000
欢迎来到我们的教程。

2
00:00:13,000 --> 00:00:15,000
让我们开始吧。
```

### What Happens Now? ✅

| Video Timeline | English Audio | Chinese Audio | English Subtitle | Chinese Subtitle |
|---------------|---------------|---------------|------------------|------------------|
| 0-1s | (silent) | (none) | (none) | (none) |
| 1-6s | "Welcome..." | (none) | "Welcome..." ✅ | (none) |
| 6-11s | "Let's get..." | (none) | "Let's get..." ✅ | (none) |
| 11-13s | (none) | "欢迎..." | (none) | "欢迎..." ✅ |
| 13-15s | (none) | "让我们..." | (none) | "让我们..." ✅ |

**Result:** Perfect sync! ✅

## Formula for Adjusting SRT Timecodes

```
New SRT Timecode = Original SRT Timecode + timelineTrackStart
```

### Example Calculation

**Clip Configuration:**
```json
{
  "timelineTrackStart": 11,
  "duration": 4
}
```

**Original SRT Line:**
```srt
00:00:00,000 --> 00:00:02,000
```

**Adjusted SRT Line:**
```srt
00:00:11,000 --> 00:00:13,000
```

**Calculation:**
- Start: 00:00:00 + 11s = 00:00:11
- End: 00:00:02 + 11s = 00:00:13

## Automatic Warnings

The library now automatically warns you when SRT timecodes need adjustment:

```bash
$ node test-soft-subtitles.js

Warning: Clip "narration_en_clip" starts at 1s in timeline.
Soft subtitle SRT timecodes MUST be adjusted to match this offset.
For example, if your SRT has "00:00:00 --> 00:00:05",
it should be "00:00:01 --> 00:00:06" to sync with the audio.

Warning: Clip "narration_zh_clip" starts at 11s in timeline.
Soft subtitle SRT timecodes MUST be adjusted to match this offset.
For example, if your SRT has "00:00:00 --> 00:00:05",
it should be "00:00:11 --> 00:00:16" to sync with the audio.
```

## Tools for Adjusting SRT Timecodes

### Method 1: Manual Editing

Use a text editor to adjust each timecode:
```srt
1
00:00:11,000 --> 00:00:13,000  # ← Added +11 seconds
欢迎来到我们的教程。
```

### Method 2: Subtitle Edit Software

**[Subtitle Edit](https://www.nikse.dk/subtitleedit/)** (Free)

1. Open your SRT file
2. Menu: **Synchronization** → **Adjust all times**
3. Enter offset (e.g., `+11000` milliseconds = +11 seconds)
4. Click **Apply**
5. Save the adjusted SRT

### Method 3: Online Tools

**[Subtitle Tools - Time Shift](https://subtitletools.com/shift-subtitle-online)**

1. Upload SRT file
2. Enter offset (e.g., `+11` seconds)
3. Download adjusted SRT

### Method 4: Command Line (sed)

```bash
# Add 11 seconds to all timecodes
# This is a simplified example - use proper SRT tools for production

# For simple cases, use a script:
python3 << 'EOF'
import sys

offset_seconds = 11  # Your timelineTrackStart value
offset_ms = offset_seconds * 1000

def shift_time(time_str, offset_ms):
    """Shift SRT timecode by offset in milliseconds"""
    # Parse: HH:MM:SS,mmm
    h, m, rest = time_str.split(':')
    s, ms = rest.split(',')

    total_ms = int(h) * 3600000 + int(m) * 60000 + int(s) * 1000 + int(ms)
    total_ms += offset_ms

    h = total_ms // 3600000
    m = (total_ms % 3600000) // 60000
    s = (total_ms % 60000) // 1000
    ms = total_ms % 1000

    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

# Read and process SRT
with open('narration-zh.srt', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '-->' in line:
        start, end = line.strip().split(' --> ')
        new_start = shift_time(start, offset_ms)
        new_end = shift_time(end, offset_ms)
        lines[i] = f"{new_start} --> {new_end}\n"

# Write adjusted SRT
with open('narration-zh-adjusted.srt', 'w') as f:
    f.writelines(lines)

print(f"✅ Adjusted SRT saved to narration-zh-adjusted.srt")
EOF
```

## Best Practices

### 1. Start Clips at 0 Seconds

**Recommended Approach:**

```json
{
  "tracks": {
    "narration_track": {
      "clips": [
        {
          "timelineTrackStart": 0,  // ← Start at 0
          "duration": 10
        }
      ]
    }
  }
}
```

**Benefit:** SRT timecodes don't need adjustment if clip starts at 0.

### 2. Use Single Narration Clip

For multiple languages, create separate timeline files instead of multiple clips:

**timeline-en.json** (English version):
```json
{
  "inputs": {
    "narration": {
      "metadata": {
        "audioType": "narration",
        "subtitleUrl": "https://r2.dev/subtitle-en.srt"
      }
    }
  },
  "tracks": {
    "narration_track": {
      "clips": [
        {
          "timelineTrackStart": 0,
          "duration": 10
        }
      ]
    }
  }
}
```

**timeline-zh.json** (Chinese version):
```json
{
  "inputs": {
    "narration": {
      "metadata": {
        "audioType": "narration",
        "subtitleUrl": "https://r2.dev/subtitle-zh.srt"
      }
    }
  },
  "tracks": {
    "narration_track": {
      "clips": [
        {
          "timelineTrackStart": 0,
          "duration": 10
        }
      ]
    }
  }
}
```

**Benefit:** Each version has properly aligned subtitles without adjustment.

### 3. Pre-adjust SRT Files

Before uploading to Cloudflare R2 or CDN:
1. Calculate required offset = `timelineTrackStart`
2. Adjust all SRT timecodes
3. Upload adjusted SRT files
4. Use adjusted URLs in timeline JSON

## Understanding Soft Subtitle Limitations

### Why Can't This Be Automatic?

Soft subtitles are embedded as **global streams** in the video container:

```
Video File Structure:
├── Video Stream (0:v)
├── Audio Stream (0:a)
├── Subtitle Stream 1 (0:s:0) ← English subtitles (00:00:00 to end)
└── Subtitle Stream 2 (0:s:1) ← Chinese subtitles (00:00:00 to end)
```

These subtitle streams:
- Start at `00:00:00` (beginning of video)
- Cannot be tied to specific audio clips
- Are controlled by the video player, not FFmpeg filters

### What About Hardcoded Subtitles?

Hardcoded subtitles (burned-in) CAN sync with specific clips because they're rendered during video processing, but they have major drawbacks:

| Feature | Soft Subtitles | Hardcoded Subtitles |
|---------|---------------|-------------------|
| Timing | Manual adjustment needed | Automatic clip sync ✅ |
| Processing | 10-30 seconds | 8-15 minutes |
| Toggleable | Yes ✅ | No (permanent) |
| Multi-language | One file ✅ | Separate files |
| File size | +0.1% | ±10% |

**Trade-off:** Soft subtitles require manual timing adjustment, but offer better performance and flexibility.

## FAQ

### Q: Can I use different SRT files for each clip?

**A:** Yes, but you must adjust each SRT's timecodes to match the clip's `timelineTrackStart`.

### Q: What if I have multiple narration clips in sequence?

**A:** Adjust each SRT file:
- Clip 1 at 0s → SRT timecodes: 00:00:00 - 00:00:10
- Clip 2 at 10s → SRT timecodes: 00:00:10 - 00:00:20
- Clip 3 at 20s → SRT timecodes: 00:00:20 - 00:00:30

### Q: Can I use subtitle offset in FFmpeg?

**A:** Not for embedded subtitle streams. The `-itsoffset` flag doesn't work with mov_text subtitle streams in MP4 containers.

### Q: What if I forget to adjust the timecodes?

**A:** You'll see the warning when running `parseSchema()`. The subtitle will appear at wrong times, causing the audio/subtitle mismatch you're experiencing.

### Q: Can the library auto-adjust SRT timecodes?

**A:** Not currently, because:
1. It would require downloading SRT files (violates "no download" design)
2. SRT parsing and modification is complex
3. Users may already have adjusted files

Future enhancement could add an optional auto-adjustment feature.

## Summary

### Checklist for Perfect Subtitle Sync

- [ ] Check `timelineTrackStart` for each narration clip
- [ ] Calculate offset: `New Time = Original Time + timelineTrackStart`
- [ ] Adjust all SRT timecodes using a tool or manually
- [ ] Upload adjusted SRT files
- [ ] Update `subtitleUrl` in timeline JSON
- [ ] Run `parseSchema()` and check for warnings
- [ ] Test the generated video to verify sync

### Quick Reference

```
Clip starts at 0s   → No adjustment needed
Clip starts at 5s   → Add +5 seconds to all SRT timecodes
Clip starts at 11s  → Add +11 seconds to all SRT timecodes
```

## Related Documentation

- [Narration with Soft Subtitles](./NARRATION.md)
- [Subtitle Comparison: Hard vs Soft](./SUBTITLE_COMPARISON.md)
- [parseSubtitle.ts Implementation](../src/utils/parseSubtitle.ts)
