#!/bin/bash
echo "=== Testing amix behavior ==="

# 测试 1: 默认 amix
echo "Test 1: Default amix (weights=1/n)"
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=1" -f lavfi -i "sine=frequency=880:duration=1" \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" test_amix_default.wav 2>&1 | grep -E "Output"
ffmpeg -i test_amix_default.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 测试 2: amix with weights (保持原音量)
echo ""
echo "Test 2: amix with weights=1 1"
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=1" -f lavfi -i "sine=frequency=880:duration=1" \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest:weights='1 1'" test_amix_weighted.wav 2>&1 | grep -E "Output"
ffmpeg -i test_amix_weighted.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 测试 3: 检查实际 BGM+SFX 混合
echo ""
echo "Test 3: Actual BGM volume in video (0-1s, before SFX)"
ffmpeg -i output-audio-types-test.mp4 -ss 0 -t 1 -af "volumedetect" -vn -f null - 2>&1 | grep mean_volume

echo ""
echo "Expected BGM volume (from BGM-only):"
ffmpeg -i test_bgm_only.aac -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume

