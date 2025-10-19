# JSON 设计方案对比分析

## 📋 需求回顾

扩展 JSON 格式支持:
1. **音频分类**: 背景音乐 (单个)、音效 (多个)、旁白 (字幕+语音)
2. **动画贴图**: GIF 格式,支持多个
3. **文本源**: 可多个文本对象
4. **向后兼容**: 现有 JSON 格式仍然有效
5. **插件友好**: 适合 Worker 插件系统扩展

---

## 🎯 设计方案对比

### 方案 A: 新增多个 type (❌ 不推荐)

```json
{
  "inputs": {
    "bgm1": {
      "type": "bgm",              // 新 type
      "file": "music.mp3"
    },
    "sfx1": {
      "type": "sfx",              // 新 type
      "file": "click.mp3"
    },
    "voice1": {
      "type": "narration",        // 新 type
      "file": "voice.mp3"
    },
    "gif1": {
      "type": "gif",              // 新 type
      "file": "emoji.gif"
    },
    "txt1": {
      "type": "text",             // 新 type
      "content": "Hello"
    }
  }
}
```

**优点**:
- ✅ 类型明确

**缺点**:
- ❌ **不向后兼容** (破坏现有 `type: "audio"`)
- ❌ **类型爆炸** (bgm, sfx, narration, static_image, animated_image, text, ...)
- ❌ **难以扩展** (每新增一种子类型就要新增一个 type)
- ❌ **FFmpeg 映射复杂** (需要大量 if-else 判断)
- ❌ **不符合插件架构** (插件难以统一处理音频类型)

---

### 方案 B: 单独的配置块 (❌ 不推荐)

```json
{
  "inputs": {
    "music1": {
      "type": "audio",
      "file": "music.mp3"
    },
    "click1": {
      "type": "audio",
      "file": "click.mp3"
    }
  },
  "audioCategories": {           // 单独配置块
    "music1": "bgm",
    "click1": "sfx"
  },
  "textContents": {               // 单独配置块
    "text1": {
      "text": "Hello",
      "fontSize": 32
    }
  }
}
```

**优点**:
- ✅ 向后兼容

**缺点**:
- ❌ **信息分散** (需要在多处查找同一个源的信息)
- ❌ **维护困难** (修改时需要同步多处)
- ❌ **关联复杂** (需要额外的 ID 关联逻辑)
- ❌ **不直观** (阅读 JSON 时难以理解完整信息)
- ❌ **验证困难** (需要跨块验证引用的有效性)

---

### 方案 C: 使用 `category` 字段 (⚠️ 可行但不够优雅)

```json
{
  "inputs": {
    "music1": {
      "type": "audio",
      "category": "bgm",          // 添加 category
      "file": "music.mp3"
    },
    "click1": {
      "type": "audio",
      "category": "sfx",          // 添加 category
      "file": "click.mp3"
    }
  }
}
```

**优点**:
- ✅ 向后兼容 (category 可选)
- ✅ 信息集中

**缺点**:
- ⚠️ **扩展性有限** (只能表达分类,无法表达复杂属性)
- ⚠️ **字段语义不明** (category 可能与其他用途混淆)
- ⚠️ **无法表达结构化数据** (如字幕的字体、颜色等)
- ⚠️ **难以添加多个属性** (如果需要同时表达多个特性)

---

### ✅ 方案 D: metadata 扩展 (强烈推荐)

```json
{
  "inputs": {
    "music1": {
      "type": "audio",
      "file": "music.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 180,
      "metadata": {               // 可选的元数据
        "audioType": "bgm",
        "loop": true,
        "fadeIn": 2,
        "fadeOut": 3
      }
    },
    "click1": {
      "type": "audio",
      "file": "click.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 0.5,
      "metadata": {
        "audioType": "sfx",
        "category": "ui"
      }
    },
    "voice1": {
      "type": "audio",
      "file": "voice.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 5.5,
      "metadata": {
        "audioType": "narration",
        "subtitle": "字幕内容",
        "language": "zh-CN"
      }
    },
    "emoji1": {
      "type": "image",
      "file": "emoji.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "imageType": "animated",
        "format": "gif",
        "loop": true
      }
    },
    "title1": {
      "type": "text",             // 新 type (仅此一个)
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "标题",
        "fontSize": 72,
        "fontColor": "#FFFFFF",
        "stroke": { "color": "#000", "width": 2 }
      }
    }
  }
}
```

