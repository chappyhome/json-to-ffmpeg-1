import { generateBatchTimelines } from "../src/one-click/generateTimeline";
import { OneClickInput } from "../src/one-click/types";

// Sample Input
const input: OneClickInput = {
    scripts: [
        [
            {
                text: "Script A: Hello world",
                keywords: ["nature"],
                duration: 3
            },
            {
                text: "Script A: Show me the forest.",
                keywords: ["forest"],
                duration: 4
            }
        ],
        [
            {
                text: "Script B: Welcome to the city.",
                keywords: ["nature", "urban"], // Mixed
                duration: 5
            }
        ]
    ],
    assets: [
        {
            id: "video_nature_1",
            url: "https://example.com/nature.mp4",
            tags: ["nature", "outdoor"],
            type: "video",
            duration: 10
        },
        {
            id: "video_forest_1",
            url: "https://example.com/forest.mp4",
            tags: ["forest", "trees"],
            type: "video",
            duration: 15
        }
    ],
    config: {
        width: 1920,
        height: 1080,
        framerate: 30
    }
};

// Generate Timeline
console.log("Generating batch timelines from input...");
try {
    const timelines = generateBatchTimelines(input);

    console.log("\n--- Generated Timelines JSON ---\n");
    console.log(`Generated ${timelines.length} timelines`);
    timelines.forEach((t, i) => {
        console.log(`\nTimeline ${i + 1}:`);
        console.log(JSON.stringify(t, null, 2));
    });
    console.log("\n-------------------------------\n");

} catch (error) {
    console.error("Error generating timeline:", error);
}
