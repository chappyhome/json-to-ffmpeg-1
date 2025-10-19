# JSON 扩展设计方案 - 最终推荐

## 🎯 核心设计原则

**使用 `metadata` 字段进行可选的扩展**

---

## 📋 设计要点

### 1. 向后兼容

```json
// 老格式 ✅ 仍然有效
{
  "type": "audio",
  "file": "music.mp3",
  "hasAudio": true,
  "hasVideo": false,
  "duration": 180
}

// 新格式 ✅ 可选的增强
{
  "type": "audio",
  "file": "music.mp3",
  "hasAudio": true,
  "hasVideo": false,
  "duration": 180,
  "metadata": {          // 💡 新增!完全可选!
    "audioType": "bgm",
    "loop": true
  }
}
```

### 2. 扩展方式

| 原有类型 | 扩展方式 | 新能力 |
|---------|---------|--------|
| `type: "audio"` | `metadata.audioType` | bgm / sfx / narration |
| `type: "image"` | `metadata.imageType` | static / animated (GIF) |
| **新增** | `type: "text"` | 文本渲染 |

---

## 📄 完整 JSON 示例

### 输入源定义

```json
{
  "inputs": {
    // ===== 1. 背景音乐 =====
    "bgm_main": {
      "type": "audio",
      "file": "samples/music.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 180,
      "metadata": {
        "audioType": "bgm",        // 标识为背景音乐
        "loop": true,              // 循环播放
        "fadeIn": 2,               // 淡入 2 秒
        "fadeOut": 3               // 淡出 3 秒
      }
    },

    // ===== 2. 音效 (可多个) =====
    "sfx_click": {
      "type": "audio",
      "file": "samples/click.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 0.5,
      "metadata": {
        "audioType": "sfx",        // 标识为音效
        "category": "ui"           // 音效分类
      }
    },

    // ===== 3. 旁白 (语音 + 字幕) =====
    "narration_intro": {
      "type": "audio",
      "file": "samples/voice.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 5.5,
      "metadata": {
        "audioType": "narration",  // 标识为旁白
        "subtitle": "欢迎观看",     // 字幕文本
        "language": "zh-CN",       // 语言
        "speaker": "narrator_1"    // 说话人
      }
    },

    // ===== 4. 动画贴图 (GIF) =====
    "sticker_emoji": {
      "type": "image",             // 保持 image 类型
      "file": "samples/emoji.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "imageType": "animated",   // 标识为动画
        "format": "gif",
        "loop": true,              // GIF 循环
        "frameRate": 24
      }
    },

    // ===== 5. 文本源 =====
    "text_title": {
      "type": "text",              // ⭐ 新类型
      "file": "",                  // 文本源无文件
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "标题文字",
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
    }
  }
}
```

### 轨道使用

```json
{
  "tracks": {
    // ===== 背景音乐轨道 =====
    "bgm_track": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "bgm_main",
          "timelineTrackStart": 0,
          "duration": 30,
          "sourceStartOffset": 10,
          "clipType": "audio",
          "volume": 0.5,           // 背景音乐音量较小
          "metadata": {
            "role": "bgm"          // Clip 级别的元数据
          }
        }
      ]
    },

    // ===== 音效轨道 (多个音效) =====
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click_at_2s",
          "source": "sfx_click",
          "timelineTrackStart": 2.0,  // 精确时间点
          "duration": 0.5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 0.8,
          "metadata": {
            "role": "sfx",
            "trigger": "button_click"
          }
        }
        // 可以有更多音效...
      ]
    },

    // ===== 旁白轨道 =====
    "narration_track": {
      "type": "audio",
      "clips": [
        {
          "name": "intro_narration",
          "source": "narration_intro",
          "timelineTrackStart": 1.0,
          "duration": 5.5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0,
          "metadata": {
            "role": "narration",
            "subtitlePosition": "bottom"  // 字幕位置
          }
        }
      ]
    },

    // ===== 动画贴图轨道 =====
    "sticker_track": {
      "type": "video",
      "clips": [
        {
          "name": "emoji_sticker",
          "source": "sticker_emoji",
          "timelineTrackStart": 3.0,
          "duration": 2.0,
          "sourceStartOffset": 0,
          "clipType": "image",
          "transform": {
            "x": 100,
            "y": 100,
            "width": 200,
            "height": 200,
            "rotation": 0,
            "opacity": 1
          },
          "metadata": {
            "animation": {
              "type": "bounce",    // 额外的动画效果
              "duration": 0.5
            }
          }
        }
      ]
    },

    // ===== 文本轨道 =====
    "text_track": {
      "type": "video",
      "clips": [
        {
          "name": "title_text",
          "source": "text_title",
          "timelineTrackStart": 0.5,
          "duration": 3.0,
          "sourceStartOffset": 0,
          "clipType": "text",      // ⭐ 新 clipType
          "transform": {
            "x": 960,              // 居中
            "y": 200,
            "width": 800,
            "height": 100,
            "rotation": 0,
            "opacity": 1
          },
          "metadata": {
            "animation": {
              "type": "bounce",    // 入场/出场动画示例
              "duration": 0.5
            }
          }
        }
      ]
    }
  }
}
```

---

## 🎨 类型定义

