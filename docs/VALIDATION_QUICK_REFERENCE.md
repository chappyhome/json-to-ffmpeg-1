# Timeline JSON 验证快速参考

## 快速检查清单 ✅

当你有一个 Timeline JSON 时，按顺序检查：

### 1️⃣ 顶层结构
```json
{
  "version": 1,           // ✅ 必须等于 1
  "inputs": {...},        // ✅ 必填
  "tracks": {...},        // ✅ 必填
  "output": {...},        // ✅ 必填
  "transitions": [...]    // ⚠️ 可选
}
```

### 2️⃣ Inputs（资源池）
```json
"inputs": {
  "资源ID": {
    "type": "video|audio|image|text",  // ✅ 必填
    "file": "路径或URL",                // ✅ 必填
    "hasAudio": true/false,            // ✅ 必填，必须与 type 对应
    "hasVideo": true/false,            // ✅ 必填，必须与 type 对应
    "duration": 10,                    // ✅ 必填，≥ 0
    "metadata": {...}                  // ⚠️ 可选，根据 type 不同
  }
}
```

**类型对应关系:**
| type | hasAudio | hasVideo |
|------|----------|----------|
| video | ❌ false | ✅ true |
| audio | ✅ true | ❌ false |
| image | ❌ false | ✅ true |
| text | ❌ false | ✅ true |

### 3️⃣ Tracks（轨道）
```json
"tracks": {
  "轨道ID": {
    "type": "video|audio",  // ✅ 必填
    "clips": [              // ✅ 必填，至少一个
      {
        "name": "唯一ID",           // ✅ 全局唯一
        "source": "输入资源ID",      // ✅ 必须存在于 inputs
        "timelineTrackStart": 0,    // ✅ ≥ 0
        "duration": 5,              // ✅ > 0
        "sourceStartOffset": 0,     // ✅ ≥ 0
        "clipType": "...",          // ✅ 必须与 source type 匹配

        // video/image/text 专用
        "transform": {
          "x": 0, "y": 0,
          "width": 1920,            // ✅ > 0
          "height": 1080,           // ✅ > 0
          "rotation": 0,
          "opacity": 1.0            // ✅ 0-1
        },

        // audio 专用
        "volume": 1.0               // ✅ 0-1
      }
    ]
  }
}
```

**Track 与 Clip 类型匹配:**
| Track type | 允许的 Clip types |
|-----------|------------------|
| video | video, image, text |
| audio | audio |

### 4️⃣ Output（输出）
```json
"output": {
  "file": "output.mp4",        // ✅ 必填
  "width": 1920,               // ✅ 必填，> 0
  "height": 1080,              // ✅ 必填，> 0
  "framerate": 30,             // ✅ 必填，> 0
  "startPosition": 0,          // ✅ 必填，≥ 0
  "endPosition": 10,           // ✅ 必填，> startPosition

  // 以下可选
  "tempDir": "./tmp",
  "videoCodec": "libx264",
  "audioCodec": "aac",
  "audioBitrate": "320k",
  "preset": "veryfast",
  "crf": 23,                   // 0-51
  "scaleRatio": 1.0,           // > 0
  "flags": ["-pix_fmt", "yuv420p"]
}
```

### 5️⃣ Transitions（转场）
```json
"transitions": [
  {
    "type": "fade",            // ✅ 必填
    "duration": 1.0,           // ✅ > 0
    "from": "clip1",           // ✅ 必须存在（可 null）
    "to": "clip2"              // ✅ 必须存在（可 null）
  }
]
```
⚠️ `from` 和 `to` 不能同时为 `null`

## 常见错误速查表

