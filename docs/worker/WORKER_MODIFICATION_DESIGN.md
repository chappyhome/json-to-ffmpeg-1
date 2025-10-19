# Worker 代码修改设计 - 支持新 JSON 格式

## 🎯 设计目标

1. **向后兼容**: 现有 JSON 格式继续工作
2. **支持新特性**: 背景音乐、音效、旁白、GIF、文本
3. **插件架构**: 利用现有插件系统实现扩展
4. **渐进式**: 可以分阶段实施

---

## 📊 当前架构分析

### 现有文件结构

```
worker/
├── src/
│   ├── index.ts              # API 入口,路由处理
│   ├── types.ts              # 类型定义 (简单)
│   ├── validation.ts         # Zod 验证 (宽松)
│   ├── tokenizer.ts          # FFmpeg 命令解析
│   ├── plugin-manager.ts     # 插件管理器
│   └── plugins/
│       ├── index.ts          # 插件导出
│       ├── normalize-output.ts    # 输出默认值
│       └── validate-tracks.ts     # 轨道验证
├── test/
│   ├── build.test.ts
│   ├── tokenizer.test.ts
│   └── fixtures/
│       ├── simple-timeline.json
│       └── complex-timeline.json
└── package.json
```

### 关键特点

1. **类型定义简单** - `types.ts` 只定义了基础接口
2. **验证宽松** - `validation.ts` 使用 `z.any()` 和 `passthrough()`
3. **插件系统** - 已有插件管理器,顺序执行
4. **职责清晰** - Worker 只做验证+转换,核心逻辑在库中

---

## 🏗️ 修改方案设计

### Phase 1: 类型定义扩展 (Worker 层)

**目标**: 定义新的 TypeScript 类型,但保持验证宽松

#### 文件: `worker/src/types.ts`

**新增类型定义**:

```typescript
/**
 * Extended types for new JSON format
 * These are for TypeScript type safety only
 * Validation remains permissive to allow backward compatibility
 */

// ===== Source Metadata Types =====

export type AudioMetadata = {
  audioType?: 'bgm' | 'sfx' | 'narration';
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  subtitle?: string;
  language?: string;
  speaker?: string;
  category?: string;
  description?: string;
};

export type ImageMetadata = {
  imageType?: 'static' | 'animated';
  format?: 'png' | 'jpg' | 'gif';
  loop?: boolean;
  frameRate?: number;
  description?: string;
};

export type TextMetadata = {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  stroke?: {
    color: string;
    width: number;
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  boxPadding?: number;
};

export type SourceMetadata = AudioMetadata | ImageMetadata | TextMetadata;

// ===== Clip Metadata Types =====

export type ClipMetadata = {
  role?: 'bgm' | 'sfx' | 'narration';
  trigger?: string;
  description?: string;
  subtitlePosition?: 'top' | 'bottom' | 'center';
  subtitleStyle?: string;
  syncWithAudio?: string;
  animation?: {
    type?: string;
    in?: string;
    out?: string;
    duration?: number;
    inDuration?: number;
    outDuration?: number;
    easing?: string;
  };
};

// ===== Extended Source Type =====

export type ExtendedSource = {
  type: 'video' | 'audio' | 'image' | 'text';
  file: string;
  hasAudio: boolean;
  hasVideo: boolean;
  duration: number;
  metadata?: SourceMetadata;
};

// ===== Extended Clip Type =====

export type ExtendedClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: 'video' | 'audio' | 'image' | 'text';
  volume?: number;
  transform?: any;
  metadata?: ClipMetadata;
};

// ===== Extended Timeline Type =====

export type ExtendedTimeline = {
  version: number;
  inputs: Record<string, ExtendedSource>;
  tracks: Record<string, {
    type: 'video' | 'audio';
    clips: ExtendedClip[];
  }>;
  transitions?: any[];
  output: any;
};
```

**要点**:
- ✅ 定义了详细的类型,提供 TypeScript 类型安全
- ✅ 所有 `metadata` 字段都是可选的
- ✅ 不影响现有代码,只用于类型提示

---

### Phase 2: 验证层扩展

**目标**: 保持宽松验证,但添加可选的严格验证

#### 文件: `worker/src/validation.ts`

**策略**:
1. 保持基础验证宽松 (向后兼容)
2. 添加可选的详细验证 schemas
3. 插件可以使用详细验证

