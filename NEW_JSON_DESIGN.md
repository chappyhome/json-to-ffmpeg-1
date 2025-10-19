# 新 JSON 设计方案 - 支持扩展音频和动画功能

## 🎯 设计目标

1. **向后兼容**: 现有的 `complex-timeline.json` 仍然有效
2. **插件友好**: 新功能通过 Worker 插件系统轻松扩展
3. **类型安全**: 保持清晰的类型定义
4. **渐进增强**: 可选的高级功能,不破坏基础功能

---

## 📋 新增功能需求

### 1. 音频源分类
- **背景音乐** (单个输入源,持续播放)
- **音效** (多个输入源,精准时间点触发)
- **旁白** (字幕+语音,单个输入源)

### 2. 新媒体类型
- **动画贴图源** (GIF 格式,支持多个)
- **文本源** (多个文本对象)

---

## 🏗️ 设计方案

### 核心设计原则

#### ✅ 推荐方案: **扩展 `type` + 可选 `metadata`**

**为什么这样设计最好?**

1. **向后兼容**: 现有 `type: "audio"` 仍然有效
2. **渐进增强**: 通过 `metadata` 添加额外信息
3. **插件友好**: 插件可以识别和转换 `metadata`
4. **类型清晰**: 保持 `type` 作为主要分类
5. **FFmpeg 映射**: 不同 metadata 映射到不同的 FFmpeg 参数

---

## 📄 新 JSON 格式设计

### 1. Inputs 扩展 (媒体源定义)

```json
{
  "version": 1,
  "inputs": {
    // ===== 向后兼容: 原有格式仍然有效 =====
    "old_audio_style": {
      "type": "audio",
      "file": "music.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 180
    },

    // ===== 新格式 1: 背景音乐 =====
    "background_music": {
      "type": "audio",
      "file": "samples/ever.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 181,
      "metadata": {
        "audioType": "bgm",           // 背景音乐标识
        "loop": true,                  // 是否循环
        "fadeIn": 2,                   // 淡入时长(秒)
        "fadeOut": 3                   // 淡出时长(秒)
      }
    },

    // ===== 新格式 2: 音效 =====
    "sound_effect_1": {
      "type": "audio",
      "file": "samples/click.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 0.5,
      "metadata": {
        "audioType": "sfx",            // 音效标识
        "category": "ui"               // 音效分类
      }
    },

    "sound_effect_2": {
      "type": "audio",
      "file": "samples/whoosh.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 1.2,
      "metadata": {
        "audioType": "sfx",
        "category": "transition"
      }
    },

    // ===== 新格式 3: 旁白 (语音 + 字幕) =====
    "narration_1": {
      "type": "audio",
      "file": "samples/voice.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 5.5,
      "metadata": {
        "audioType": "narration",      // 旁白标识
        "subtitle": "欢迎来到我的视频", // 字幕文本
        "language": "zh-CN",           // 语言
        "speaker": "narrator_1"        // 说话人标识
      }
    },

    // ===== 新格式 4: 动画贴图 (GIF) =====
    "animated_sticker_1": {
      "type": "image",                 // 保持 type 为 image
      "file": "samples/emoji.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,                   // GIF 自带时长
      "metadata": {
        "imageType": "animated",       // 动画图片标识
        "format": "gif",
        "loop": true,                  // 是否循环
        "frameRate": 24                // 帧率(可选)
      }
    },

    "animated_sticker_2": {
      "type": "image",
      "file": "samples/arrow.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "imageType": "animated",
        "format": "gif",
        "loop": false
      }
    },

    // ===== 新格式 5: 文本源 =====
    "text_title": {
      "type": "text",                  // 新类型!
      "file": "",                      // 文本源无文件
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,                   // 由 clip 决定
      "metadata": {
        "text": "标题文字",
        "fontFamily": "Arial",
        "fontSize": 72,
        "fontColor": "#FFFFFF",
        "backgroundColor": "#00000080", // 带透明度
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
    },

    "text_subtitle": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "字幕内容",
        "fontFamily": "Microsoft YaHei",
        "fontSize": 32,
        "fontColor": "#FFFFFF",
        "backgroundColor": "#000000CC",
        "textAlign": "center",
        "boxPadding": 10
      }
    }
  }
}
```

---

### 2. Clips 扩展 (剪辑使用)

