# Using Real Samples

The test fixtures now use real video/audio samples from the parent `samples/` directory.

## Available Samples

Located in `../samples/`:

### Videos
- `bee1920.mp4` - 40s bee video (no audio)
- `book1920.mp4` - 13s book video (no audio)
- `cows1920.mp4` - 15s cows video (with audio)
- `flowers1920.mp4` - 21s flowers video (with audio)
- `highland1920.mp4` - Highland cows video
- `kangaroo1920.mp4` - Kangaroo video
- `robin1920.mp4` - Robin bird video

### Audio
- `ever.mp3` - 181s background music
- `weekend.mp3` - 208s background music

### Images
- `flower.png` - Flower image for watermarks

## Test Fixtures

### simple-timeline.json
Simple 2-clip timeline with fade transition:
- Uses: `bee1920.mp4`, `book1920.mp4`
- Duration: 8 seconds
- Features: Basic fade transition, scaled overlay clip

### complex-timeline.json
Full-featured timeline from `complex.spec.ts`:
- Uses: All video sources, both audio tracks, watermark image
- Duration: 38 seconds
- Features:
  - 5 video clips with various transforms
  - Watermark overlay
  - 2 audio tracks
  - Multiple transition types (smoothup, smoothdown, fade, circlecrop, squeezev, squeezeh)
  - Rotation, opacity, and scaling effects

## Testing with Real Samples

### Quick test with script
```bash
cd worker
npm run dev

# In another terminal
./examples/curl-test.sh
```

### Manual test with simple timeline
```bash
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @test/fixtures/simple-timeline.json | jq .
```

### Manual test with complex timeline
```bash
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @test/fixtures/complex-timeline.json | jq .
```

## Creating Your Own Timeline

1. Copy one of the fixture files as a template
2. Modify the `inputs` to reference your video files
3. Adjust `clips` with your desired timeline
4. Set appropriate `duration` values for each input
5. POST to `/build` endpoint

Example:
```json
{
  "version": 1,
  "inputs": {
    "my_video": {
      "type": "video",
      "file": "samples/bee1920.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 40
    }
  },
  "tracks": {
    "main_track": {
      "type": "video",
      "clips": [{
        "name": "clip1",
        "source": "my_video",
        "timelineTrackStart": 0,
        "duration": 5,
        "sourceStartOffset": 10,
        "clipType": "video",
        "transform": {
          "x": 0,
          "y": 0,
          "width": 1920,
          "height": 1080,
          "rotation": 0,
          "opacity": 1
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
}
```

## Sample Licenses

All samples from [Pixabay](https://pixabay.com/) under [Pixabay License](https://pixabay.com/service/license/).
