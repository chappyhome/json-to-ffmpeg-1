/* eslint-disable no-console */
/**
 * Test script for One-Click API (Live Worker).
 * 
 * Usage: node tests/test-api-live.js [payload-file]
 * Default payload: tests/fixtures/batch-input.json
 */
const fs = require('fs');
const path = require('path');

const WORKER_URL = "http://127.0.0.1:8787";
const DEFAULT_PAYLOAD = path.join(__dirname, "fixtures/batch-input.json");

// Parse args
const payloadFile = process.argv[2] || DEFAULT_PAYLOAD;

async function runTest() {
    console.log(`\n🔵 Testing API: ${WORKER_URL}/one-click/build`);
    console.log(`📂 Input File: ${payloadFile}`);

    if (!fs.existsSync(payloadFile)) {
        console.error(`❌ File not found: ${payloadFile}`);
        process.exit(1);
    }

    const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf-8'));

    try {
        const response = await fetch(`${WORKER_URL}/one-click/build`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log(`\n📡 Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ Error Body:", text);
            return;
        }

        const data = await response.json();
        console.log("\n✅ Response Received!");

        // Pretty print a summary, or the full JSON if it's small enough, usually the user wants to see the JSON.
        console.log("\n--- JSON OUTPUT START ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("--- JSON OUTPUT END ---\n");

        if (data.results && Array.isArray(data.results)) {
            console.log(`📊 Generated ${data.results.length} timelines.`);
        }

    } catch (error) {
        console.error("❌ Request Failed:", error.message);
        console.error("Make sure 'npm run dev' is running in another terminal!");
    }
}

runTest();
