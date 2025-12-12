#!/bin/bash
ffmpeg -y \
-i samples/cows1920.mp4 \
-i samples/robin1920.mp4 \
-i samples/flower.png \
-ignore_loop 0 -i samples/emoji.gif \
-ignore_loop 0 -i samples/loading.gif \
-i samples/ever.mp3 \
-i samples/click.wav \
-i samples/whoosh.wav \
-i samples/notification.wav \
-i samples/narration-en.mp3 \
-filter_complex "color=c=black:s=1920x1080:d=25[base];
color=black@0.0:s=1920x1080:d=15[cc5gMbHP_base];
[0:v]trim=start=0:duration=15,setpts=PTS-STARTPTS,scale=1920:1080,format=rgba,colorchannelmixer=aa=1[quHmEQ3x_clip];
[cc5gMbHP_base][quHmEQ3x_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_video_2_clip];
color=black@0.0:s=1920x1080:d=10[ddmLs4PI_base];
[1:v]trim=start=0:duration=10,setpts=PTS-STARTPTS,scale=1920:1080,format=rgba,colorchannelmixer=aa=1[ixzxiNfG_clip];
[ddmLs4PI_base][ixzxiNfG_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_video_3_clip];
[main_video_2_clip][main_video_3_clip]concat=n=2:v=1:a=0,fps=30[video_track];
color=black@0.0:s=1920x1080:d=25[edkelafF_base];
[2:v]loop=loop=750:size=750,setpts=PTS-STARTPTS,fps=30,scale=346:194,format=rgba,colorchannelmixer=aa=0.9[JELDfb8I_clip];
[edkelafF_base][JELDfb8I_clip]overlay=1544:30:format=auto,rotate=0,fps=30[watermark_1_clip];
[watermark_1_clip]setpts=PTS-STARTPTS[watermark_track];
color=black@0.0:s=1920x1080:d=25[9KWJSupQ_base];
[3:v]fps=12,setpts=PTS-STARTPTS,trim=duration=25,scale=346:194,format=rgba,colorchannelmixer=aa=0.9[rciESqP7_clip];
[9KWJSupQ_base][rciESqP7_clip]overlay=30:856:format=auto,rotate=0,fps=30[sticker_1_clip];
color=black@0.0:s=1920x1080:d=23.5[Q7Noqo8S_base];
[4:v]fps=24,setpts=PTS-STARTPTS,trim=duration=23.5,scale=346:194,format=rgba,colorchannelmixer=aa=0.9[Xwt0leYt_clip];
[Q7Noqo8S_base][Xwt0leYt_clip]overlay=30:856:format=auto,rotate=0,fps=30[sticker_2_clip];
[sticker_1_clip][sticker_2_clip]concat=n=2:v=1:a=0,fps=30[sticker_track];
color=black@0.0:s=1920x1080:d=25[sp7ZByx8_base];
[sp7ZByx8_base]drawtext=text='Json-to-FFmpeg Demo':font='Arial':fontsize=72:fontcolor=0xFFFFFF:x=192:y=86:box=1:boxcolor=0x00000000:boxborderw=10:borderw=2:bordercolor=0x000000:shadowcolor=0x80000000:shadowx=2:shadowy=2[VeehTfIv_text];
[VeehTfIv_text]null[title_1_clip];
[title_1_clip]setpts=PTS-STARTPTS[title_track];
color=black@0.0:s=1920x1080:d=25[AgHp4kGa_base];
[AgHp4kGa_base]drawtext=text='All sample media types in one timeline':font='Arial':fontsize=36:fontcolor=0xFFFF00:x=192:y=864:box=1:boxcolor=0xAA000000:boxborderw=12[f14EH0iQ_text];
[f14EH0iQ_text]null[subtitle_1_clip];
[subtitle_1_clip]setpts=PTS-STARTPTS[subtitle_track];
[5:a]atrim=0:25,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2,afade=t=out:st=23:d=2,volume=0.3[bgm_1_clip];
[bgm_1_clip]concat=n=1:v=0:a=1[bgm_track];
[6:a]atrim=0:1,asetpts=PTS-STARTPTS,volume=1[sfx_1_clip];
[7:a]atrim=0:2,asetpts=PTS-STARTPTS,volume=1[sfx_2_clip];
[8:a]atrim=0:3,asetpts=PTS-STARTPTS,volume=1[sfx_3_clip];
[sfx_1_clip]acopy[sfx_1_clip_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1[silence_sfx_2_clip];
[silence_sfx_2_clip][sfx_2_clip]concat=n=2:v=0:a=1[sfx_2_clip_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=2[silence_sfx_3_clip];
[silence_sfx_3_clip][sfx_3_clip]concat=n=2:v=0:a=1[sfx_3_clip_padded];
[sfx_1_clip_padded][sfx_2_clip_padded][sfx_3_clip_padded]amix=inputs=3:duration=longest[sfx_track_premix];
[sfx_track_premix]apad=whole_dur=25[sfx_track];
[9:a]atrim=0:12,asetpts=PTS-STARTPTS,volume=1[voiceover_en_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=13[gap_E5auPoFG];
[voiceover_en_clip][gap_E5auPoFG]concat=n=2:v=0:a=1[narration_track];
[base][video_track]overlay=0:0[czEHogjA_combined_track];
[czEHogjA_combined_track][watermark_track]overlay=0:0[AFcwVM69_combined_track];
[AFcwVM69_combined_track][sticker_track]overlay=0:0[O5ZBL4QD_combined_track];
[O5ZBL4QD_combined_track][title_track]overlay=0:0[O9CIGDOv_combined_track];
[O9CIGDOv_combined_track][subtitle_track]overlay=0:0[video_output];
[bgm_track][sfx_track][narration_track]amix=inputs=3:duration=longest[audio_output];" \
-i "samples/narration-en.srt" \
-map '[video_output]' -map '[audio_output]' -map 10:s -c:v libx264 -c:a aac -b:a 320k -c:s mov_text -metadata:s:s:0 language=eng -disposition:s:0 default -r 30 -s 1920x1080 -ss 0 -t 25 -crf 23 -preset veryfast -pix_fmt yuv420p output-variant-3.mp4
