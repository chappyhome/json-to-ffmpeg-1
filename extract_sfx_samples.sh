#!/bin/bash
echo "=== Extracting SFX samples for verification ==="

# Extract 0.5s segments at each SFX trigger point
ffmpeg -y -i output-audio-types-test.mp4 -ss 1.4 -t 0.5 -vn -acodec copy sfx_click1_sample.aac 2>&1 | grep -E "(Output|Duration)" || true
ffmpeg -y -i output-audio-types-test.mp4 -ss 2.9 -t 0.5 -vn -acodec copy sfx_notification_sample.aac 2>&1 | grep -E "(Output|Duration)" || true  
ffmpeg -y -i output-audio-types-test.mp4 -ss 5.4 -t 0.5 -vn -acodec copy sfx_whoosh_sample.aac 2>&1 | grep -E "(Output|Duration)" || true
ffmpeg -y -i output-audio-types-test.mp4 -ss 7.9 -t 0.5 -vn -acodec copy sfx_click2_sample.aac 2>&1 | grep -E "(Output|Duration)" || true

echo ""
echo "Extracted samples:"
ls -lh sfx_*_sample.aac 2>/dev/null || echo "No samples created"

