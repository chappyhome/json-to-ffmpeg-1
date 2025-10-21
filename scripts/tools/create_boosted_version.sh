#!/bin/bash
echo "=== Creating volume-boosted version ==="

# 方案：在最终 amix 后添加 volume 滤镜提升整体音量
ffmpeg -y \
-i ./tmp/video_clip.mp4 \
-i samples/ever.mp3 \
-i samples/click.wav \
-i samples/notification.wav \
-i samples/whoosh.wav \
-filter_complex "color=c=black:s=1920x1080:d=10[base];
color=black@0.0:s=1920x1080:d=10[base2];
[0:v]scale=1920:1080,format=rgba,colorchannelmixer=aa=1[video_clip_raw];
[base2][video_clip_raw]overlay=0:0:format=auto,rotate=0,fps=30[video_clip];
[video_clip]setpts=PTS-STARTPTS[video_track];
[1:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st=9:d=1,volume=0.6[bgm_clip];
[bgm_clip]concat=n=1:v=0:a=1[bgm_track];
[2:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=1[click1];
[3:a]atrim=0:0.8,asetpts=PTS-STARTPTS,volume=0.9[notification1];
[4:a]atrim=0:1.2,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.1,afade=t=out:st=1:d=0.2,volume=0.8[whoosh1];
[2:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=1[click2];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1.5[silence_click1];
[silence_click1][click1]concat=n=2:v=0:a=1[click1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=3[silence_notification1];
[silence_notification1][notification1]concat=n=2:v=0:a=1[notification1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5.5[silence_whoosh1];
[silence_whoosh1][whoosh1]concat=n=2:v=0:a=1[whoosh1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[silence_click2];
[silence_click2][click2]concat=n=2:v=0:a=1[click2_padded];
[click1_padded][notification1_padded][whoosh1_padded][click2_padded]amix=inputs=4:duration=longest[sfx_track_premix];
[sfx_track_premix]apad=whole_dur=10[sfx_track];
[base][video_track]overlay=0:0[video_output];
[bgm_track][sfx_track]amix=inputs=2:duration=longest,volume=2.0[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 1920x1080 -ss 0 -t 10 -crf 23 -preset veryfast -pix_fmt yuv420p output-audio-types-BOOSTED.mp4

echo ""
echo "Boosted version stats:"
ffmpeg -i output-audio-types-BOOSTED.mp4 -af "volumedetect" -vn -f null - 2>&1 | grep mean_volume

echo ""
echo "Original version stats (for comparison):"
ffmpeg -i output-audio-types-test.mp4 -af "volumedetect" -vn -f null - 2>&1 | grep mean_volume

echo ""
echo "Created: output-audio-types-BOOSTED.mp4 (volume x2)"