```typescript
// 扩展 Source 类型
export type Source = {
  type: "video" | "audio" | "image" | "text";  // 添加 "text"
  file: string;
  hasAudio: boolean;
  hasVideo: boolean;
  duration: number;
  metadata?: SourceMetadata;  // ⭐ 可选的元数据
};

// 元数据联合类型
export type SourceMetadata =
  | AudioMetadata
  | ImageMetadata
  | TextMetadata;

// 音频元数据
export type AudioMetadata = {
  audioType?: "bgm" | "sfx" | "narration";
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  subtitle?: string;      // 用于旁白
  language?: string;
  speaker?: string;
  category?: string;      // 用于音效分类
};

// 图片元数据
export type ImageMetadata = {
  imageType?: "static" | "animated";
  format?: "png" | "jpg" | "gif";
  loop?: boolean;
  frameRate?: number;
};

// 文本元数据
export type TextMetadata = {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  stroke?: { color: string; width: number };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number
  };
  boxPadding?: number;
};

// 扩展 Clip 类型
export type Clip = VideoClip | AudioClip | ImageClip | TextClip;

export type TextClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: "text";      // ⭐ 新 clipType
  transform: Transform;
  metadata?: any;        // Clip 级别的元数据
};
```

---

## 💡 为什么这样设计最好?

### 1. ✅ 向后兼容

- 老 JSON 不需要任何修改
- `metadata` 字段完全可选
- 现有代码继续工作

### 2. ✅ 插件友好

```typescript
// 插件可以轻松识别和处理 metadata
export const audioCategoryPlugin: Plugin = (timeline: any) => {
  for (const input of Object.values(timeline.inputs)) {
    if (input.metadata?.audioType === 'bgm') {
      // 处理背景音乐
      input.metadata.loop = input.metadata.loop ?? true;
    }

    if (input.metadata?.audioType === 'sfx') {
      // 处理音效
    }

    if (input.metadata?.audioType === 'narration') {
      // 处理旁白,生成字幕
      generateSubtitle(input.metadata.subtitle);
    }
  }
  return { timeline };
};
```

### 3. ✅ 渐进增强

用户可以分阶段使用:

- **阶段 1**: 只用 `type: "audio"` (老格式)
- **阶段 2**: 添加 `metadata.audioType` 区分类别
- **阶段 3**: 添加更多属性 (loop, fadeIn, fadeOut)
- **阶段 4**: 使用新的 `type: "text"`

### 4. ✅ 类型安全

TypeScript 类型清晰,编辑器自动补全

### 5. ✅ FFmpeg 映射清晰

```typescript
// 不同 metadata 映射到不同的 FFmpeg 参数
if (metadata.audioType === 'bgm') {
  // 背景音乐: 循环 + 淡入淡出
  args.push('-stream_loop', '-1');
  args.push('-af', `afade=t=in:d=${metadata.fadeIn}`);
}

if (metadata.imageType === 'animated') {
  // GIF: 设置循环
  args.push('-ignore_loop', metadata.loop ? '0' : '1');
}

if (source.type === 'text') {
  // 文本: drawtext 滤镜
  filter += `drawtext=text='${metadata.text}':fontsize=${metadata.fontSize}`;
}
```

### 6. ✅ 易于验证

```typescript
// Zod 验证
const MetadataSchema = z.object({
  audioType: z.enum(['bgm', 'sfx', 'narration']).optional(),
  loop: z.boolean().optional(),
  // ... 其他可选字段
}).optional();  // metadata 本身也是可选的
```

---

## 📝 实现优先级

### Phase 1: 基础类型扩展
1. ✅ 扩展 `Source` 添加 `metadata`
2. ✅ 添加 `type: "text"`
3. ✅ 扩展 `Clip` 添加 `clipType: "text"`

### Phase 2: 插件实现
1. `audio-category-plugin` - 音频分类处理
2. `animated-image-plugin` - GIF 处理
3. `text-rendering-plugin` - 文本渲染
4. `subtitle-generation-plugin` - 字幕生成

### Phase 3: FFmpeg 生成
1. 扩展 `parseAudioClip` 识别 audioType
2. 扩展 `parseVideoClip` 处理 GIF 和文本
3. 添加新的滤镜生成器

### Phase 4: 测试和文档
1. 添加 Zod schemas
2. 编写单元测试
3. 更新 README
4. 添加示例 JSON

---

## 📚 相关文件

- **详细设计**: [NEW_JSON_DESIGN.md](NEW_JSON_DESIGN.md)
- **方案对比**: [DESIGN_COMPARISON.md](DESIGN_COMPARISON.md)
- **完整示例**: [worker/test/fixtures/complex-timeline-extended.json](../../worker/test/fixtures/complex-timeline-extended.json)
- **当前格式**: [worker/test/fixtures/complex-timeline.json](../../worker/test/fixtures/complex-timeline.json)

---

## ✨ 总结

**推荐使用 `metadata` 扩展方案**,因为它:

1. ✅ 100% 向后兼容
2. ✅ 完美匹配 Worker 插件架构
3. ✅ 类型安全且易于扩展
4. ✅ 清晰的 FFmpeg 映射
5. ✅ 渐进增强,用户友好

**这是最适合当前项目架构的扩展方案!** 🎉