| 错误症状 | 可能原因 | 解决方法 |
|---------|---------|---------|
| `version 必须等于 1` | version 字段不是 1 | 修改为 `"version": 1` |
| `clip name 重复` | 多个 clip 使用同一个 name | 确保每个 clip name 唯一 |
| `source 不存在` | clip.source 引用的 input 不存在 | 检查 inputs 中是否有该 key |
| `hasAudio/hasVideo 不匹配` | type 与 hasAudio/hasVideo 不对应 | 参考上面的类型对应表 |
| `缺少 transform` | video/image/text clip 没有 transform | 添加完整的 transform 对象 |
| `缺少 volume` | audio clip 没有 volume | 添加 `"volume": 1.0` |
| `opacity 必须 <= 1` | opacity 大于 1 | 设置为 0-1 之间的值 |
| `endPosition 必须 > startPosition` | 时间区间错误 | 确保 endPosition > startPosition |
| `text 类型缺少 text` | text input 没有 metadata.text | 添加 `"metadata": {"text": "..."}` |
| `track 与 clip 类型不匹配` | video track 包含 audio clip | 检查 track.type 与 clip.clipType 匹配 |

## 特殊类型的 Metadata

### Audio - BGM（背景音乐）
```json
"metadata": {
  "audioType": "bgm",
  "loop": true,           // 循环播放
  "fadeIn": 2.0,          // 淡入秒数
  "fadeOut": 2.0          // 淡出秒数
}
```

### Audio - SFX（音效）
```json
"metadata": {
  "audioType": "sfx",
  "fadeIn": 0.05,         // 快速淡入
  "fadeOut": 0.05         // 快速淡出
}
```

### Audio - Narration（旁白）
```json
"metadata": {
  "audioType": "narration",
  "fadeIn": 0.3,
  "fadeOut": 0.3,
  "subtitleUrl": "https://example.com/sub.srt",  // 字幕 URL
  "language": "zh",                               // 语言代码
  "speaker": "旁白者"
}
```

### Image - Static（静态图片）
```json
"metadata": {
  "imageType": "static",
  "format": "png"
}
```

### Image - Animated（GIF 动画）
```json
"metadata": {
  "imageType": "animated",
  "format": "gif",
  "loop": true,           // 循环播放
  "frameRate": 24         // 帧率
}
```

### Text（文本）
```json
"metadata": {
  "text": "显示的文字",      // ✅ 必填
  "fontFamily": "Arial",
  "fontSize": 72,
  "fontColor": "#FFFFFF",
  "backgroundColor": "#00000080",
  "textAlign": "center",
  "fontWeight": "bold",
  "stroke": {
    "color": "#000000",
    "width": 2
  },
  "shadow": {
    "color": "#00000080",
    "blur": 4,
    "offsetX": 2,
    "offsetY": 2
  }
}
```

## 验证方法

### 方法 1: 在线 API（推荐）
```bash
curl -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json | jq
```

### 方法 2: 本地测试
```bash
npx tsx scripts/test-validate-local.ts
```

### 方法 3: 批量测试
```bash
bash scripts/test-validate-api.sh
```

## 最小可用示例

```json
{
  "version": 1,
  "inputs": {
    "video1": {
      "type": "video",
      "file": "input.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 10
    }
  },
  "tracks": {
    "main": {
      "type": "video",
      "clips": [{
        "name": "clip1",
        "source": "video1",
        "timelineTrackStart": 0,
        "duration": 5,
        "sourceStartOffset": 0,
        "clipType": "video",
        "transform": {
          "x": 0, "y": 0,
          "width": 1920, "height": 1080,
          "rotation": 0, "opacity": 1
        }
      }]
    }
  },
  "transitions": [],
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5
  }
}
```

## 调试技巧

1. **从最小示例开始** - 使用上面的最小示例，逐步添加功能
2. **逐个验证 input** - 先确保所有 inputs 格式正确
3. **检查引用关系** - 确保 clip.source 都存在于 inputs
4. **确认 name 唯一** - 使用编辑器搜索重复的 name
5. **使用验证 API** - 获取详细的错误路径和信息

## 需要帮助？

- 📖 完整文档: [docs/VALIDATION_API.md](./VALIDATION_API.md)
- 📖 语法规则: [docs/语法规则.md](./语法规则.md)
- 🐛 报告问题: [GitHub Issues](https://github.com/pilotpirxie/json-to-ffmpeg/issues)
