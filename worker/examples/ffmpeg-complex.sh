#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 10 -t 2 -r 30 ./tmp/clip1.mp4
ffmpeg -y -i samples/book1920.mp4 -ss 5 -t 1 -r 30 ./tmp/clip2.mp4
ffmpeg -y -i samples/cows1920.mp4 -ss 3 -t 5 -r 30 ./tmp/clip3.mp4
ffmpeg -y -i samples/bee1920.mp4 -ss 27 -t 5 -r 30 ./tmp/clip4.mp4
ffmpeg -y -i samples/book1920.mp4 -ss 0 -t 5 -r 30 ./tmp/clip5.mp4
ffmpeg -y \
-i ./tmp/clip1.mp4 \
-i ./tmp/clip2.mp4 \
-i ./tmp/clip3.mp4 \
-i ./tmp/clip4.mp4 \
-i ./tmp/clip5.mp4 \
-i samples/ever.mp3 \
-i samples/weekend.mp3 \
-i samples/flower.png \
-filter_complex "color=c=black:s=960x540:d=35[base];
color=c=black@0.0:s=960x540:d=3[gap_WtFXoP6v];
color=black@0.0:s=960x540:d=2[fEGV01ko_base];
[0:v]scale=960:540,format=rgba,colorchannelmixer=aa=1[6df2k4wT_clip];
[fEGV01ko_base][6df2k4wT_clip]overlay=0:0:format=auto,rotate=0,fps=30[clip1];
color=black@0.0:s=960x540:d=1[5X1jHOvC_base];
[1:v]scale=960:540,format=rgba,colorchannelmixer=aa=1[cpMX4jc0_clip];
[5X1jHOvC_base][cpMX4jc0_clip]overlay=0:0:format=auto,rotate=0,fps=30[clip2];
color=c=black@0.0:s=960x540:d=4[gap_T6uImoZW];
color=black@0.0:s=960x540:d=5[hxkkcl1c_base];
[2:v]scale=480:270,format=rgba,colorchannelmixer=aa=0.5[2i42KgSa_clip];
[hxkkcl1c_base][2i42KgSa_clip]overlay=240:135:format=auto,rotate=45,fps=30[clip3];
color=black@0.0:s=960x540:d=5[uy9B2IBh_base];
[3:v]scale=960:540,format=rgba,colorchannelmixer=aa=1[K3bxTu76_clip];
[uy9B2IBh_base][K3bxTu76_clip]overlay=0:0:format=auto,rotate=0,fps=30[clip4];
color=black@0.0:s=960x540:d=5[O9KKu8jn_base];
[4:v]scale=200:150,format=rgba,colorchannelmixer=aa=1[nA0Bbqz0_clip];
[O9KKu8jn_base][nA0Bbqz0_clip]overlay=25:25:format=auto,rotate=0,fps=30[clip5];
color=c=black@0.0:s=960x540:d=11[gap_pLixd1mx];
color=c=black@0.0:s=960x540:d=0.5[void_clip1];
[void_clip1]fps=30[fps_void_clip1_eLNYL9gl];
[clip1]fps=30[fps_clip1_bDg0prhC];
[fps_void_clip1_eLNYL9gl][fps_clip1_bDg0prhC]xfade=transition=smoothup:duration=0.43333333333333335:offset=0,fps=30[start_xfade_5ECBpsBx];
color=c=black@0.0:s=960x540:d=0.5[void_start_xfade_5ECBpsBx];
[start_xfade_5ECBpsBx]fps=30[fps_start_xfade_5ECBpsBx_BTCyG0So];
[void_start_xfade_5ECBpsBx]fps=30[fps_void_start_xfade_5ECBpsBx_ctRCiJYA];
[fps_start_xfade_5ECBpsBx_BTCyG0So][fps_void_start_xfade_5ECBpsBx_ctRCiJYA]xfade=transition=smoothdown:duration=0.43333333333333335:offset=1.5,fps=30[end_xfade_YSn23Ev0];
color=c=black@0.0:s=960x540:d=0.5[void_clip2];
[void_clip2]fps=30[fps_void_clip2_yBENbTtZ];
[clip2]fps=30[fps_clip2_bZhitvbL];
[fps_void_clip2_yBENbTtZ][fps_clip2_bZhitvbL]xfade=transition=fade:duration=0.43333333333333335:offset=0,fps=30[start_xfade_GWfIeu8n];
color=c=black@0.0:s=960x540:d=0.5[void_start_xfade_GWfIeu8n];
[start_xfade_GWfIeu8n]fps=30[fps_start_xfade_GWfIeu8n_JU02iAGe];
[void_start_xfade_GWfIeu8n]fps=30[fps_void_start_xfade_GWfIeu8n_FWA2KqTa];
[fps_start_xfade_GWfIeu8n_JU02iAGe][fps_void_start_xfade_GWfIeu8n_FWA2KqTa]xfade=transition=circlecrop:duration=0.43333333333333335:offset=0.5,fps=30[end_xfade_sS9lpjb2];
color=c=black@0.0:s=960x540:d=0.5[void_clip3];
[clip3]fps=30[fps_clip3_LxPuYTrR];
[void_clip3]fps=30[fps_void_clip3_hpA70yZU];
[fps_clip3_LxPuYTrR][fps_void_clip3_hpA70yZU]xfade=transition=squeezev:duration=0.43333333333333335:offset=4.5,fps=30[end_xfade_cQii7gmr];
[gap_WtFXoP6v][end_xfade_YSn23Ev0]concat=n=2:v=1:a=0,fps=30[between_concat_W2sTnGSv];
[between_concat_W2sTnGSv][end_xfade_sS9lpjb2]concat=n=2:v=1:a=0,fps=30[between_concat_WKQJhKA6];
[between_concat_WKQJhKA6][gap_T6uImoZW]concat=n=2:v=1:a=0,fps=30[between_concat_R24xLRbg];
[between_concat_R24xLRbg][end_xfade_cQii7gmr]concat=n=2:v=1:a=0,fps=30[between_concat_GP0mHds4];
[between_concat_GP0mHds4][clip4]concat=n=2:v=1:a=0,fps=30[between_concat_EmHG3TuL];
[between_concat_EmHG3TuL]fps=30[fps_between_concat_EmHG3TuL_CFZrQhCi];
[clip5]fps=30[fps_clip5_wS0DXvrp];
[fps_between_concat_EmHG3TuL_CFZrQhCi][fps_clip5_wS0DXvrp]xfade=transition=fade:duration=1:offset=19,fps=30[between_xfade_8bKMoXV5];
[between_xfade_8bKMoXV5][gap_pLixd1mx]concat=n=2:v=1:a=0,fps=30[track_with_some_videos];
color=black@0.0:s=960x540:d=30[Ny64LpBf_base];
[7:v]loop=loop=900:size=900,setpts=PTS-STARTPTS,fps=30,scale=150:75,format=rgba,colorchannelmixer=aa=1[wBYc0Mxi_clip];
[Ny64LpBf_base][wBYc0Mxi_clip]overlay=805:5:format=auto,rotate=0,fps=30[watermark_clip];
color=c=black@0.0:s=960x540:d=5[gap_aCz4CZq5];
color=c=black@0.0:s=960x540:d=0.5[void_watermark_clip];
[watermark_clip]fps=30[fps_watermark_clip_y60zTk0b];
[void_watermark_clip]fps=30[fps_void_watermark_clip_oXd1Pb5T];
[fps_watermark_clip_y60zTk0b][fps_void_watermark_clip_oXd1Pb5T]xfade=transition=squeezeh:duration=0.43333333333333335:offset=29.5,fps=30[end_xfade_mtiTNWNC];
[end_xfade_mtiTNWNC][gap_aCz4CZq5]concat=n=2:v=1:a=0,fps=30[track_with_watermark];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5[gap_9bJQDl6i];
[5:a]atrim=0:10,asetpts=PTS-STARTPTS,volume=1[audio_clip1];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5[gap_XaFmSeFb];
[6:a]atrim=0:15,asetpts=PTS-STARTPTS,volume=1[audio_clip2];
[gap_9bJQDl6i][audio_clip1][gap_XaFmSeFb][audio_clip2]concat=n=4:v=0:a=1[track2];
[base][track_with_some_videos]overlay=0:0[ApckQkaP_combined_track];
[ApckQkaP_combined_track][track_with_watermark]overlay=0:0[video_output];
[track2]volume=1[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 960x540 -ss 0 -t 38 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4
