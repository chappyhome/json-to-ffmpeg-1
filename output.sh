#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 27 -t 5 -r 30 ./tmp/clip4.mp4
ffmpeg -y -i samples/book1920.mp4 -ss 0 -t 5 -r 30 ./tmp/clip5.mp4
ffmpeg -y \
-i ./tmp/clip4.mp4 \
-i ./tmp/clip5.mp4 \
-filter_complex "color=c=black:s=384x216:d=8[base];
color=black@0.0:s=384x216:d=5[ZRHORSUE_base];
[0:v]scale=384:216,format=rgba,colorchannelmixer=aa=1[lSxW17Sl_clip];
[ZRHORSUE_base][lSxW17Sl_clip]overlay=0:0:format=auto,rotate=0,fps=30[clip4];
color=black@0.0:s=384x216:d=5[YGPq6fRD_base];
[1:v]scale=80:60,format=rgba,colorchannelmixer=aa=1[80lztTQl_clip];
[YGPq6fRD_base][80lztTQl_clip]overlay=10:10:format=auto,rotate=0,fps=30[clip5];
[clip4]fps=30[fps_clip4_BeGY0ov3];
[clip5]fps=30[fps_clip5_IrOkPy70];
[fps_clip4_BeGY0ov3][fps_clip5_IrOkPy70]xfade=transition=fade:duration=2:offset=3,fps=30[track_with_some_videos];
[base][track_with_some_videos]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 384x216 -ss 0 -t 8 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4
