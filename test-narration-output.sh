#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 0 -t 12 -r 30 ./tmp/video_clip.mp4
ffmpeg -y \
-i ./tmp/video_clip.mp4 \
-i samples/ever.mp3 \
-i samples/narration.mp3 \
-i samples/click.wav \
-filter_complex "color=c=black:s=1920x1080:d=12[base];
color=black@0.0:s=1920x1080:d=12[br8DnnQw_base];
[0:v]scale=1920:1080,format=rgba,colorchannelmixer=aa=1[knBHZUn0_clip];
[br8DnnQw_base][knBHZUn0_clip]overlay=0:0:format=auto,rotate=0,fps=30[video_clip];
[video_clip]setpts=PTS-STARTPTS[video_track];
[1:a]atrim=0:12,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,afade=t=out:st=11:d=1,volume=0.4[bgm_clip];
[bgm_clip]concat=n=1:v=0:a=1[bgm_track];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1[gap_FxhwmgX1];
[2:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=9.7:d=0.3,volume=1[narration_clip];
anullsrc=channel_layout=stereo:sample_rate=44100:d=1[gap_0hFcMCOT];
[gap_FxhwmgX1][narration_clip][gap_0hFcMCOT]concat=n=3:v=0:a=1[narration_track];
[3:a]atrim=0:0.3,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.05,volume=0.8[click1];
anullsrc=channel_layout=stereo:sample_rate=44100:d=2.5[silence_click1];
[silence_click1][click1]concat=n=2:v=0:a=1[click1_padded];
[click1_padded]apad=whole_dur=12[sfx_track];
[base][video_track]overlay=0:0[video_output];
[video_output]subtitles=filename='worker/test/fixtures/narration.srt':force_style='FontName=Arial,FontSize=28,PrimaryColour=&HFFFFFFFF,BackColour=&H99000000,Alignment=2,MarginV=30'[video_with_subtitles];
[bgm_track][narration_track][sfx_track]amix=inputs=3:duration=longest[audio_output];" \
-map '[video_with_subtitles]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 1920x1080 -ss 0 -t 12 -crf 23 -preset veryfast -pix_fmt yuv420p output-narration-test.mp4