```typescript
import { z } from 'zod';

// ===== 基础验证 (保持不变,向后兼容) =====

export const TimelineSchema = z.object({
  version: z.number().int().positive(),
  inputs: z.record(z.any()),  // 保持宽松
  tracks: z.record(z.any()),  // 保持宽松
  output: z.object({
    file: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    framerate: z.number().positive(),
  }).passthrough(),
  transitions: z.array(z.any()).optional().default([]),
}).passthrough();

export type TimelineInput = z.infer<typeof TimelineSchema>;

export function validateTimeline(data: unknown): TimelineInput {
  return TimelineSchema.parse(data);
}

// ===== 新增: 详细验证 schemas (可选使用) =====

/**
 * Detailed metadata schemas for plugins to use
 * These are NOT enforced by default for backward compatibility
 */

export const AudioMetadataSchema = z.object({
  audioType: z.enum(['bgm', 'sfx', 'narration']).optional(),
  loop: z.boolean().optional(),
  fadeIn: z.number().nonnegative().optional(),
  fadeOut: z.number().nonnegative().optional(),
  subtitle: z.string().optional(),
  language: z.string().optional(),
  speaker: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

export const ImageMetadataSchema = z.object({
  imageType: z.enum(['static', 'animated']).optional(),
  format: z.enum(['png', 'jpg', 'gif']).optional(),
  loop: z.boolean().optional(),
  frameRate: z.number().positive().optional(),
  description: z.string().optional(),
}).passthrough();

export const TextMetadataSchema = z.object({
  text: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  stroke: z.object({
    color: z.string(),
    width: z.number().positive(),
  }).optional(),
  shadow: z.object({
    color: z.string(),
    blur: z.number().nonnegative(),
    offsetX: z.number(),
    offsetY: z.number(),
  }).optional(),
  boxPadding: z.number().nonnegative().optional(),
}).passthrough();

export const SourceMetadataSchema = z.union([
  AudioMetadataSchema,
  ImageMetadataSchema,
  TextMetadataSchema,
]);

/**
 * Extended source schema (optional, for strict validation)
 */
export const ExtendedSourceSchema = z.object({
  type: z.enum(['video', 'audio', 'image', 'text']),
  file: z.string(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
  duration: z.number().nonnegative(),
  metadata: SourceMetadataSchema.optional(),
}).passthrough();

/**
 * Helper: Validate source metadata if present
 */
export function validateSourceMetadata(source: any): void {
  if (source.metadata) {
    SourceMetadataSchema.parse(source.metadata);
  }
}

/**
 * Helper: Validate all sources have valid metadata
 */
export function validateAllSourceMetadata(inputs: Record<string, any>): string[] {
  const warnings: string[] = [];

  for (const [inputId, source] of Object.entries(inputs)) {
    try {
      if (source.metadata) {
        validateSourceMetadata(source);
      }
    } catch (error) {
      warnings.push(`Source "${inputId}" has invalid metadata: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return warnings;
}
```

**要点**:
- ✅ 基础验证保持不变 (向后兼容)
- ✅ 新增详细验证 schemas 供插件使用
- ✅ 提供辅助函数验证 metadata

---

### Phase 3: 插件实现

**目标**: 通过插件处理新的 metadata 功能

#### 插件 1: `worker/src/plugins/metadata-validator.ts`

验证 metadata 格式

```typescript
import type { Plugin, PluginResult } from '../types';
import { validateAllSourceMetadata } from '../validation';

/**
 * Plugin: Validate metadata fields
 * This plugin validates extended metadata if present
 */
export const metadataValidatorPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  // Validate source metadata
  const metadataWarnings = validateAllSourceMetadata(timeline.inputs || {});
  warnings.push(...metadataWarnings);

  return {
    timeline,
    warnings,
  };
};
```

#### 插件 2: `worker/src/plugins/audio-category.ts`

处理音频分类 (BGM / SFX / Narration)

```typescript
import type { Plugin, PluginResult } from '../types';

/**
 * Plugin: Audio category processor
 * Processes audio metadata and applies defaults
 */
