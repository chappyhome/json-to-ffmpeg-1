#!/bin/bash
echo "=== Extracting and analyzing audio from actual video ==="

# 提取音频轨道
ffmpeg -y -i output-audio-types-test.mp4 -vn -acodec pcm_s16le extracted_audio.wav 2>&1 | grep -E "Output" | head -1

echo "Extracted audio stats:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 extracted_audio.wav
ffmpeg -i extracted_audio.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

echo ""
echo "First 3 seconds (BGM fade-in region):"
ffmpeg -i extracted_audio.wav -ss 0 -t 3 -af "volumedetect" -f null - 2>&1 | grep mean_volume

echo ""
echo "Compare with expected BGM:"
ffmpeg -i stage1_bgm_track.wav -ss 0 -t 3 -af "volumedetect" -f null - 2>&1 | grep mean_volume

echo ""
echo "Checking if audio is actually silent or just very quiet:"
ffmpeg -i extracted_audio.wav -ss 0 -t 1 -af "astats" -f null - 2>&1 | grep -E "(RMS level|Peak level|Mean difference)" | head -6

