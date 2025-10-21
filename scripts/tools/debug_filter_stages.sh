#!/bin/bash
echo "=== Debugging Filter Stages ==="

# 仅测试 BGM track 生成
echo "Stage 1: BGM track only"
ffmpeg -y -i samples/ever.mp3 \
-filter_complex "[0:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st=9:d=1,volume=0.6[bgm_clip];
[bgm_clip]concat=n=1:v=0:a=1[bgm_track]" \
-map '[bgm_track]' -c:a pcm_s16le stage1_bgm_track.wav 2>&1 | grep -E "Output" | head -1

ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 stage1_bgm_track.wav
ffmpeg -i stage1_bgm_track.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 仅测试一个 SFX (click1)
echo ""
echo "Stage 2: Single SFX (click1) with padding"
ffmpeg -y -i samples/click.wav \
-filter_complex "[0:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=1[click1];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1.5[silence_click1];
[silence_click1][click1]concat=n=2:v=0:a=1[click1_padded]" \
-map '[click1_padded]' -c:a pcm_s16le stage2_click1_padded.wav 2>&1 | grep -E "Output" | head -1

ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 stage2_click1_padded.wav
ffmpeg -i stage2_click1_padded.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 测试混合 BGM + 一个 SFX
echo ""
echo "Stage 3: Mix BGM + single SFX"
ffmpeg -y -i stage1_bgm_track.wav -i stage2_click1_padded.wav \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest[mixed]" \
-map '[mixed]' -c:a pcm_s16le stage3_mixed.wav 2>&1 | grep -E "Output" | head -1

echo "First second of mixed audio (before SFX):"
ffmpeg -i stage3_mixed.wav -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume
echo "At 1.5s (with SFX):"
ffmpeg -i stage3_mixed.wav -ss 1.5 -t 0.3 -af "volumedetect" -f null - 2>&1 | grep mean_volume

