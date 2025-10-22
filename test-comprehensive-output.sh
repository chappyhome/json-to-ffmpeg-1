#!/bin/bash
ffmpeg -y \
-i samples/bee1920.mp4 \
-i samples/ever.mp3 \
-i samples/click.wav \
-i samples/whoosh.wav \
-i samples/narration-zh.mp3 \
-i samples/logo.png \
-ignore_loop 0 -i samples/loading.gif \
-filter_complex "color=c=black:s=1920x1080:d=20[base];
color=black@0.0:s=1920x1080:d=20[MxhIV4ww_base];
[0:v]trim=start=0:duration=20,setpts=PTS-STARTPTS,scale=1920:1080,format=rgba,colorchannelmixer=aa=1[j0UurSPw_clip];
[MxhIV4ww_base][j0UurSPw_clip]overlay=0:0:format=auto,rotate=0,fps=30[main_video_clip];
[main_video_clip]setpts=PTS-STARTPTS[video_track];
color=c=black@0.0:s=1920x1080:d=1[gap_6lvc5MGz];
color=black@0.0:s=1920x1080:d=3[StCkhqj4_base];
[StCkhqj4_base]drawtext=text='综合功能测试':font='Arial':fontsize=72:fontcolor=0xFFFFFF:x=0:y=0:box=1:boxcolor=0x80000000:boxborderw=10[lsfi9RDd_text];
[lsfi9RDd_text]null[title_text_clip];
color=c=black@0.0:s=1920x1080:d=1[gap_wMbbuNOf];
color=black@0.0:s=1920x1080:d=3[kEtTWpOP_base];
[5:v]loop=loop=90:size=90,setpts=PTS-STARTPTS,fps=30,scale=300:300,format=rgba,colorchannelmixer=aa=0.8[GPiyuRXt_clip];
[kEtTWpOP_base][GPiyuRXt_clip]overlay=50:50:format=auto,rotate=0,fps=30[static_image_clip];
color=c=black@0.0:s=1920x1080:d=1[gap_4acZhcWG];
color=black@0.0:s=1920x1080:d=3[rpKU3ePs_base];
[6:v]fps=10,setpts=PTS-STARTPTS,trim=duration=3,scale=300:300,format=rgba,colorchannelmixer=aa=1[LbkIud8C_clip];
[rpKU3ePs_base][LbkIud8C_clip]overlay=1570:50:format=auto,rotate=0,fps=30[animated_gif_clip];
color=c=black@0.0:s=1920x1080:d=8[gap_KeUAAb0F];
[gap_6lvc5MGz][title_text_clip]concat=n=2:v=1:a=0,fps=30[between_concat_oPCYKWNq];
[between_concat_oPCYKWNq][gap_wMbbuNOf]concat=n=2:v=1:a=0,fps=30[between_concat_JViarzwN];
[between_concat_JViarzwN][static_image_clip]concat=n=2:v=1:a=0,fps=30[between_concat_pvTGB3k8];
[between_concat_pvTGB3k8][gap_4acZhcWG]concat=n=2:v=1:a=0,fps=30[between_concat_maoU6CWG];
[between_concat_maoU6CWG][animated_gif_clip]concat=n=2:v=1:a=0,fps=30[between_concat_eIiIX7g1];
[between_concat_eIiIX7g1][gap_KeUAAb0F]concat=n=2:v=1:a=0,fps=30[overlay_track_1];
color=c=black@0.0:s=1920x1080:d=2[gap_sMPoD2KV];
color=black@0.0:s=1920x1080:d=5[oOau9XqU_base];
[oOau9XqU_base]drawtext=text='Audio Types + Animation + Text Rendering':font='Arial':fontsize=36:fontcolor=0xFFD700:x=0:y=0[26ZOeFE0_text];
[26ZOeFE0_text]null[subtitle_text_clip];
color=c=black@0.0:s=1920x1080:d=13[gap_JJlcrElT];
[gap_sMPoD2KV][subtitle_text_clip]concat=n=2:v=1:a=0,fps=30[between_concat_sOlNC9zL];
[between_concat_sOlNC9zL][gap_JJlcrElT]concat=n=2:v=1:a=0,fps=30[overlay_track_2];
[1:a]atrim=0:20,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2,afade=t=out:st=18:d=2,volume=0.3[bgm_clip];
[bgm_clip]concat=n=1:v=0:a=1[bgm_track];
anullsrc=channel_layout=stereo:sample_rate=44100:d=2[gap_oHBBRoZY];
[4:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=9.7:d=0.3,volume=1[narration_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[gap_0xuI7m56];
[gap_oHBBRoZY][narration_clip][gap_0xuI7m56]concat=n=3:v=0:a=1[narration_track];
[2:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=0.8[click_sfx_1];
[3:a]atrim=0:1,asetpts=PTS-STARTPTS,volume=0.7[whoosh_sfx];
[2:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=0.8[click_sfx_2];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1[silence_click_sfx_1];
[silence_click_sfx_1][click_sfx_1]concat=n=2:v=0:a=1[click_sfx_1_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=5[silence_whoosh_sfx];
[silence_whoosh_sfx][whoosh_sfx]concat=n=2:v=0:a=1[whoosh_sfx_padded];
anullsrc=channel_layout=stereo:sample_rate=44100:d=9[silence_click_sfx_2];
[silence_click_sfx_2][click_sfx_2]concat=n=2:v=0:a=1[click_sfx_2_padded];
[click_sfx_1_padded][whoosh_sfx_padded][click_sfx_2_padded]amix=inputs=3:duration=longest[sfx_track_premix];
[sfx_track_premix]apad=whole_dur=20[sfx_track];
[base][video_track]overlay=0:0[7xcSfIX1_combined_track];
[7xcSfIX1_combined_track][overlay_track_1]overlay=0:0[jMNBoHvK_combined_track];
[jMNBoHvK_combined_track][overlay_track_2]overlay=0:0[video_output];
[bgm_track][narration_track][sfx_track]amix=inputs=3:duration=longest[audio_output];" \
-i "https://pub-8771ad71fcfd48d7b296fcba63e1b1f2.r2.dev/narration-zh.srt" \
-map '[video_output]' -map '[audio_output]' -map 7:s -c:v libx264 -c:a aac -b:a 320k -c:s mov_text -metadata:s:s:0 language=chi -r 30 -s 1920x1080 -ss 0 -t 20 -crf 23 -preset veryfast -pix_fmt yuv420p output-comprehensive-test.mp4