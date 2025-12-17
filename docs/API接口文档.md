# JSON-to-FFmpeg API 接口文档

本文档详细描述了 `json-to-ffmpeg` Worker 提供的所有 HTTP API 接口。

## 基础信息

**Base URL**: `https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev` (开发环境)  
**Content-Type**: `application/json`  
**CORS**: 已启用

---

## 1. 一键成片接口

### `POST /one-click/build`

根据脚本批量生成视频时间轴和 FFmpeg 命令。支持一次性传入多个脚本，共享同一套素材库和配置，生成多个独立的视频。

#### 请求参数

```typescript
{
  "scripts": ScriptSegment[][],  // 必填：脚本数组，每个脚本是一个片段数组
  "assets": OneClickAsset[],     // 必填：可用素材库
  "config": OneClickConfig,      // 必填：全局视频配置
  "bgm"?: BGMConfig              // 可选：背景音乐配置
}
```

##### ScriptSegment（脚本片段）

```typescript
{
  "text": string,              // 必填：字幕文本
  "duration"?: number,         // 可选：片段时长（秒），默认 3
  "keywords"?: string[],       // 可选：关键词，用于素材匹配
  "voiceoverFile"?: string     // 可选：旁白音频文件 URL
}
```

##### OneClickAsset（素材）

```typescript
{
  "id": string,               // 必填：素材唯一ID
  "url": string,              // 必填：素材文件 URL
  "type": "video" | "image",  // 必填：素材类型
  "tags": string[],           // 必填：素材标签，用于匹配
  "duration": number          // 必填：素材时长（秒），图片可设为 0
}
```

##### OneClickConfig（全局配置）

```typescript
{
  "width": number,            // 必填：视频宽度
  "height": number,           // 必填：视频高度
  "framerate"?: number        // 可选：帧率，默认 30
}
```

##### BGMConfig（背景音乐配置）

```typescript
{
  "url": string,              // 必填：BGM 文件 URL
  "loop"?: boolean,           // 可选：是否循环，默认 false
  "volume"?: number           // 可选：音量（0-1），默认 0.5
}
```

#### 请求示例

```json
{
  "scripts": [
    [
      { 
        "text": "欢迎来到大自然", 
        "keywords": ["nature", "forest"], 
        "duration": 5 
      },
      { 
        "text": "感受森林的美", 
        "keywords": ["forest"], 
        "duration": 4 
      }
    ],
    [
      { 
        "text": "城市的夜晚", 
        "keywords": ["city", "night"], 
        "duration": 6 
      }
    ]
  ],
  "assets": [
    {
      "id": "forest_1",
      "url": "https://example.com/forest.mp4",
      "type": "video",
      "tags": ["nature", "forest", "tree"],
      "duration": 15
    },
    {
      "id": "city_night",
      "url": "https://example.com/city_night.mp4",
      "type": "video",
      "tags": ["city", "night", "urban"],
      "duration": 20
    }
  ],
  "config": {
    "width": 1920,
    "height": 1080,
    "framerate": 30
  },
  "bgm": {
    "url": "https://example.com/bgm.mp3",
    "loop": true,
    "volume": 0.3
  }
}
```

#### 响应格式

```typescript
{
  "ok": boolean,              // 操作是否成功
  "results": Array<{
    "index": number,          // 脚本索引
    "timeline": VideoEditorFormat,  // 生成的视频时间轴 JSON
    "validation": {
      "valid": boolean,       // 时间轴是否有效
      "warnings": string[]    // 警告信息
    },
    "command": string,        // Shell 格式的 FFmpeg 命令
    "args": string[]          // 数组格式的 FFmpeg 参数
  }>
}
```

#### 响应示例

```json
{
  "ok": true,
  "results": [
    {
      "index": 0,
      "timeline": {
        "version": 1,
        "inputs": { ... },
        "tracks": { ... },
        "output": {
          "file": "one-click-output-1.mp4",
          "width": 1920,
          "height": 1080,
          ...
        }
      },
      "validation": {
        "valid": true,
        "warnings": []
      },
      "command": "ffmpeg -y ...",
      "args": ["-y", "-i", "...", ...]
    },
    {
      "index": 1,
      ...
    }
  ]
}
```

#### 素材匹配逻辑

系统会根据 `keywords` 和 `tags` 的匹配度自动选择最合适的素材：
1. 优先选择标签匹配度最高的素材
2. 避免重复使用相同素材（会降低评分）
3. 若无匹配，随机选择未使用的素材

