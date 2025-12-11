#!/bin/bash
ffmpeg -y \
-i samples/bee1920.mp4 \
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
-i samples/narration-zh.mp3 \
-filter_complex "color=c=black:s=1920x1080:d=20[base];
color=black@0.0:s=1920x1080:d=5[uenwlkgL_base];
[0:v]trim=start=0:duration=5,setpts=PTS-STARTPTS,scale=1920:1080,format=rgba,colorchannelmixer=aa=1[eHwJRRbt_clip];
[uenwlkgL_base][eHwJRRbt_clip]overlay=0:0:format=auto,rotate=0,fps=30[intro_clip];
color=black@0.0:s=1920x1080:d=6[HMN24abZ_base];
[1:v]trim=start=2:duration=6,setpts=PTS-STARTPTS,scale=1920:1080,format=rgba,colorchannelmixer=aa=1[KG8WVWLX_clip];
[HMN24abZ_base][KG8WVWLX_clip]overlay=0:0:format=auto,rotate=0,fps=30[scene_clip];
color=black@0.0:s=1920x1080:d=4[p3QMGfMG_base];
[2:v]trim=start=1:duration=4,setpts=PTS-STARTPTS,scale=960:540,format=rgba,colorchannelmixer=aa=0.85[oktUbVDR_clip];
[p3QMGfMG_base][oktUbVDR_clip]overlay=480:270:format=auto,rotate=0,fps=30[cutaway_clip];
color=c=black@0.0:s=1920x1080:d=5[gap_igVtoh9A];
[intro_clip]fps=30[fps_intro_clip_9bT033hs];
[scene_clip]fps=30[fps_scene_clip_mclxbjDu];
[fps_intro_clip_9bT033hs][fps_scene_clip_mclxbjDu]xfade=transition=fade:duration=0.6:offset=4.4,fps=30[between_xfade_Qq5SBCtf];
[between_xfade_Qq5SBCtf]fps=30[fps_between_xfade_Qq5SBCtf_7ZpTem4t];
[cutaway_clip]fps=30[fps_cutaway_clip_pKWeVfWo];
[fps_between_xfade_Qq5SBCtf_7ZpTem4t][fps_cutaway_clip_pKWeVfWo]xfade=transition=smoothdown:duration=0.6:offset=9.8,fps=30[between_xfade_Sx3CKAfq];
[between_xfade_Sx3CKAfq][gap_igVtoh9A]concat=n=2:v=1:a=0,fps=30[main_video];
color=black@0.0:s=1920x1080:d=20[YBRrAvsc_base];
[3:v]loop=loop=600:size=600,setpts=PTS-STARTPTS,fps=30,scale=200:100,format=rgba,colorchannelmixer=aa=0.8[3CVSFnl2_clip];
[YBRrAvsc_base][3CVSFnl2_clip]overlay=1650:30:format=auto,rotate=0,fps=30[logo_watermark];
[logo_watermark]setpts=PTS-STARTPTS[watermark_track];
color=c=black@0.0:s=1920x1080:d=2[gap_hEbQGsLC];
color=black@0.0:s=1920x1080:d=3[quB6zQRS_base];
[4:v]fps=12,setpts=PTS-STARTPTS,trim=duration=3,scale=200:200,format=rgba,colorchannelmixer=aa=1[awsQkS13_clip];
[quB6zQRS_base][awsQkS13_clip]overlay=100:100:format=auto,rotate=0,fps=30[emoji_overlay];
color=c=black@0.0:s=1920x1080:d=3[gap_k2H7pjrC];
color=black@0.0:s=1920x1080:d=4[ZMIZNPfp_base];
[5:v]fps=24,setpts=PTS-STARTPTS,trim=duration=4,scale=250:250,format=rgba,colorchannelmixer=aa=0.9[soDKhwci_clip];
[ZMIZNPfp_base][soDKhwci_clip]overlay=1600:850:format=auto,rotate=0,fps=30[loading_overlay];
color=c=black@0.0:s=1920x1080:d=8[gap_7TheaAfJ];
[gap_hEbQGsLC][emoji_overlay]concat=n=2:v=1:a=0,fps=30[between_concat_f1Mvp2SL];
[between_concat_f1Mvp2SL][gap_k2H7pjrC]concat=n=2:v=1:a=0,fps=30[between_concat_o3Wd1j5t];
[between_concat_o3Wd1j5t][loading_overlay]concat=n=2:v=1:a=0,fps=30[between_concat_e2iwHstk];
[between_concat_e2iwHstk][gap_7TheaAfJ]concat=n=2:v=1:a=0,fps=30[sticker_track];
color=c=black@0.0:s=1920x1080:d=0.5[gap_yo5B7OJn];
color=black@0.0:s=1920x1080:d=3[j8oIQ794_base];
[j8oIQ794_base]drawtext=text='Json-to-FFmpeg Demo':font='Arial':fontsize=72:fontcolor=0xFFFFFF:x=960:y=200:box=1:boxcolor=0x00000000:boxborderw=10:borderw=2:bordercolor=0x000000:shadowcolor=0x80000000:shadowx=2:shadowy=2[jDd4EU0Z_text];
[jDd4EU0Z_text]null[title_text];
color=black@0.0:s=1920x1080:d=8[SApoTza9_base];
[SApoTza9_base]drawtext=text='All sample media types in one timeline':font='Arial':fontsize=36:fontcolor=0xFFFF00:x=960:y=900:box=1:boxcolor=0xAA000000:boxborderw=12,format=rgba,colorchannelmixer=aa=0.95[OHCmtJvE_text];
[OHCmtJvE_text]null[subtitle_text];
color=c=black@0.0:s=1920x1080:d=8.5[gap_YyOzZ2lY];
[gap_yo5B7OJn][title_text]concat=n=2:v=1:a=0,fps=30[between_concat_vtSbw8fn];
[between_concat_vtSbw8fn][subtitle_text]concat=n=2:v=1:a=0,fps=30[between_concat_Yhkybbu8];
[between_concat_Yhkybbu8][gap_YyOzZ2lY]concat=n=2:v=1:a=0,fps=30[title_track];
[6:a]atrim=0:20,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2,afade=t=out:st=18:d=2,volume=0.6[bgm_main];
[bgm_main]concat=n=1:v=0:a=1[bgm_track];
[7:a]atrim=0:1,asetpts=PTS-STARTPTS,volume=1[click_sfx];
[8:a]atrim=0:2,asetpts=PTS-STARTPTS,volume=0.8[whoosh_sfx];
[9:a]atrim=0:3,asetpts=PTS-STARTPTS,volume=0.9[notification_sfx];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1.5[silence_click_sfx];
[silence_click_sfx][click_sfx]concat=n=2:v=0:a=1[click_sfx_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5[silence_whoosh_sfx];
[silence_whoosh_sfx][whoosh_sfx]concat=n=2:v=0:a=1[whoosh_sfx_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=10[silence_notification_sfx];
[silence_notification_sfx][notification_sfx]concat=n=2:v=0:a=1[notification_sfx_padded];
[click_sfx_padded][whoosh_sfx_padded][notification_sfx_padded]amix=inputs=3:duration=longest[sfx_track_premix];
[sfx_track_premix]apad=whole_dur=20[sfx_track];
anullsrc=channel_layout=stereo:sample_rate=44100:d=0.8[gap_hW3HNwpa];
[10:a]atrim=0:6,asetpts=PTS-STARTPTS,volume=1[narration_en_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=0.7000000000000002[gap_cU6OkWH4];
[11:a]atrim=0:6,asetpts=PTS-STARTPTS,volume=1[narration_zh_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=6.5[gap_goa4veW0];
[gap_hW3HNwpa][narration_en_clip][gap_cU6OkWH4][narration_zh_clip][gap_goa4veW0]concat=n=5:v=0:a=1[narration_track];
[base][main_video]overlay=0:0[JQuhmplG_combined_track];
[JQuhmplG_combined_track][watermark_track]overlay=0:0[C79W6QNK_combined_track];
[C79W6QNK_combined_track][sticker_track]overlay=0:0[jIcT9B5z_combined_track];
[jIcT9B5z_combined_track][title_track]overlay=0:0[video_output];
[bgm_track][sfx_track][narration_track]amix=inputs=3:duration=longest[audio_output];" \
-i "samples/narration-en.srt" \
-i "samples/narration-zh.srt" \
-map '[video_output]' -map '[audio_output]' -map 12:s -map 13:s -c:v libx264 -c:a aac -b:a 320k -c:s mov_text -metadata:s:s:0 language=eng -metadata:s:s:1 language=chi -r 30 -s 1920x1080 -ss 0 -t 20 -crf 23 -preset veryfast -pix_fmt yuv420p output-all-samples.mp4