export const audioCategoryPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  // Process all inputs
  for (const [inputId, input] of Object.entries(timeline.inputs || {})) {
    const source = input as any;

    // Only process audio sources
    if (source.type !== 'audio') continue;

    const metadata = source.metadata;
    if (!metadata) continue;

    // Process BGM (Background Music)
    if (metadata.audioType === 'bgm') {
      // Add default loop if not specified
      if (metadata.loop === undefined) {
        metadata.loop = true;
        warnings.push(`BGM "${inputId}" automatically set to loop`);
      }

      // Add default fade in/out if not specified
      if (metadata.fadeIn === undefined) {
        metadata.fadeIn = 2;
      }
      if (metadata.fadeOut === undefined) {
        metadata.fadeOut = 3;
      }

      warnings.push(`BGM "${inputId}" processed: loop=${metadata.loop}, fadeIn=${metadata.fadeIn}s, fadeOut=${metadata.fadeOut}s`);
    }

    // Process SFX (Sound Effects)
    if (metadata.audioType === 'sfx') {
      // Validate duration for sound effects
      if (source.duration > 5) {
        warnings.push(`SFX "${inputId}" has long duration (${source.duration}s), consider shortening`);
      }

      warnings.push(`SFX "${inputId}" processed as sound effect`);
    }

    // Process Narration (Voice + Subtitle)
    if (metadata.audioType === 'narration') {
      // Validate subtitle presence
      if (!metadata.subtitle) {
        warnings.push(`Narration "${inputId}" missing subtitle text`);
      }

      // Set default language
      if (!metadata.language) {
        metadata.language = 'zh-CN';
        warnings.push(`Narration "${inputId}" language defaulted to zh-CN`);
      }

      warnings.push(`Narration "${inputId}" processed: subtitle="${metadata.subtitle?.substring(0, 20)}..."`);
    }
  }

  // Process clips and propagate metadata to clip level
  for (const [trackName, track] of Object.entries(timeline.tracks || {})) {
    const trackData = track as any;

    for (const clip of trackData.clips || []) {
      const sourceId = clip.source;
      const source = timeline.inputs?.[sourceId];

      if (!source?.metadata) continue;

      // Propagate source metadata to clip metadata
      if (!clip.metadata) {
        clip.metadata = {};
      }

      // Set clip role based on source audioType
      if (source.metadata.audioType && !clip.metadata.role) {
        clip.metadata.role = source.metadata.audioType;
      }

      // Adjust clip volume based on audio type
      if (source.metadata.audioType === 'bgm' && clip.volume === undefined) {
        clip.volume = 0.5; // BGM default lower volume
        warnings.push(`Clip "${clip.name}" volume set to 0.5 (BGM)`);
      }

      if (source.metadata.audioType === 'narration' && clip.volume === undefined) {
        clip.volume = 1.0; // Narration full volume
      }
    }
  }

  return {
    timeline,
    warnings,
  };
};
```

#### 插件 3: `worker/src/plugins/animated-image.ts`

处理 GIF 动画

```typescript
import type { Plugin, PluginResult } from '../types';

/**
 * Plugin: Animated image processor
 * Handles GIF animations
 */
export const animatedImagePlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  for (const [inputId, input] of Object.entries(timeline.inputs || {})) {
    const source = input as any;

    // Only process image sources
    if (source.type !== 'image') continue;

    const metadata = source.metadata;
    if (!metadata) continue;

    // Process animated images (GIFs)
    if (metadata.imageType === 'animated') {
      // Validate format
      if (metadata.format !== 'gif') {
        warnings.push(`Animated image "${inputId}" format is not GIF: ${metadata.format}`);
      }

      // Set default loop
      if (metadata.loop === undefined) {
        metadata.loop = true;
      }

      warnings.push(`Animated image "${inputId}" processed: format=${metadata.format}, loop=${metadata.loop}`);
    }
  }

  return {
    timeline,
    warnings,
  };
};
```

#### 插件 4: `worker/src/plugins/text-source.ts`

处理文本源

```typescript
import type { Plugin, PluginResult } from '../types';

/**
 * Plugin: Text source processor
 * Validates and processes text sources
 */
