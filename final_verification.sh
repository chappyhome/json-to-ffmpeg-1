#!/bin/bash
echo "=== Final Audio Verification ==="
echo ""

echo "Complete audio track analysis:"
echo "1. Overall volume:"
ffmpeg -i output-audio-types-test.mp4 -af "volumedetect" -vn -f null - 2>&1 | grep -E "(mean_volume|max_volume)"

echo ""
echo "2. Timeline breakdown:"
echo ""
echo "   0-1s (BGM fade-in, no SFX):"
ffmpeg -i output-audio-types-test.mp4 -ss 0 -t 1 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo "   1.5-1.8s (click1 trigger):"
ffmpeg -i output-audio-types-test.mp4 -ss 1.5 -t 0.3 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo "   2-2.5s (BGM only, no SFX):"
ffmpeg -i output-audio-types-test.mp4 -ss 2 -t 0.5 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo "   3-3.8s (notification1 trigger):"
ffmpeg -i output-audio-types-test.mp4 -ss 3 -t 0.8 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo "   5.5-6.5s (whoosh1 trigger):"
ffmpeg -i output-audio-types-test.mp4 -ss 5.5 -t 1 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo "   8-8.3s (click2 trigger):"
ffmpeg -i output-audio-types-test.mp4 -ss 8 -t 0.3 -af "astats" -vn -f null - 2>&1 | grep "RMS level dB" | head -2

echo ""
echo "3. Audio stream info:"
ffprobe -v error -show_entries stream=codec_name,sample_rate,channels,bit_rate -of default=noprint_wrappers=1 output-audio-types-test.mp4 | grep -v "^$"

echo ""
echo "=== Conclusion ==="
echo "If RMS levels show:"
echo "  - BGM only regions: around -27 to -35 dB"
echo "  - SFX trigger points: around -23 to -26 dB (louder)"
echo "Then BOTH BGM and SFX are present and audible."

