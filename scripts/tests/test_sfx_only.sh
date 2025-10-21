#!/bin/bash
# 重新生成只有 SFX 的音频（用于验证）
node -e "
const { parseSchema } = require('./dist/index.js');
const fs = require('fs');

const timeline = JSON.parse(fs.readFileSync('./worker/test/fixtures/audio-types-timeline.json', 'utf8'));

// 删除 BGM track
delete timeline.tracks.bgm_track;

const command = parseSchema(timeline);
fs.writeFileSync('test-sfx-only-output.sh', command);
console.log('Generated SFX-only command');
"
chmod +x test-sfx-only-output.sh
./test-sfx-only-output.sh 2>&1 | grep -E "(Output|error)" | head -5 || echo "SFX-only video generated"

# 分析 SFX-only 音频
echo ""
echo "=== SFX-only Audio Analysis ==="
ffmpeg -i output-audio-types-test.mp4 -af "volumedetect" -vn -f null - 2>&1 | grep -E "(mean_volume|max_volume)"