export const textSourcePlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  for (const [inputId, input] of Object.entries(timeline.inputs || {})) {
    const source = input as any;

    // Only process text sources
    if (source.type !== 'text') continue;

    const metadata = source.metadata;
    if (!metadata) {
      warnings.push(`Text source "${inputId}" missing metadata`);
      continue;
    }

    // Validate required text field
    if (!metadata.text) {
      throw new Error(`Text source "${inputId}" missing required field: text`);
    }

    // Set defaults
    if (!metadata.fontSize) {
      metadata.fontSize = 32;
    }

    if (!metadata.fontColor) {
      metadata.fontColor = '#FFFFFF';
    }

    if (!metadata.textAlign) {
      metadata.textAlign = 'center';
    }

    warnings.push(`Text source "${inputId}" processed: text="${metadata.text.substring(0, 30)}...", fontSize=${metadata.fontSize}`);
  }

  return {
    timeline,
    warnings,
  };
};
```

#### 插件 5: `worker/src/plugins/subtitle-generator.ts`

生成字幕 (基于旁白)

```typescript
import type { Plugin, PluginResult } from '../types';

/**
 * Plugin: Subtitle generator
 * Generates subtitle clips from narration audio
 */
export const subtitleGeneratorPlugin: Plugin = (timeline: any): PluginResult => {
  const warnings: string[] = [];

  // Find narration clips
  const narrationClips: any[] = [];

  for (const [trackName, track] of Object.entries(timeline.tracks || {})) {
    const trackData = track as any;

    for (const clip of trackData.clips || []) {
      const source = timeline.inputs?.[clip.source];

      if (source?.metadata?.audioType === 'narration') {
        narrationClips.push({
          clip,
          source,
          trackName,
        });
      }
    }
  }

  // Create subtitle track if narrations exist
  if (narrationClips.length > 0) {
    const subtitleTrackName = 'auto_generated_subtitle_track';

    // Check if subtitle track already exists
    if (timeline.tracks[subtitleTrackName]) {
      warnings.push(`Subtitle track "${subtitleTrackName}" already exists, skipping auto-generation`);
      return { timeline, warnings };
    }

    // Create new subtitle track
    timeline.tracks[subtitleTrackName] = {
      type: 'video',
      clips: [],
    };

    // Generate subtitle clips for each narration
    for (const { clip, source } of narrationClips) {
      const subtitle = source.metadata.subtitle;
      if (!subtitle) continue;

      // Create text source for subtitle
      const subtitleSourceId = `auto_subtitle_${clip.name}`;

      timeline.inputs[subtitleSourceId] = {
        type: 'text',
        file: '',
        hasAudio: false,
        hasVideo: true,
        duration: 0,
        metadata: {
          text: subtitle,
          fontSize: 32,
          fontColor: '#FFFFFF',
          backgroundColor: '#000000CC',
          textAlign: 'center',
          boxPadding: 15,
        },
      };

      // Create subtitle clip
      const subtitleClip = {
        name: `subtitle_${clip.name}`,
        source: subtitleSourceId,
        timelineTrackStart: clip.timelineTrackStart,
        duration: clip.duration,
        sourceStartOffset: 0,
        clipType: 'text',
        transform: {
          x: 960,  // Center horizontally (1920/2)
          y: 950,  // Bottom position
          width: 1600,
          height: 80,
          rotation: 0,
          opacity: 0.95,
        },
        metadata: {
          syncWithAudio: clip.name,
          subtitlePosition: clip.metadata?.subtitlePosition || 'bottom',
        },
      };

      timeline.tracks[subtitleTrackName].clips.push(subtitleClip);

      warnings.push(`Generated subtitle for narration "${clip.name}": "${subtitle.substring(0, 30)}..."`);
    }

    warnings.push(`Created subtitle track with ${narrationClips.length} subtitle(s)`);
  }

  return {
    timeline,
    warnings,
  };
};
```

---

### Phase 4: 插件注册

#### 文件: `worker/src/plugins/index.ts`

```typescript
// Export all plugins
export { normalizeOutputPlugin } from './normalize-output';
export { validateTracksPlugin } from './validate-tracks';

// New plugins
export { metadataValidatorPlugin } from './metadata-validator';
export { audioCategoryPlugin } from './audio-category';
export { animatedImagePlugin } from './animated-image';
export { textSourcePlugin } from './text-source';
export { subtitleGeneratorPlugin } from './subtitle-generator';
```

#### 文件: `worker/src/index.ts`

修改插件注册顺序:

```typescript
import {
  validateTracksPlugin,
  normalizeOutputPlugin,
  metadataValidatorPlugin,
  audioCategoryPlugin,
  animatedImagePlugin,
  textSourcePlugin,
  subtitleGeneratorPlugin,
} from './plugins';

