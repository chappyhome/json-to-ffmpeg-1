#!/bin/bash
echo "=== Testing Final amix Issue ==="

# 使用之前生成的独立轨道测试
# stage1_bgm_track.wav: 10s, -21.0 dB
# stage2_click1_padded.wav: 1.8s

# 创建完整的 SFX track（4个音效混合后填充）
echo "Creating complete SFX track..."
ffmpeg -y -i samples/click.wav -i samples/notification.wav -i samples/whoosh.wav \
-filter_complex "
[0:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=1[click1];
[1:a]atrim=0:0.8,asetpts=PTS-STARTPTS,volume=0.9[notification1];
[2:a]atrim=0:1.2,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.1,afade=t=out:st=1:d=0.2,volume=0.8[whoosh1];
[0:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=1[click2];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1.5[silence_click1];
[silence_click1][click1]concat=n=2:v=0:a=1[click1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=3[silence_notification1];
[silence_notification1][notification1]concat=n=2:v=0:a=1[notification1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5.5[silence_whoosh1];
[silence_whoosh1][whoosh1]concat=n=2:v=0:a=1[whoosh1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[silence_click2];
[silence_click2][click2]concat=n=2:v=0:a=1[click2_padded];
[click1_padded][notification1_padded][whoosh1_padded][click2_padded]amix=inputs=4:duration=longest[sfx_track_premix];
[sfx_track_premix]apad=whole_dur=10[sfx_track]
" -map '[sfx_track]' -c:a pcm_s16le complete_sfx_track.wav 2>&1 | grep -E "Output" | head -1

echo ""
echo "SFX track stats:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 complete_sfx_track.wav
ffmpeg -i complete_sfx_track.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

echo ""
echo "Testing different amix approaches:"

# 方法 1: 默认 amix
echo ""
echo "Method 1: Default amix"
ffmpeg -y -i stage1_bgm_track.wav -i complete_sfx_track.wav \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest[out]" \
-map '[out]' -c:a pcm_s16le test_amix_default.wav 2>&1 | grep -E "Output" | head -1
echo "  First second (should be BGM only):"
ffmpeg -i test_amix_default.wav -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 方法 2: 使用 weights 保持原音量
echo ""
echo "Method 2: amix with weights='1 1'"
ffmpeg -y -i stage1_bgm_track.wav -i complete_sfx_track.wav \
-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest:weights='1 1'[out]" \
-map '[out]' -c:a pcm_s16le test_amix_weighted.wav 2>&1 | grep -E "Output" | head -1
echo "  First second (should be BGM only):"
ffmpeg -i test_amix_weighted.wav -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume

# 方法 3: 先归一化 SFX track 再混合
echo ""
echo "Method 3: Normalize SFX track before mixing"
ffmpeg -y -i stage1_bgm_track.wav -i complete_sfx_track.wav \
-filter_complex "[1:a]volume=1.0[sfx_normalized];[0:a][sfx_normalized]amix=inputs=2:duration=longest:weights='1 1'[out]" \
-map '[out]' -c:a pcm_s16le test_amix_normalized.wav 2>&1 | grep -E "Output" | head -1
echo "  First second (should be BGM only):"
ffmpeg -i test_amix_normalized.wav -ss 0 -t 1 -af "volumedetect" -f null - 2>&1 | grep mean_volume

