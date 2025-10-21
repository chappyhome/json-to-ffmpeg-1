#!/bin/bash
echo "=== Testing BGM and SFX separately ==="

# 测试 BGM 输入文件
echo "1. BGM source file (samples/ever.mp3):"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 samples/ever.mp3

# 生成仅 BGM 的测试命令
cat > test_bgm_only.sh << 'BGMEOF'
#!/bin/bash
ffmpeg -y -i samples/ever.mp3 \
-filter_complex "[0:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st=9:d=1,volume=0.6[bgm_out]" \
-map '[bgm_out]' -c:a aac -b:a 320k test_bgm_only.aac
BGMEOF
chmod +x test_bgm_only.sh
./test_bgm_only.sh 2>&1 | grep -E "(Output|error)" | head -3

echo ""
echo "2. BGM-only audio stats:"
ffmpeg -i test_bgm_only.aac -af "volumedetect" -vn -f null - 2>&1 | grep -E "mean_volume"

echo ""
echo "3. Full video audio stats:"
ffmpeg -i output-audio-types-test.mp4 -af "volumedetect" -vn -f null - 2>&1 | grep -E "mean_volume"

echo ""
echo "4. Compare first 3 seconds (should have BGM fade-in):"
echo "   BGM-only:"
ffmpeg -i test_bgm_only.aac -ss 0 -t 3 -af "volumedetect" -vn -f null - 2>&1 | grep mean_volume
echo "   Full video:"
ffmpeg -i output-audio-types-test.mp4 -ss 0 -t 3 -af "volumedetect" -vn -f null - 2>&1 | grep mean_volume

