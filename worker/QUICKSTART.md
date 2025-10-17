# Quick Start Guide

## 🚀 Generate and Execute FFmpeg Commands

### Prerequisites

1. **Install FFmpeg**
   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt install ffmpeg

   # Verify installation
   ffmpeg -version
   ```

2. **Start Worker**
   ```bash
   cd worker
   npm install
   npm run dev
   ```

   Keep this terminal running. You should see:
   ```
   ⎔ Ready on http://localhost:8787
   ```

---

## 📝 Usage Methods

### Method 1: Automated Workflow (Recommended)

**One command does everything:**

```bash
# In a new terminal
cd worker

# Test with simple timeline (2 clips, 8 seconds)
./examples/test-with-ffmpeg.sh simple

# Test with complex timeline (5 clips, watermark, audio, 38 seconds)
./examples/test-with-ffmpeg.sh complex
```

This script automatically:
- ✓ Checks worker is running
- ✓ Checks FFmpeg is installed
- ✓ Verifies sample files exist
- ✓ Calls Worker API
- ✓ Executes FFmpeg command
- ✓ Shows video info

**Output:**
```
=== FFmpeg Test Workflow ===

[1/5] Checking worker status...
✓ Worker is running

[2/5] Checking FFmpeg installation...
✓ ffmpeg version 6.0

[3/5] Checking sample files...
✓ All required samples found

[4/5] Generating FFmpeg command...
✓ Command generated and saved to: ffmpeg-simple.sh

[5/5] Executing FFmpeg command...
...
✓ SUCCESS

Output file: output.mp4
Size: 2.3M
Duration: 8s

Play with:
  ffplay output.mp4
  open output.mp4
```

---

### Method 2: Interactive Generation

**Generate command with execution prompt:**

```bash
./examples/generate-ffmpeg.sh simple
```

The script will:
1. Call Worker API
2. Show generated command
3. Save to `run-ffmpeg-simple.sh`
4. Ask: "Execute the command now? (y/N)"

If you press `y`, it executes immediately.
If you press `n`, you can run manually later:

```bash
bash worker/examples/run-ffmpeg-simple.sh
```

---

### Method 3: Manual Extraction

**Extract command without execution:**

```bash
# Extract from fixture
./examples/extract-command.sh test/fixtures/simple-timeline.json my-command.sh

# View the command
cat my-command.sh

# Execute manually when ready
bash my-command.sh
```

---

### Method 4: Direct API Call

**Use curl to get raw response:**

```bash
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @test/fixtures/simple-timeline.json | jq .
```

**Response:**
```json
{
  "command": "#!/bin/bash\nmkdir -p ./tmp\nffmpeg -y ...",
  "args": ["-y", "-i", "./tmp/clip1.mp4", ...],
  "warnings": []
}
```

Extract just the command:
```bash
curl -s -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @test/fixtures/simple-timeline.json | \
  jq -r '.command' > command.sh

bash command.sh
```

---

## 🎬 Testing Both Timelines

### Simple Timeline (8 seconds)
```bash
./examples/test-with-ffmpeg.sh simple
```
- 2 video clips (bee, book)
- 1 fade transition
- Output: `output.mp4`

### Complex Timeline (38 seconds)
```bash
./examples/test-with-ffmpeg.sh complex
```
- 5 video clips
- Watermark overlay
- 2 audio tracks (mixed)
- 7 different transitions
- Output: `output.mp4`

---

## 🎥 Viewing Output

### Play with ffplay
```bash
ffplay output.mp4
```

### Open with default player
```bash
# macOS
open output.mp4

# Linux
xdg-open output.mp4
```

### Get video info
```bash
ffprobe -v error -show_format -show_streams output.mp4
```

---

## 🔧 Troubleshooting

### Worker not running
```
Error: Worker is not running
```
**Solution:** Start the worker in another terminal:
```bash
cd worker
npm run dev
```

### FFmpeg not found
```
Error: FFmpeg is not installed
```
**Solution:** Install FFmpeg:
```bash
brew install ffmpeg  # macOS
```

### Missing samples
```
Error: Missing sample files
```
**Solution:** Ensure you're in the worker directory and samples exist:
```bash
ls ../samples/  # Should show bee1920.mp4, book1920.mp4, etc.
```

### Permission denied
```bash
chmod +x examples/*.sh
```

---

## 📊 Understanding Output

When successful, you'll see:

```
=== ✓ SUCCESS ===

Output file: output.mp4
Size: 2.3M
Duration: 8s

Play with:
  ffplay output.mp4

Video info:
  width=384
  height=216
  r_frame_rate=30/1
  codec_name=h264
```

This means:
- Video was created successfully
- Resolution: 384x216 (scaled by scaleRatio: 0.2)
- Frame rate: 30fps
- Codec: H.264
- File size: 2.3MB

---

## 🎯 Next Steps

1. **Modify timeline** - Edit `test/fixtures/simple-timeline.json`
2. **Create custom timeline** - Copy a fixture and modify
3. **Add plugins** - See main README for plugin development
4. **Deploy worker** - `npm run deploy`

---

## 📚 More Information

- [Main README](./README.md) - Full documentation
- [SAMPLES.md](./SAMPLES.md) - Sample file details
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Technical details