**优点**:
- ✅ **向后兼容** (metadata 完全可选,老 JSON 无需修改)
- ✅ **信息集中** (所有相关信息都在 source 定义中)
- ✅ **扩展性强** (metadata 可以包含任意复杂的结构)
- ✅ **语义清晰** (metadata 明确表示"额外的元数据")
- ✅ **插件友好** (插件可以轻松读取和转换 metadata)
- ✅ **类型安全** (TypeScript 类型定义清晰)
- ✅ **渐进增强** (用户可以逐步添加 metadata)
- ✅ **易于验证** (Zod schema 验证简单)
- ✅ **易于文档化** (metadata 结构自说明)

---

## 🔍 详细对比表

| 特性 | 方案A<br>(新增type) | 方案B<br>(配置块) | 方案C<br>(category) | 方案D<br>(metadata) ✅ |
|------|---------------------|-------------------|---------------------|------------------------|
| **向后兼容** | ❌ 否 | ✅ 是 | ✅ 是 | ✅ 是 |
| **信息集中** | ✅ 是 | ❌ 否 | ✅ 是 | ✅ 是 |
| **扩展性** | ❌ 差 | ⚠️ 中 | ⚠️ 中 | ✅ 优 |
| **插件友好** | ❌ 否 | ❌ 否 | ⚠️ 中 | ✅ 是 |
| **类型安全** | ⚠️ 中 | ❌ 差 | ⚠️ 中 | ✅ 优 |
| **易于理解** | ⚠️ 中 | ❌ 差 | ✅ 是 | ✅ 是 |
| **易于维护** | ❌ 差 | ❌ 差 | ⚠️ 中 | ✅ 优 |
| **FFmpeg映射** | ❌ 复杂 | ❌ 复杂 | ⚠️ 中 | ✅ 清晰 |
| **验证难度** | ⚠️ 中 | ❌ 难 | ✅ 易 | ✅ 易 |
| **文档化** | ⚠️ 中 | ❌ 难 | ✅ 易 | ✅ 易 |

---

## 💡 为什么 metadata 方案最适合插件架构?

### 1. 插件可以轻松识别和转换

```typescript
// 插件示例: 音频分类处理器
export const audioCategoryPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  for (const [inputId, input] of Object.entries(timeline.inputs)) {
    // 轻松读取 metadata
    const audioType = input.metadata?.audioType;

    if (audioType === 'bgm') {
      // 处理背景音乐
      if (!input.metadata.loop) {
        input.metadata.loop = true;
        warnings.push(`BGM ${inputId} 已自动设置为循环`);
      }
    }

    if (audioType === 'sfx') {
      // 处理音效
      if (input.duration > 3) {
        warnings.push(`音效 ${inputId} 时长过长 (${input.duration}s)`);
      }
    }

    if (audioType === 'narration') {
      // 处理旁白,生成字幕
      generateSubtitle(input);
    }
  }

  return { timeline, warnings };
};
```

### 2. 插件可以添加和修改 metadata

```typescript
// 插件示例: 自动添加默认值
export const defaultMetadataPlugin: Plugin = (timeline: any): PluginResult => {
  for (const input of Object.values(timeline.inputs)) {
    if (input.type === 'audio' && !input.metadata) {
      // 自动添加 metadata
      input.metadata = { audioType: 'bgm' };
    }

    if (input.metadata?.audioType === 'bgm') {
      // 添加默认的淡入淡出
      input.metadata.fadeIn = input.metadata.fadeIn ?? 2;
      input.metadata.fadeOut = input.metadata.fadeOut ?? 3;
    }
  }

  return { timeline };
};
```

### 3. 插件可以验证 metadata

```typescript
// 插件示例: 验证音频配置
export const validateAudioPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  for (const [inputId, input] of Object.entries(timeline.inputs)) {
    if (input.metadata?.audioType === 'narration') {
      // 验证旁白必须有字幕
      if (!input.metadata.subtitle) {
        throw new Error(`旁白 ${inputId} 缺少字幕文本`);
      }

      // 验证语言代码
      if (!input.metadata.language) {
        warnings.push(`旁白 ${inputId} 未指定语言,默认使用 zh-CN`);
        input.metadata.language = 'zh-CN';
      }
    }
  }

  return { timeline, warnings };
};
```

### 4. 插件可以转换 metadata 为 FFmpeg 参数

