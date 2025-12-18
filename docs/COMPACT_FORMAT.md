# 紧凑格式 API - parseSchemaCompact()

## 概述

`parseSchemaCompact()` 是专门为容器执行优化的命令格式生成器，输出格式更紧凑、更易读。

## 与其他 API 的对比

| API | 返回类型 | 适用场景 | URL 引号 | map 引号 | 参数分组 |
|-----|---------|---------|---------|---------|---------|
| `parseSchemaCompact()` | 字符串 | 容器执行 | ✅ 有 | ❌ 无 | ✅ 分组 |
| `parseSchema()` | 字符串 | Shell 脚本 | ❌ 无 | ✅ 有 | ❌ 单行 |
| `buildTokens()` | 数组 | 程序调用 | N/A | N/A | N/A |

## 输出格式示例

```bash
ffmpeg -y \
-i "https://pub-xxx.r2.dev/output.mp4" \
-filter_complex "..." \
-map "[video_output]" -map "[audio_output]" \
-c:v libx264 -crf 23 -preset veryfast -r 30 -s 1920x1080 \
-c:a aac -b:a 320k \
-ss 0 -t 10 -pix_fmt yuv420p \
/outputs/output.mp4
```

## 特点

### 1. URL 自动加引号
```bash
# 本地文件
-i samples/video.mp4

# URL 自动加引号
-i "https://cdn.example.com/video.mp4"
```

### 2. -map 参数带引号（避免 shell 展开）
```bash
# 带引号避免 shell 将 [] 当作通配符
-map "[video_output]" -map "[audio_output]"
```

### 3. 参数分组换行
```bash
# 视频参数一组
-c:v libx264 -crf 23 -preset veryfast -r 30 -s 1920x1080 \

# 音频参数一组
-c:a aac -b:a 320k \

# 时间和像素格式一组
-ss 0 -t 10 -pix_fmt yuv420p \
```

### 4. 支持绝对路径
```bash
# 相对路径
output.mp4

# 绝对路径
/outputs/output.mp4
```

## 使用方法

### 基本用法

```javascript
import { parseSchemaCompact } from 'json-to-ffmpeg';

const schema = {
  version: 1,
  inputs: {
    video: {
      type: 'video',
      file: 'https://cdn.example.com/input.mp4',
      hasAudio: true,
      hasVideo: true,
      duration: 10
    }
  },
  tracks: { /* ... */ },
  transitions: [],
  output: {
    file: '/outputs/result.mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    width: 1920,
    height: 1080,
    framerate: 30,
    crf: 23,
    preset: 'veryfast',
    audioBitrate: '320k',
    startPosition: 0,
    endPosition: 10,
    scaleRatio: 1,
    flags: ['-pix_fmt', 'yuv420p']
  }
};

const command = parseSchemaCompact(schema);
console.log(command);
```

### 在容器中执行

```javascript
const { spawn } = require('child_process');
const { parseSchemaCompact } = require('json-to-ffmpeg');
const fs = require('fs');

const command = parseSchemaCompact(schema);

// 保存为脚本
fs.writeFileSync('/tmp/render.sh', command);
fs.chmodSync('/tmp/render.sh', '755');

// 在容器中执行
const docker = spawn('docker', [
  'run', '--rm',
  '-v', '/tmp:/tmp',
  '-v', `${process.cwd()}/outputs:/outputs`,
  'jrottenberg/ffmpeg:latest',
  'bash', '/tmp/render.sh'
]);

docker.stderr.on('data', (data) => {
  console.log(data.toString());
});

docker.on('close', (code) => {
  console.log('完成，退出代码:', code);
});
```

### 与 distributeTimelines 配合使用

```javascript
const { distributeTimelines, parseSchemaCompact } = require('json-to-ffmpeg');

const manifest = { /* 你的 manifest */ };
const result = distributeTimelines(manifest);

if (result.ok) {
  result.outputs.forEach((item, idx) => {
    const command = parseSchemaCompact(item.timeline);
    console.log(`\n=== Variant ${idx}: ${item.variantKey} ===`);
    console.log(command);
  });
}
```

## 测试

运行测试脚本查看输出格式：

```bash
node scripts/test-compact-format.js
```

## 注意事项

1. **URL 必须可访问** - 如果使用 URL 输入，确保容器有网络访问权限
2. **路径映射** - 输出路径需要在容器中可写
3. **字幕支持** - 支持软字幕 URL
4. **参数顺序** - 参数顺序已优化，符合 FFmpeg 最佳实践

## 完整示例

```javascript
const { parseSchemaCompact } = require('json-to-ffmpeg');
const { spawn } = require('child_process');
const fs = require('fs');

async function renderVideo(schema) {
  const command = parseSchemaCompact(schema);
  
  const scriptPath = '/tmp/ffmpeg-render.sh';
  fs.writeFileSync(scriptPath, `#!/bin/bash\n${command}`);
  fs.chmodSync(scriptPath, '755');
  
  return new Promise((resolve, reject) => {
    const docker = spawn('docker', [
      'run', '--rm',
      '-v', '/tmp:/tmp',
      '-v', `${process.cwd()}/outputs:/outputs`,
      '--network', 'host',
      'jrottenberg/ffmpeg:latest',
      'bash', scriptPath
    ]);
    
    let stderr = '';
    
    docker.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    docker.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: schema.output.file });
      } else {
        reject(new Error(`FFmpeg 失败: ${code}\n${stderr}`));
      }
    });
  });
}

// 使用
renderVideo(schema)
  .then(result => console.log('成功:', result))
  .catch(err => console.error('失败:', err));
```
