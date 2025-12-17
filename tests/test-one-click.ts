/* eslint-disable no-console */
import { generateBatchTimelines } from "../src/one-click/generateTimeline";
import { OneClickInput } from "../src/one-click/types";
import { parseSchema } from "../src/index";
import * as assert from "assert";

console.log("Running One-Click Generation Test...");

const mockInput: OneClickInput = {
    config: {
        width: 1920,
        height: 1080,
        framerate: 30,
    },
    bgm: {
        url: "https://example.com/bgm.mp3",
        volume: 0.3,
        loop: true
    },
    scripts: [
        [
            {
                text: "Scene 1: Introduction",
                duration: 5,
                keywords: ["nature", "forest"],
                voiceoverFile: "https://example.com/vo1.mp3"
            },
            {
                text: "Scene 2: The City",
                duration: 4,
                keywords: ["city", "urban"],
            }
        ],
        [
            {
                text: "Variant B Scene 1",
                duration: 3,
                keywords: ["nature"],
            }
        ]
    ],
    assets: [
        {
            id: "vid1",
            url: "https://example.com/forest.mp4",
            type: "video",
            tags: ["nature", "tree", "forest"],
            duration: 10
        },
        {
            id: "img1",
            url: "https://example.com/city.jpg",
            type: "image",
            tags: ["city", "building"],
            duration: 0
        }
    ]
};

try {
    const timelines = generateBatchTimelines(mockInput);

    assert.strictEqual(timelines.length, 2, "Should generate 2 timelines");

    // Check Timeline 1
    const t1 = timelines[0];
    assert.strictEqual(t1.output.width, 1920, "Width should be 1920");
    assert.strictEqual(t1.output.endPosition, 9, "T1 duration should be 9s");
    assert.strictEqual(t1.tracks.video_main.clips.length, 2, "T1 should have 2 clips");

    // Check Timeline 2
    const t2 = timelines[1];
    assert.strictEqual(t2.output.endPosition, 3, "T2 duration should be 3s");
    assert.strictEqual(t2.tracks.video_main.clips.length, 1, "T2 should have 1 clips");

    // Check Matching (T1)
    const firstClip = t1.tracks.video_main.clips[0];
    assert.ok(firstClip.source.includes("asset_vid1"), "First clip should be forest video");

    // Check Schema Validity
    console.log("Verifying schema via parseSchema...");
    timelines.forEach((t, i) => {
        parseSchema(t);
        console.log(`Command ${i + 1} generated successfully!`);
    });

    console.log("✅ Batch One-Click Generation Test Passed!");
} catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
}