```typescript
// 插件示例: metadata 到 FFmpeg 的转换
export const metadataToFFmpegPlugin: Plugin = (timeline: any): PluginResult => {
  for (const track of Object.values(timeline.tracks)) {
    for (const clip of track.clips) {
      const sourceId = clip.source;
      const source = timeline.inputs[sourceId];

      if (source.metadata?.audioType === 'bgm') {
        // 背景音乐: 添加循环和淡入淡出
        clip.ffmpegFilters = clip.ffmpegFilters || [];

        if (source.metadata.loop) {
          clip.ffmpegOptions = ['-stream_loop', '-1'];
        }

        const fadeIn = source.metadata.fadeIn || 0;
        const fadeOut = source.metadata.fadeOut || 0;

        if (fadeIn > 0 || fadeOut > 0) {
          clip.ffmpegFilters.push(
            `afade=t=in:st=0:d=${fadeIn}`,
            `afade=t=out:st=${clip.duration - fadeOut}:d=${fadeOut}`
          );
        }
      }

      if (source.metadata?.imageType === 'animated') {
        // GIF: 设置循环选项
        clip.ffmpegOptions = clip.ffmpegOptions || [];

        if (source.metadata.loop) {
          clip.ffmpegOptions.push('-ignore_loop', '0');
        } else {
          clip.ffmpegOptions.push('-ignore_loop', '1');
        }
      }

      if (source.type === 'text') {
        // 文本: 生成 drawtext 滤镜
        const text = source.metadata.text;
        const fontSize = source.metadata.fontSize || 32;
        const fontColor = source.metadata.fontColor || '#FFFFFF';

        clip.ffmpegFilters = clip.ffmpegFilters || [];
        clip.ffmpegFilters.push(
          `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}`
        );
      }
    }
  }

  return { timeline };
};
```

---

## 🚀 实现路径

### Phase 1: 类型定义 (库层面)

```typescript
// src/types/Inputs.ts
export type Source = {
  type: "video" | "audio" | "image" | "text";  // 添加 "text"
  file: string;
  hasAudio: boolean;
  hasVideo: boolean;
  duration: number;
  metadata?: SourceMetadata;  // 新增!
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

### Phase 2: 插件实现 (Worker 层面)

```typescript
// worker/src/plugins/audio-category.ts
export const audioCategoryPlugin: Plugin = ...

// worker/src/plugins/animated-image.ts
export const animatedImagePlugin: Plugin = ...

// worker/src/plugins/text-rendering.ts
export const textRenderingPlugin: Plugin = ...

// worker/src/plugins/subtitle-generation.ts
export const subtitleGenerationPlugin: Plugin = ...
```

### Phase 3: 验证 (Worker 层面)

```typescript
// worker/src/validation.ts
const MetadataSchema = z.union([
  z.object({
    audioType: z.enum(['bgm', 'sfx', 'narration']).optional(),
    loop: z.boolean().optional(),
    // ... 其他字段
  }),
  z.object({
    imageType: z.enum(['static', 'animated']).optional(),
    // ... 其他字段
  }),
  z.object({
    text: z.string(),
    // ... 其他字段
  }),
]);

const SourceSchema = z.object({
  type: z.enum(['video', 'audio', 'image', 'text']),
  file: z.string(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
  duration: z.number(),
  metadata: MetadataSchema.optional(),  // 可选!
});
```

---

## 📊 总结

| 方案 | 评分 | 推荐度 |
|------|------|--------|
| A. 新增多个 type | ⭐⭐ | ❌ 不推荐 |
| B. 单独配置块 | ⭐⭐ | ❌ 不推荐 |
| C. category 字段 | ⭐⭐⭐ | ⚠️ 可行但不够优雅 |
| **D. metadata 扩展** | **⭐⭐⭐⭐⭐** | **✅ 强烈推荐** |

### metadata 方案的核心优势:

1. ✅ **100% 向后兼容** - 老 JSON 无需任何修改
2. ✅ **插件架构完美匹配** - 插件可以轻松处理 metadata
3. ✅ **类型安全** - TypeScript 类型定义清晰
4. ✅ **渐进增强** - 用户可以逐步添加功能
5. ✅ **易于扩展** - 新增功能只需添加新的 metadata 字段
6. ✅ **清晰的 FFmpeg 映射** - metadata 直接对应 FFmpeg 参数
7. ✅ **易于验证和文档化** - Zod schema 和 TypeScript 类型自说明

**这就是为什么 metadata 扩展方案最适合当前 Worker 插件架构的原因!** 🎉
