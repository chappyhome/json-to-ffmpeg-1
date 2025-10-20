#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 0 -t 8 -r 30 ./tmp/background_clip.mp4
ffmpeg -y \
-i ./tmp/background_clip.mp4 \
-filter_complex "color=c=black:s=384x216:d=8[base];
color=black@0.0:s=384x216:d=8[Gs3SctUA_base];
[0:v]scale=384:216,format=rgba,colorchannelmixer=aa=1[my7AdrBR_clip];
[Gs3SctUA_base][my7AdrBR_clip]overlay=0:0:format=auto,rotate=0,fps=30[background_clip];
[background_clip]setpts=PTS-STARTPTS[video_track];
color=c=black@0.0:s=384x216:d=0.5[gap_MftbBoJB];
color=black@0.0:s=384x216:d=3[uIX4Fklm_base];
[uIX4Fklm_base]drawtext=text='Hello World!':font='Arial':fontsize=72:fontcolor=0xFFFFFF:x=132:y=40:box=1:boxcolor=0x80000000:boxborderw=10:borderw=2:bordercolor=0x000000:shadowcolor=0x80000000:shadowx=2:shadowy=2[WnzTGOiH_text];
[WnzTGOiH_text]null[title_text];
color=c=black@0.0:s=384x216:d=4.5[gap_6FjILiiZ];
[gap_MftbBoJB][title_text]concat=n=2:v=1:a=0,fps=30[between_concat_QVCrXDtf];
[between_concat_QVCrXDtf][gap_6FjILiiZ]concat=n=2:v=1:a=0,fps=30[text_track_1];
color=c=black@0.0:s=384x216:d=4[gap_3xgv9buX];
color=black@0.0:s=384x216:d=3.5[1EjNpcJH_base];
[1EjNpcJH_base]drawtext=text='Welcome to FFmpeg Text Rendering':font='Arial':fontsize=48:fontcolor=0xFFFF00:x=72:y=180,format=rgba,colorchannelmixer=aa=0.9[qkW3zJF3_text];
[qkW3zJF3_text]null[subtitle_text];
color=c=black@0.0:s=384x216:d=0.5[gap_oBxQ4HcD];
[gap_3xgv9buX][subtitle_text]concat=n=2:v=1:a=0,fps=30[between_concat_jefpXBC5];
[between_concat_jefpXBC5][gap_oBxQ4HcD]concat=n=2:v=1:a=0,fps=30[text_track_2];
[base][video_track]overlay=0:0[UVhN8pV1_combined_track];
[UVhN8pV1_combined_track][text_track_1]overlay=0:0[chFhvw2t_combined_track];
[chFhvw2t_combined_track][text_track_2]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 384x216 -ss 0 -t 8 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4