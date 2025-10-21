#!/bin/bash
ffmpeg -y -i samples/ever.mp3 \
-filter_complex "[0:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st=9:d=1,volume=0.6[bgm_out]" \
-map '[bgm_out]' -c:a aac -b:a 320k test_bgm_only.aac
