#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 0 -t 12 -r 30 ./tmp/video_clip.mp4
ffmpeg -y \
-i ./tmp/video_clip.mp4 \
-i samples/narration-zh.mp3 \
-i samples/ever.mp3 \
-filter_complex "color=c=black:s=1920x1080:d=12[base];
color=black@0.0:s=1920x1080:d=12[zdoJawuV_base];
[0:v]scale=1920:1080,format=rgba,colorchannelmixer=aa=1[38eKwiaL_clip];
[zdoJawuV_base][38eKwiaL_clip]overlay=0:0:format=auto,rotate=0,fps=30[video_clip];
[video_clip]setpts=PTS-STARTPTS[video_track];
[1:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=9.7:d=0.3,volume=1[narration_zh_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=2[gap_Y7OXsI90];
[narration_zh_clip][gap_Y7OXsI90]concat=n=2:v=0:a=1[narration_track];
[2:a]atrim=0:12,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,afade=t=out:st=11:d=1,volume=0.3[bgm_clip];
[bgm_clip]concat=n=1:v=0:a=1[bgm_track];
[base][video_track]overlay=0:0[video_output];
[narration_track][bgm_track]amix=inputs=2:duration=longest[audio_output];" \
-i "https://pub-8771ad71fcfd48d7b296fcba63e1b1f2.r2.dev/narration-zh.srt" \
-map '[video_output]' -map '[audio_output]' -map 3:s -c:v libx264 -c:a aac -b:a 320k -c:s mov_text -metadata:s:s:0 language=chi -r 30 -s 1920x1080 -ss 0 -t 12 -crf 23 -preset veryfast -pix_fmt yuv420p output-narration-zh.mp4