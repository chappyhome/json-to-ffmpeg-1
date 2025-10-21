#!/bin/bash
echo "=== Verifying SFX Timing in Generated Video ==="
echo ""

# 测试各个时间点的音量
echo "Testing audio levels at SFX trigger points:"
echo ""

# 1.5s: click1 应该触发
echo "1.5s (click1 expected):"
ffmpeg -i output-audio-types-test.mp4 -ss 1.5 -t 0.3 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 3.0s: notification1 应该触发
echo "3.0s (notification1 expected):"
ffmpeg -i output-audio-types-test.mp4 -ss 3.0 -t 0.8 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 5.5s: whoosh1 应该触发
echo "5.5s (whoosh1 expected):"
ffmpeg -i output-audio-types-test.mp4 -ss 5.5 -t 1.2 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 8.0s: click2 应该触发
echo "8.0s (click2 expected):"
ffmpeg -i output-audio-types-test.mp4 -ss 8.0 -t 0.3 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

echo ""
echo "Baseline - BGM only regions:"
echo ""

# 2.0s: 仅 BGM
echo "2.0s (BGM only):"
ffmpeg -i output-audio-types-test.mp4 -ss 2.0 -t 0.5 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

# 4.0s: 仅 BGM
echo "4.0s (BGM only):"
ffmpeg -i output-audio-types-test.mp4 -ss 4.0 -t 0.5 -af "volumedetect" -vn -f null /dev/null 2>&1 | grep mean_volume