function createPluginManager(): PluginManager {
  const manager = new PluginManager();

  // Phase 1: Basic validation
  manager.register(validateTracksPlugin);

  // Phase 2: Metadata validation (optional, warns only)
  manager.register(metadataValidatorPlugin);

  // Phase 3: Metadata processing
  manager.register(audioCategoryPlugin);      // Process audio categories
  manager.register(animatedImagePlugin);      // Process GIFs
  manager.register(textSourcePlugin);         // Process text sources

  // Phase 4: Advanced features
  manager.register(subtitleGeneratorPlugin);  // Generate subtitles

  // Phase 5: Output normalization
  manager.register(normalizeOutputPlugin);    // Add output defaults

  return manager;
}
```

**插件执行顺序**:
1. ✅ 验证基础结构
2. ✅ 验证 metadata 格式
3. ✅ 处理音频分类
4. ✅ 处理动画图片
5. ✅ 处理文本源
6. ✅ 生成字幕
7. ✅ 规范化输出

---

### Phase 5: 测试策略

#### 测试文件: `worker/test/extended-features.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseSchema } from 'json-to-ffmpeg';

// Import test timelines
import simpleTimeline from './fixtures/simple-timeline.json';
import complexTimeline from './fixtures/complex-timeline.json';
import extendedTimeline from './fixtures/complex-timeline-extended.json';