```json
{
  "tracks": {
    // ===== 背景音乐轨道 =====
    "bgm_track": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "background_music",
          "timelineTrackStart": 0,
          "duration": 30,              // 使用 30 秒
          "sourceStartOffset": 10,     // 从第 10 秒开始
          "clipType": "audio",
          "volume": 0.6,               // 背景音乐通常较小音量
          "metadata": {
            "role": "bgm"              // 明确角色
          }
        }
      ]
    },

    // ===== 音效轨道 =====
    "sfx_track": {
      "type": "audio",
      "clips": [
        {
          "name": "click_sfx",
          "source": "sound_effect_1",
          "timelineTrackStart": 2.5,   // 精确的时间点
          "duration": 0.5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0,
          "metadata": {
            "role": "sfx",
            "trigger": "button_click"  // 触发事件
          }
        },
        {
          "name": "whoosh_sfx",
          "source": "sound_effect_2",
          "timelineTrackStart": 5.0,
          "duration": 1.2,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 0.8,
          "metadata": {
            "role": "sfx",
            "trigger": "transition"
          }
        }
      ]
    },

    // ===== 旁白轨道 =====
    "narration_track": {
      "type": "audio",
      "clips": [
        {
          "name": "narration_clip_1",
          "source": "narration_1",
          "timelineTrackStart": 1.0,
          "duration": 5.5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0,
          "metadata": {
            "role": "narration",
            "subtitlePosition": "bottom", // 字幕位置
            "subtitleStyle": "default"
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
          "source": "animated_sticker_1",
          "timelineTrackStart": 3.0,
          "duration": 2.0,             // 显示 2 秒
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
              "type": "bounce",        // 动画效果
              "duration": 0.5
            }
          }
        },
        {
          "name": "arrow_sticker",
          "source": "animated_sticker_2",
          "timelineTrackStart": 6.0,
          "duration": 1.5,
          "sourceStartOffset": 0,
          "clipType": "image",
          "transform": {
            "x": 800,
            "y": 300,
            "width": 150,
            "height": 150,
            "rotation": 45,
            "opacity": 0.9
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
          "clipType": "text",          // 新 clipType!
          "transform": {
            "x": 960,                  // 居中 (1920/2)
            "y": 200,
            "width": 800,
            "height": 100,
            "rotation": 0,
            "opacity": 1
          },
          "metadata": {
            "animation": {
              "in": "fadeIn",          // 入场动画
              "out": "fadeOut",        // 出场动画
              "inDuration": 0.5,
              "outDuration": 0.5
            }
          }
        },
        {
          "name": "subtitle_text",
          "source": "text_subtitle",
          "timelineTrackStart": 1.0,
          "duration": 5.0,
          "sourceStartOffset": 0,
          "clipType": "text",
          "transform": {
            "x": 960,
            "y": 900,                  // 底部
            "width": 1600,
            "height": 80,
            "rotation": 0,
            "opacity": 0.95
          }
        }
      ]
    }
  }
}
```

---

## 🎯 为什么这样设计最好?

### 1. **向后兼容性** ✅

```json
// 老格式仍然有效
{
  "type": "audio",
  "file": "music.mp3",
  "hasAudio": true,
  "hasVideo": false,
  "duration": 180
}

// 新格式是可选的增强
{
  "type": "audio",
  "file": "music.mp3",
  "hasAudio": true,
  "hasVideo": false,
  "duration": 180,
  "metadata": {          // 可选!
    "audioType": "bgm"
  }
}
```

### 2. **插件系统友好** ✅

```typescript
// 插件可以轻松识别和转换
export const audioCategoryPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  // 遍历所有音频 clips
  for (const [trackName, track] of Object.entries(timeline.tracks)) {
    for (const clip of track.clips) {
      if (clip.metadata?.role === 'bgm') {
        // 处理背景音乐:降低音量、添加循环等
        clip.volume = clip.volume || 0.6;
      }

      if (clip.metadata?.role === 'sfx') {
        // 处理音效:确保短促、音量适中
        clip.volume = clip.volume || 0.8;
      }

      if (clip.metadata?.role === 'narration') {
        // 处理旁白:添加字幕、确保音量清晰
        clip.volume = clip.volume || 1.0;
        // 生成字幕层
        generateSubtitle(clip);
      }
    }
  }

  return { timeline, warnings };
};
```

### 3. **类型系统清晰** ✅

```typescript
// 扩展现有类型,不破坏原有结构
export type Source = {
  type: "video" | "audio" | "image" | "text";  // 添加 "text"
  file: string;
  hasAudio: boolean;
  hasVideo: boolean;
  duration: number;
  metadata?: SourceMetadata;  // 可选的元数据
};

export type SourceMetadata =
  | AudioMetadata
  | ImageMetadata
  | TextMetadata;

export type AudioMetadata = {
  audioType?: "bgm" | "sfx" | "narration";
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  subtitle?: string;
  language?: string;
  speaker?: string;
  category?: string;
};

export type ImageMetadata = {
  imageType?: "static" | "animated";
  format?: "png" | "jpg" | "gif";
  loop?: boolean;
  frameRate?: number;
};

export type TextMetadata = {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  stroke?: { color: string; width: number };
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  boxPadding?: number;
};
```

### 4. **FFmpeg 映射清晰** ✅

不同的 `metadata` 映射到不同的 FFmpeg 参数:

```typescript
// 背景音乐 (BGM)
if (metadata.audioType === 'bgm') {
  // 添加循环、淡入淡出
  ffmpegArgs.push(
    '-stream_loop', metadata.loop ? '-1' : '0',
    '-af', `afade=t=in:st=0:d=${metadata.fadeIn},afade=t=out:st=${duration - metadata.fadeOut}:d=${metadata.fadeOut}`
  );
}

// 音效 (SFX)
if (metadata.audioType === 'sfx') {
  // 精确时间点、短促音效
  ffmpegArgs.push('-af', `volume=${clip.volume}`);
}

// 旁白 (Narration)
if (metadata.audioType === 'narration') {
  // 生成字幕滤镜
  filterComplex += `drawtext=text='${metadata.subtitle}':x=(w-text_w)/2:y=h-50:fontsize=32:fontcolor=white`;
}

// GIF 动画
if (metadata.imageType === 'animated' && metadata.format === 'gif') {
  // 使用 gif 解码器
  ffmpegArgs.push('-ignore_loop', metadata.loop ? '0' : '1');
}

// 文本渲染
if (source.type === 'text') {
  const text = metadata.text;
  filterComplex += `drawtext=text='${text}':fontfile=${metadata.fontFamily}:fontsize=${metadata.fontSize}:fontcolor=${metadata.fontColor}`;
}
```

### 5. **渐进增强** ✅

用户可以:
- **阶段 1**: 只用基础的 `type: "audio"` (老格式)
- **阶段 2**: 添加 `metadata.audioType` 来区分音频类别
- **阶段 3**: 添加更多 metadata (循环、淡入淡出等)
- **阶段 4**: 使用新的 `type: "text"` 来添加文本

### 6. **易于验证和文档化** ✅

```typescript
// Zod 验证
const SourceMetadataSchema = z.object({
  audioType: z.enum(['bgm', 'sfx', 'narration']).optional(),
  loop: z.boolean().optional(),
  fadeIn: z.number().optional(),
  fadeOut: z.number().optional(),
  subtitle: z.string().optional(),
  // ... 其他字段
});

const SourceSchema = z.object({
  type: z.enum(['video', 'audio', 'image', 'text']),
  file: z.string(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
  duration: z.number(),
  metadata: SourceMetadataSchema.optional(),  // 可选
});
```

---

## 📊 对比其他设计方案

### ❌ 方案 A: 为每种音频创建新 type

```json
{
  "type": "bgm",      // 太多类型
  "type": "sfx",      // 不向后兼容
  "type": "narration" // 破坏现有类型系统
}
```

**缺点**:
- 不向后兼容
- 类型爆炸 (bgm, sfx, narration, static_image, animated_image, ...)
- 难以扩展

### ❌ 方案 B: 使用单独的配置块

```json
{
  "inputs": {...},
  "audioCategories": {    // 单独配置
    "background_music": "bgm",
    "sound_effect_1": "sfx"
  }
}
```

**缺点**:
- 信息分散,不直观
- 需要额外的关联逻辑
- 难以维护

### ✅ 推荐方案: metadata 扩展

**优点**:
- ✅ 向后兼容
- ✅ 信息集中在 source 定义中
- ✅ 可选的增强功能
- ✅ 类型安全
- ✅ 插件友好
- ✅ 易于扩展

---

## 🚀 完整示例: 扩展后的 complex-timeline.json

参见下一个文件: `complex-timeline-extended.json`

---

## 📝 实现路线图

### Phase 1: 类型定义
1. 扩展 `Source` 类型添加 `metadata`
2. 扩展 `Clip` 类型添加 `metadata`
3. 添加新的 `type: "text"`

### Phase 2: 插件开发
1. `audio-category-plugin.ts` - 处理音频分类
2. `animated-image-plugin.ts` - 处理 GIF
3. `text-rendering-plugin.ts` - 处理文本渲染
4. `subtitle-generation-plugin.ts` - 处理字幕生成

### Phase 3: FFmpeg 命令生成
1. 扩展 `parseAudioClip.ts` 识别 metadata
2. 扩展 `parseVideoClip.ts` 处理 GIF 和文本
3. 添加新的滤镜生成器

### Phase 4: 验证和测试
1. 添加 Zod schemas
2. 编写单元测试
3. 添加示例 JSON

---

## 💡 总结

这个设计方案通过 **`metadata` 扩展** 实现了:

1. **100% 向后兼容** - 老 JSON 无需修改
2. **插件友好** - metadata 可被插件轻松识别和转换
3. **类型安全** - 清晰的类型定义
4. **易于扩展** - 新功能只需添加新的 metadata 字段
5. **FFmpeg 映射清晰** - 不同 metadata 对应不同的 FFmpeg 参数

这是最适合当前 Worker 插件架构的扩展方案! 🎉
