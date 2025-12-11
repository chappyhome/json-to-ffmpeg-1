#!/bin/bash
ffmpeg -y \
-i https://pub-xxxx.r2.dev/inputs/hotel-lobby-1.mp4 \
-i https://pub-xxxx.r2.dev/inputs/logo-hotel.png \
-i https://pub-xxxx.r2.dev/inputs/bgm-soft-1.mp3 \
-i https://pub-xxxx.r2.dev/inputs/vo-hotel-intro.mp3 \
-filter_complex "color=c=black:s=1080x1920:d=30.22825553299638[base];
color=black@0.0:s=1080x1920:d=5.918913071043789[hMIFwL3N_base];
[0:v]trim=start=1.4052587893271304:duration=5.918913071043789,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[wsWmolso_clip];
[hMIFwL3N_base][wsWmolso_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_0];
color=black@0.0:s=1080x1920:d=3.93682168610394[mZLnKnN5_base];
[0:v]trim=start=5.3682493983697155:duration=3.93682168610394,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[HOk4XgLl_clip];
[mZLnKnN5_base][HOk4XgLl_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_1];
color=black@0.0:s=1080x1920:d=4.037713477388024[olRSCPjB_base];
[0:v]trim=start=2.245462720903807:duration=4.037713477388024,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[p0qwcQaM_clip];
[olRSCPjB_base][p0qwcQaM_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_2];
color=black@0.0:s=1080x1920:d=2.295030167326331[js7WpTR3_base];
[0:v]trim=start=6.288259894401479:duration=2.295030167326331,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[XzpGl5O6_clip];
[js7WpTR3_base][XzpGl5O6_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_3];
color=black@0.0:s=1080x1920:d=5.987305757589638[OZcZsAEn_base];
[0:v]trim=start=3.7230742184022754:duration=5.987305757589638,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[UJXc1LY9_clip];
[OZcZsAEn_base][UJXc1LY9_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_4];
color=black@0.0:s=1080x1920:d=3.8397394940257072[sJqcLsvd_base];
[0:v]trim=start=6.299568676849518:duration=3.8397394940257072,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[FW1mPzxq_clip];
[sJqcLsvd_base][FW1mPzxq_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_5];
color=black@0.0:s=1080x1920:d=4.212731879518948[kEVKmzOL_base];
[0:v]trim=start=6.094523651916859:duration=4.212731879518948,setpts=PTS-STARTPTS,scale=1080:1920,format=rgba,colorchannelmixer=aa=1[XS2YHAMk_clip];
[kEVKmzOL_base][XS2YHAMk_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_6];
[main_0]fps=30[fps_main_0_W4l9nQuY];
[main_1]fps=30[fps_main_1_HIIaUrnb];
[fps_main_0_W4l9nQuY][fps_main_1_HIIaUrnb]xfade=transition=smoothup:duration=0.45252257406245916:offset=5.46639049698133,fps=30[between_xfade_E1aTNomK];
[between_xfade_E1aTNomK][main_2]concat=n=2:v=1:a=0,fps=30[between_concat_hKMjUQhU];
[between_concat_hKMjUQhU][main_3]concat=n=2:v=1:a=0,fps=30[between_concat_E5P0u9Ei];
[between_concat_E5P0u9Ei][main_4]concat=n=2:v=1:a=0,fps=30[between_concat_saZQuUUR];
[between_concat_saZQuUUR][main_5]concat=n=2:v=1:a=0,fps=30[between_concat_X3P4vtzg];
[between_concat_X3P4vtzg][main_6]concat=n=2:v=1:a=0,fps=30[main_video_track];
color=black@0.0:s=1080x1920:d=30[Uz5KSiH6_base];
[1:v]loop=loop=900:size=900,setpts=PTS-STARTPTS,fps=30,scale=157:88,format=rgba,colorchannelmixer=aa=0.8[7a7eQven_clip];
[Uz5KSiH6_base][7a7eQven_clip]overlay=913:10:format=auto,rotate=0,fps=30[watermark_0];
color=c=black@0.0:s=1080x1920:d=0.22825553299637846[gap_4WPyRaLn];
[watermark_0][gap_4WPyRaLn]concat=n=2:v=1:a=0,fps=30[watermark_track];
[2:a]atrim=0:30,asetpts=PTS-STARTPTS,volume=0.3[bgm_0];
[bgm_0]acopy[bgm_0_padded];
[bgm_0_padded]apad=whole_dur=30.22825553299638[bgm_track];
[3:a]atrim=0:18,asetpts=PTS-STARTPTS,volume=1[voiceover_0];
[voiceover_0]acopy[voiceover_0_padded];
[voiceover_0_padded]apad=whole_dur=30.22825553299638[voiceover_track];
[base][main_video_track]overlay=0:0[Ln7sHzlN_combined_track];
[Ln7sHzlN_combined_track][watermark_track]overlay=0:0[video_output];
[bgm_track][voiceover_track]amix=inputs=2:duration=longest[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 256k -r 30 -s 1080x1920 -ss 0 -t 30.22825553299638 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4