describe('Extended JSON format support', () => {
  it('should handle old format (backward compatibility)', () => {
    const command = parseSchema(simpleTimeline);
    expect(command).toBeTruthy();
    expect(command).toContain('ffmpeg');
  });

  it('should handle complex old format', () => {
    const command = parseSchema(complexTimeline);
    expect(command).toBeTruthy();
    expect(command).toContain('ffmpeg');
  });

  it('should handle new extended format with metadata', () => {
    const command = parseSchema(extendedTimeline);
    expect(command).toBeTruthy();
    expect(command).toContain('ffmpeg');
  });

  it('should handle BGM metadata', () => {
    const timeline = {
      ...simpleTimeline,
      inputs: {
        bgm: {
          type: 'audio',
          file: 'music.mp3',
          hasAudio: true,
          hasVideo: false,
          duration: 180,
          metadata: {
            audioType: 'bgm',
            loop: true,
            fadeIn: 2,
            fadeOut: 3,
          },
        },
      },
    };

    const command = parseSchema(timeline);
    expect(command).toBeTruthy();
  });

  it('should handle text sources', () => {
    const timeline = {
      ...simpleTimeline,
      inputs: {
        title: {
          type: 'text',
          file: '',
          hasAudio: false,
          hasVideo: true,
          duration: 0,
          metadata: {
            text: 'Hello World',
            fontSize: 72,
            fontColor: '#FFFFFF',
          },
        },
      },
    };

    const command = parseSchema(timeline);
    expect(command).toBeTruthy();
  });
});
```

---

## 📋 实施清单

### ✅ 修改文件清单

| 文件 | 修改类型 | 优先级 |
|------|---------|--------|
| `worker/src/types.ts` | ➕ 新增类型定义 | P0 |
| `worker/src/validation.ts` | ➕ 新增详细验证 | P0 |
| `worker/src/plugins/metadata-validator.ts` | ➕ 新文件 | P1 |
| `worker/src/plugins/audio-category.ts` | ➕ 新文件 | P1 |
| `worker/src/plugins/animated-image.ts` | ➕ 新文件 | P1 |
| `worker/src/plugins/text-source.ts` | ➕ 新文件 | P1 |
| `worker/src/plugins/subtitle-generator.ts` | ➕ 新文件 | P2 |
| `worker/src/plugins/index.ts` | ✏️ 添加导出 | P1 |
| `worker/src/index.ts` | ✏️ 注册插件 | P1 |
| `worker/test/extended-features.test.ts` | ➕ 新文件 | P2 |

### 📊 实施阶段

#### Stage 1: 类型基础 (1-2天)
- [ ] 扩展 `types.ts` 添加类型定义
- [ ] 扩展 `validation.ts` 添加验证 schemas
- [ ] 测试向后兼容性

#### Stage 2: 基础插件 (2-3天)
- [ ] 实现 `metadata-validator.ts`
- [ ] 实现 `audio-category.ts`
- [ ] 实现 `animated-image.ts`
- [ ] 实现 `text-source.ts`
- [ ] 注册插件并测试

#### Stage 3: 高级功能 (2-3天)
- [ ] 实现 `subtitle-generator.ts`
- [ ] 完善插件逻辑
- [ ] 添加测试用例

#### Stage 4: 测试和文档 (1-2天)
- [ ] 编写完整测试
- [ ] 更新 README
- [ ] 添加示例 JSON
- [ ] 部署测试

---

## 🎯 关键设计决策

### 1. 为什么不修改验证层?

**原因**: 保持向后兼容

- ✅ 基础验证保持宽松 (`z.any()`)
- ✅ 插件负责详细验证
- ✅ 老 JSON 无需修改即可工作

### 2. 为什么使用插件而不是修改核心代码?

**原因**:
- ✅ 职责分离 (Worker 层不修改 FFmpeg 生成逻辑)
- ✅ 易于扩展 (新功能 = 新插件)
- ✅ 易于测试 (插件独立测试)
- ✅ 向后兼容 (插件可以禁用)

### 3. 为什么插件顺序重要?

**原因**: 插件之间有依赖

1. 先验证 → 确保数据有效
2. 再处理 → 添加默认值
3. 最后生成 → 创建衍生内容 (字幕)

### 4. 为什么类型定义这么详细但验证宽松?

**原因**: 平衡类型安全和灵活性

- ✅ TypeScript 类型 → 开发时类型安全
- ✅ Zod 验证宽松 → 运行时灵活
- ✅ 插件警告 → 引导用户但不强制

---

## 📝 示例: 完整的 API 调用流程

### 输入 (新格式)

```bash
curl -X POST http://localhost:8787/build -d '{
  "version": 1,
  "inputs": {
    "bgm": {
      "type": "audio",
      "file": "music.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 180,
      "metadata": {
        "audioType": "bgm",
        "loop": true
      }
    },
    "voice": {
      "type": "audio",
      "file": "voice.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 5,
      "metadata": {
        "audioType": "narration",
        "subtitle": "这是旁白字幕"
      }
    },
    "title": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "视频标题",
        "fontSize": 72
      }
    }
  },
  "tracks": { ... },
  "output": { ... }
}'
```

### 处理流程

1. **基础验证** → `validateTracksPlugin`
2. **Metadata 验证** → `metadataValidatorPlugin`
3. **音频处理** → `audioCategoryPlugin`
   - BGM 设置 loop=true, fadeIn=2, fadeOut=3
   - Narration 检查 subtitle 存在
4. **文本处理** → `textSourcePlugin`
   - 设置默认 fontSize, fontColor, textAlign
5. **字幕生成** → `subtitleGeneratorPlugin`
   - 为旁白自动生成字幕 clip
6. **输出规范化** → `normalizeOutputPlugin`

### 输出 (API 响应)

```json
{
  "command": "#!/bin/bash\n...",
  "args": ["-y", "-i", ...],
  "warnings": [
    "BGM \"bgm\" automatically set to loop",
    "BGM \"bgm\" processed: loop=true, fadeIn=2s, fadeOut=3s",
    "Narration \"voice\" language defaulted to zh-CN",
    "Narration \"voice\" processed: subtitle=\"这是旁白字幕\"",
    "Text source \"title\" processed: text=\"视频标题\", fontSize=72",
    "Generated subtitle for narration \"voice_clip\": \"这是旁白字幕\"",
    "Created subtitle track with 1 subtitle(s)"
  ]
}
```

---

## 🎉 总结

这个设计方案通过 **插件系统** 实现了:

1. ✅ **100% 向后兼容** - 老 JSON 格式不受影响
2. ✅ **渐进式增强** - 新功能通过插件添加
3. ✅ **职责清晰** - Worker 层不修改 FFmpeg 生成逻辑
4. ✅ **易于扩展** - 新功能 = 新插件
5. ✅ **类型安全** - TypeScript 类型定义完整
6. ✅ **灵活验证** - 基础宽松,插件严格

**下一步**: 开始实施 Stage 1 (类型基础) 🚀
