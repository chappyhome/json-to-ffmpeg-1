#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 5 -t 10 -r 30 ./tmp/background_clip.mp4
ffmpeg -y \
-i ./tmp/background_clip.mp4 \
-i samples/flower.png \
-ignore_loop 0 -i samples/emoji.gif \
-ignore_loop 1 -i samples/loading.gif \
-filter_complex "color=c=black:s=1920x1080:d=10[base];
color=black@0.0:s=1920x1080:d=10[6zmjvccV_base];
[0:v]scale=1920:1080,format=rgba,colorchannelmixer=aa=1[WnLKGCwa_clip];
[6zmjvccV_base][WnLKGCwa_clip]overlay=0:0:format=auto,rotate=0,fps=30[background_clip];
[background_clip]setpts=PTS-STARTPTS[video_track];
color=black@0.0:s=1920x1080:d=10[i7bI5dXh_base];
[1:v]loop=loop=300:size=300,setpts=PTS-STARTPTS,fps=30,scale=280:140,format=rgba,colorchannelmixer=aa=0.8[IFSnpTI5_clip];
[i7bI5dXh_base][IFSnpTI5_clip]overlay=1620:10:format=auto,rotate=0,fps=30[watermark_clip];
[watermark_clip]setpts=PTS-STARTPTS[static_image_track];
color=c=black@0.0:s=1920x1080:d=2[gap_Pxcd7OzH];
color=black@0.0:s=1920x1080:d=5[rTWiwYR1_base];
[2:v]fps=24,loop=2:60,setpts=PTS-STARTPTS,trim=duration=5,scale=200:200,format=rgba,colorchannelmixer=aa=1[SCvuOMgN_clip];
[rTWiwYR1_base][SCvuOMgN_clip]overlay=50:50:format=auto,rotate=0,fps=30[emoji_clip];
color=c=black@0.0:s=1920x1080:d=3[gap_Y1b7GB7J];
[gap_Pxcd7OzH][emoji_clip]concat=n=2:v=1:a=0,fps=30[between_concat_oLYhUuv8];
[between_concat_oLYhUuv8][gap_Y1b7GB7J]concat=n=2:v=1:a=0,fps=30[animated_gif_track];
color=c=black@0.0:s=1920x1080:d=8[gap_2qNneOjC];
color=black@0.0:s=1920x1080:d=2[Uo31xGco_base];
[3:v]fps=30,setpts=PTS-STARTPTS,trim=duration=2,scale=200:100,format=rgba,colorchannelmixer=aa=1[8nB7Nd3S_clip];
[Uo31xGco_base][8nB7Nd3S_clip]overlay=860:490:format=auto,rotate=0,fps=30[loading_clip];
[gap_2qNneOjC][loading_clip]concat=n=2:v=1:a=0,fps=30[one_time_gif_track];
[base][video_track]overlay=0:0[pyEQGkRx_combined_track];
[pyEQGkRx_combined_track][static_image_track]overlay=0:0[icoBul4k_combined_track];
[icoBul4k_combined_track][animated_gif_track]overlay=0:0[el0DzYsH_combined_track];
[el0DzYsH_combined_track][one_time_gif_track]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=10[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 1920x1080 -ss 0 -t 10 -crf 23 -preset veryfast -pix_fmt yuv420p output-gif-test.mp4