---

## 2. 混合剪辑接口（分发构建）

### `POST /distribute/build`

从素材清单中自动分发生成多个视频时间轴和 FFmpeg 命令。支持多种组合模式。

#### 请求参数

```typescript
{
  "main_videos": Asset[],         // 必填：主视频素材数组
  "auxiliary_videos"?: Asset[],   // 可选：辅助视频素材
  "stickers"?: Asset[],           // 可选：贴纸素材
  "sound_effects"?: Asset[],      // 可选：音效素材
  "voiceovers"?: Asset[],         // 可选：旁白素材
  "bgm"?: Asset[],                // 可选：背景音乐素材
  "config": {
    "width": number,              // 必填：视频宽度
    "height": number,             // 必填：视频高度
    "framerate"?: number,         // 可选：帧率，默认 30
    "duration"?: number           // 可选：总时长（秒）
  },
  "overrides"?: {
    "combineMode"?: "single" | "pair" | "all",  // 可选：组合模式
    "strictNoSplit"?: boolean,    // 可选：主视频是否禁止切割
    "numOutputs"?: number         // 可选：生成视频数量
  }
}
```

##### Asset（素材）

```typescript
{
  "url": string,                  // 必填：素材文件 URL
  "type": string,                 // 必填：素材类型标识
  "duration"?: number,            // 可选：时长（秒）
  "metadata"?: {                  // 可选：元数据
    "text"?: string,              // 文字内容（文本素材）
    "volume"?: number,            // 音量（音频素材）
    "loop"?: boolean,             // 是否循环
    ...                           // 其他自定义属性
  }
}
```

##### 组合模式说明

- **`single`**: 每个主视频独立生成一个输出
- **`pair`**: 两个主视频配对生成一个输出  
- **`all`**: 所有主视频合并成一个输出

#### 请求示例

```json
{
  "main_videos": [
    {
      "url": "https://example.com/video1.mp4",
      "type": "main",
      "duration": 10
    },
    {
      "url": "https://example.com/video2.mp4",
      "type": "main",
      "duration": 8
    }
  ],
  "stickers": [
    {
      "url": "https://example.com/emoji.gif",
      "type": "sticker"
    }
  ],
  "config": {
    "width": 1920,
    "height": 1080,
    "framerate": 30
  },
  "overrides": {
    "combineMode": "pair",
    "strictNoSplit": true
  }
}
```

#### 响应格式

```typescript
{
  "ok": boolean,
  "outputs": Array<{
    "variantKey": string,         // 变体标识
    "timeline": VideoEditorFormat, // 时间轴 JSON
    "validation": {
      "valid": boolean,
      "warnings": string[]
    },
    "command": string,            // FFmpeg 命令（Shell 格式）
    "args": string[]              // FFmpeg 参数（数组格式）
  }>
}
```

---

## 3. 其他接口

### `POST /build`

从完整的 `VideoEditorFormat` JSON 生成 FFmpeg 命令。

**请求体**: `VideoEditorFormat` JSON 对象  
**响应**: 包含 `command` 和 `args` 的 JSON

### `POST /validate`

验证 `VideoEditorFormat` JSON 的有效性。

**请求体**: `VideoEditorFormat` JSON 对象  
**响应**: 验证结果

### `POST /distribute`

仅执行素材分发逻辑，不生成 FFmpeg 命令。

**请求体**: 同 `/distribute/build`  
**响应**: 包含分发后的时间轴 JSON 数组

### `GET /version`

获取版本信息。

**响应**:
```json
{
  "version": "1.2.3",
  "build": "2024-06-01"
}
```

### `GET /health`

健康检查。

**响应**:
```json
{
  "status": "ok"
}
```

---

## 错误处理

所有接口在发生错误时返回以下格式：

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

常见错误码：
- `INVALID_SCHEMA`: JSON Schema 验证失败
- `GENERATION_ERROR`: 时间轴生成失败
- `VALIDATION_ERROR`: 时间轴验证失败

---

## 测试工具

### 使用 curl 测试

```bash
curl -X POST https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/one-click/build \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/batch-input.json
```

### 使用 Node.js 测试

```bash
node tests/test-api-live.js [input-file.json]
```

---

## 附录：VideoEditorFormat 规范

详细的 `VideoEditorFormat` JSON 规范请参考项目文档 [语法规则.md](./语法规则.md)。
