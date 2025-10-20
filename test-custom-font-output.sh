#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 0 -t 6 -r 30 ./tmp/background_clip.mp4
ffmpeg -y \
-i ./tmp/background_clip.mp4 \
-filter_complex "color=c=black:s=384x216:d=6[base];
color=black@0.0:s=384x216:d=6[oQPx6C40_base];
[0:v]scale=384:216,format=rgba,colorchannelmixer=aa=1[Vv7Jt1mu_clip];
[oQPx6C40_base][Vv7Jt1mu_clip]overlay=0:0:format=auto,rotate=0,fps=30[background_clip];
[background_clip]setpts=PTS-STARTPTS[video_track];
color=c=black@0.0:s=384x216:d=0.5[gap_uXOoSnIi];
color=black@0.0:s=384x216:d=2.5[bVVgjzhn_base];
[bVVgjzhn_base]drawtext=text='使用系统字体':font='Arial':fontsize=60:fontcolor=0xFFFFFF:x=132:y=40[jLkgl4AJ_text];
[jLkgl4AJ_text]null[system_font_text];
color=c=black@0.0:s=384x216:d=3[gap_jTmxwvgg];
[gap_uXOoSnIi][system_font_text]concat=n=2:v=1:a=0,fps=30[between_concat_EKSfgvyR];
[between_concat_EKSfgvyR][gap_jTmxwvgg]concat=n=2:v=1:a=0,fps=30[text_track_1];
color=c=black@0.0:s=384x216:d=3.5[gap_biSOdeTH];
color=black@0.0:s=384x216:d=2.5[qTar1sVa_base];
[qTar1sVa_base]drawtext=text='使用自定义字体文件':fontfile=/hhhh/Supplemental/Arial777.ttf:fontsize=48:fontcolor=0x00FF00:x=72:y=160:box=1:boxcolor=0x80000000:boxborderw=10,format=rgba,colorchannelmixer=aa=0.9[yQNIoXIG_text];
[yQNIoXIG_text]null[custom_font_text];
[gap_biSOdeTH][custom_font_text]concat=n=2:v=1:a=0,fps=30[text_track_2];
[base][video_track]overlay=0:0[Sbb9YrXk_combined_track];
[Sbb9YrXk_combined_track][text_track_1]overlay=0:0[1PCJ6zRB_combined_track];
[1PCJ6zRB_combined_track][text_track_2]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=6[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 384x216 -ss 0 -t 6 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4