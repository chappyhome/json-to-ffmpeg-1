#!/bin/bash
echo "=== Testing apad with amix ==="

# 创建测试音频
# Track 1: 10秒的低频音 (BGM 模拟)
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=10" -c:a pcm_s16le bgm_test.wav 2>&1 | grep -E "Output" | head -1

# Track 2: 8.3秒的高频音 + apad 到 10秒 (SFX 模拟)
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=8.3" \
-af "apad=whole_dur=10" -c:a pcm_s16le sfx_test.wav 2>&1 | grep -E "Output" | head -1

# 检查长度
echo ""
echo "BGM track duration:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 bgm_test.wav

echo "SFX track duration (after apad):"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 sfx_test.wav

# 混合
echo ""
echo "Mixing BGM + SFX with amix:"
ffmpeg -y -i bgm_test.wav -i sfx_test.wav \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" mixed_test.wav 2>&1 | grep -E "Output" | head -1

# 检查混合后的音量
echo ""
echo "Individual volumes:"
echo "  BGM alone:"
ffmpeg -i bgm_test.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume
echo "  SFX alone:"
ffmpeg -i sfx_test.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume
echo "  Mixed:"
ffmpeg -i mixed_test.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 检查混合后 0-1 秒（应该只有 BGM）
echo ""
echo "First second (should be BGM only):"
ffmpeg -i mixed_test.wav -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume

