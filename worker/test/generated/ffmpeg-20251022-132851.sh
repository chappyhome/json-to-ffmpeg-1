#!/bin/bash
ffmpeg -y \
-i samples/bee1920.mp4 \
-i samples/book1920.mp4 \
-filter_complex "color=c=black:s=384x216:d=8[base];
color=black@0.0:s=384x216:d=5[Q4yngqAh_base];
[0:v]trim=start=27:duration=5,setpts=PTS-STARTPTS,scale=384:216,format=rgba,colorchannelmixer=aa=1[YGjl5hAF_clip];
[Q4yngqAh_base][YGjl5hAF_clip]overlay=0:0:format=auto,rotate=0,fps=30[clip4];
color=black@0.0:s=384x216:d=5[yjjDjGFD_base];
[1:v]trim=start=0:duration=5,setpts=PTS-STARTPTS,scale=80:60,format=rgba,colorchannelmixer=aa=1[1CDpFKvX_clip];
[yjjDjGFD_base][1CDpFKvX_clip]overlay=10:10:format=auto,rotate=0,fps=30[clip5];
[clip4]fps=30[fps_clip4_kn3nwH2E];
[clip5]fps=30[fps_clip5_UZHqsvkl];
[fps_clip4_kn3nwH2E][fps_clip5_UZHqsvkl]xfade=transition=fade:duration=2:offset=3,fps=30[track_with_some_videos];
[base][track_with_some_videos]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 384x216 -ss 0 -t 8 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4
