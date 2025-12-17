/* eslint-disable no-console */
const { parseSchema } = require("../dist/index.js");

const testTimeline = {
    version: 1,
    inputs: {
        test_video: {
            type: "video",
            file: "https://example.com/test.mp4",
            hasAudio: true,
            hasVideo: true,
            duration: 10
        }
    },
    tracks: {
        video_main: {
            type: "video",
            clips: [
                {
                    name: "clip1",
                    source: "test_video",
                    timelineTrackStart: 0,
                    duration: 5,
                    sourceStartOffset: 0,
                    clipType: "video",
                    transform: {
                        x: 0,
                        y: 0,
                        width: 1920,
                        height: 1080,
                        rotation: 0,
                        opacity: 1
                    },
                    volume: 1
                }
            ]
        }
    },
    transitions: [],
    output: {
        tempDir: "./tmp",
        file: "test-output.mp4",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "320k",
        preset: "veryfast",
        crf: 23,
        flags: ["-pix_fmt", "yuv420p"],
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
        scaleRatio: 1
    }
};

const command = parseSchema(testTimeline);

console.log("Testing FFmpeg command format:");
console.log("================================");

if (command.startsWith("#!/bin/bash")) {
    console.log("❌ FAILED: Command still starts with #!/bin/bash");
    console.log("First 50 chars:", command.substring(0, 50));
} else if (command.startsWith("ffmpeg")) {
    console.log("✅ PASSED: Command starts with 'ffmpeg' directly");
    console.log("First 50 chars:", command.substring(0, 50));
} else {
    console.log("⚠️  WARNING: Unexpected command format");
    console.log("First 50 chars:", command.substring(0, 50));
}
