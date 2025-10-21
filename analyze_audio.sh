#!/bin/bash
echo "=== Audio Analysis at Different Time Points ==="
echo ""

# 时间点: 0-1s (仅 BGM fade-in)
echo "0-1s (BGM fade-in only):"
ffmpeg -i output-audio-types-test.mp4 -ss 0 -t 1 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 时间点: 1.5-1.8s (BGM + click1)
echo "1.5-1.8s (BGM + click1):"
ffmpeg -i output-audio-types-test.mp4 -ss 1.5 -t 0.3 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 时间点: 3-3.8s (BGM + notification1)
echo "3-3.8s (BGM + notification1):"
ffmpeg -i output-audio-types-test.mp4 -ss 3 -t 0.8 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 时间点: 5.5-6.7s (BGM + whoosh1)
echo "5.5-6.7s (BGM + whoosh1):"
ffmpeg -i output-audio-types-test.mp4 -ss 5.5 -t 1.2 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 时间点: 8-8.3s (BGM + click2)
echo "8-8.3s (BGM + click2):"
ffmpeg -i output-audio-types-test.mp4 -ss 8 -t 0.3 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 时间点: 2-2.5s (仅 BGM, 无 SFX)
echo "2-2.5s (BGM only, no SFX):"
ffmpeg -i output-audio-types-test.mp4 -ss 2 -t 0.5 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume
