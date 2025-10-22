# JSON-to-FFmpeg Worker API 文档

基础地址: https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev

本服务接收“时间线 JSON（Timeline）”，返回一条可执行的 ffmpeg 命令字符串和等价的参数数组（args）。已启用 CORS，可直接从浏览器调用。

## 基本信息

- 认证: 无（开放接口）
- CORS: 已启用（支持 OPTIONS 预检；允许 `GET, POST, OPTIONS`）
- 返回格式: `application/json`
- 常用响应头: `Access-Control-Allow-Origin: *`

## 接口一览

- GET `/health`
  - 用途: 健康检查
  - 成功 200 响应示例: `{ "status": "ok", "timestamp": "2025-10-22T04:30:12.345Z" }`

- GET `/version`
  - 用途: 返回 Worker 与核心库版本
  - 成功 200 响应示例: `{ "workerVersion": "1.0.0", "libraryVersion": "1.2.3" }`

- POST `/build`
  - 用途: 根据 Timeline 生成 ffmpeg 命令
  - 请求头: `Content-Type: application/json`
  - 请求体: Timeline JSON（见下文“Timeline 结构”）
  - 成功 200 响应字段:
    - `command`: string，可直接保存为 `*.sh` 执行（包含续行符）
    - `args`: string[]，可用于 `spawn('ffmpeg', args)`
    - `warnings?`: string[]，可选，默认值注入/校验提示
  - 失败 400 响应字段:
    - `error`: string，错误信息
    - `message`: string，固定为 `Failed to build FFmpeg command`

## 调用示例

### curl（最小示例）

```bash
curl -s -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/build \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json
```

### 保存并执行返回命令（macOS/Linux）

```bash
curl -s -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/build \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json \
  | jq -r '.command' > run.sh

chmod +x run.sh
bash run.sh
```

### 浏览器 fetch（跨域可用）

```js
const resp = await fetch(
  'https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/build',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timeline),
  }
);
const data = await resp.json();
console.log(data.command, data.args);
```

### Node 执行 ffmpeg（使用 args）

```js
const { spawn } = require('node:child_process');
// 假设 data 为 /build 返回体
const p = spawn('ffmpeg', data.args, { stdio: 'inherit' });
p.on('exit', (code) => console.log('ffmpeg exit', code));
```

## 最小可用 Timeline 示例

说明: 1 段视频轨，5 秒输出。

```json
{
  "version": 1,
  "inputs": {
    "main": {
      "type": "video",
      "file": "samples/bee1920.mp4",
      "hasVideo": true,
      "hasAudio": false,
      "duration": 20
    }
  },
  "tracks": {
    "video_track": {
      "type": "video",
      "clips": [
        {
          "name": "main_video_clip",
          "source": "main",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080, "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "transitions": [],
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5,
    "flags": ["-pix_fmt","yuv420p"]
  }
}
```

## 综合示例（PNG/GIF、BGM/Narration/SFX、软字幕）

要点: 图片/动图直接作为输入（GIF 用 `-ignore_loop` 控制）；BGM 支持 loop/淡入/淡出；Narration 支持软字幕（URL 或本地 .srt）。

```json
{
  "version": 1,
  "inputs": {
    "main": { "type": "video", "file": "samples/bee1920.mp4", "hasVideo": true, "hasAudio": false, "duration": 20 },
    "bgm_audio": { "type": "audio", "file": "samples/ever.mp3", "hasAudio": true, "hasVideo": false, "duration": 180,
      "metadata": { "audioType": "bgm", "loop": true, "fadeIn": 2, "fadeOut": 2 } },
    "narration_voice": { "type": "audio", "file": "samples/narration-zh.mp3", "hasAudio": true, "hasVideo": false, "duration": 10,
      "metadata": { "audioType": "narration", "subtitleUrl": "https://example.com/subs.srt", "language": "zh" } },
    "static_image": { "type": "image", "file": "samples/logo.png", "hasVideo": true, "hasAudio": false,
      "metadata": { "imageType": "static" } },
    "animated_gif": { "type": "image", "file": "samples/loading.gif", "hasVideo": true, "hasAudio": false,
      "metadata": { "imageType": "animated", "loop": true, "frameRate": 10 } }
  },
  "tracks": {
    "video_track": { "type": "video", "clips": [
      { "name": "main_video_clip", "source": "main", "timelineTrackStart": 0, "duration": 20, "sourceStartOffset": 0, "clipType": "video",
        "transform": { "x": 0, "y": 0, "width": 1920, "height": 1080, "rotation": 0, "opacity": 1 } }
    ] },
    "overlay_track_1": { "type": "video", "clips": [
      { "name": "static_image_clip", "source": "static_image", "timelineTrackStart": 5, "duration": 3, "sourceStartOffset": 0, "clipType": "image",
        "transform": { "x": 50, "y": 50, "width": 300, "height": 300, "rotation": 0, "opacity": 0.8 } },
      { "name": "animated_gif_clip", "source": "animated_gif", "timelineTrackStart": 9, "duration": 3, "sourceStartOffset": 0, "clipType": "image",
        "transform": { "x": 1570, "y": 50, "width": 300, "height": 300, "rotation": 0, "opacity": 1 } }
    ] },
    "bgm_track": { "type": "audio", "clips": [
      { "name": "bgm_clip", "source": "bgm_audio", "timelineTrackStart": 0, "duration": 20, "sourceStartOffset": 0, "clipType": "audio", "volume": 0.3 }
    ] },
    "narration_track": { "type": "audio", "clips": [
      { "name": "narration_clip", "source": "narration_voice", "timelineTrackStart": 2, "duration": 10, "sourceStartOffset": 0, "clipType": "audio", "volume": 1.0 }
    ] },
    "sfx_track": { "type": "audio", "clips": [
      { "name": "click_sfx_1", "source": "click", "timelineTrackStart": 1, "duration": 0.3, "sourceStartOffset": 0, "clipType": "audio", "volume": 0.8 }
    ] }
  },
  "transitions": [],
  "output": { "file": "output-comprehensive-test.mp4", "width": 1920, "height": 1080, "framerate": 30, "startPosition": 0, "endPosition": 20, "flags": ["-pix_fmt","yuv420p"] }
}
```

## Timeline 结构说明

顶层字段:

- `version`: number，必须为 1
- `inputs`: 资源池（键值对：name → input）
- `tracks`: 轨道集合（键值对：trackName → track）
- `output`: 输出配置（见下）
- `transitions?`: 可选，视频转场列表

input（常见字段）:

- `type`: `"video" | "audio" | "image" | "text"`
- `file`: 路径或 URL（软字幕支持 URL）
- `hasVideo` / `hasAudio` / `duration`: 元数据（可选）
- `metadata`（按类型）:
  - image: `{ imageType: "static" | "animated", loop?: boolean, frameRate?: number }`
  - audio(bgm): `{ audioType: "bgm", loop?: boolean, fadeIn?: number, fadeOut?: number }`
  - audio(sfx): `{ audioType: "sfx", fadeIn?: number, fadeOut?: number }`
  - audio(narration): `{ audioType: "narration", subtitleFile?: string, subtitleUrl?: string, language?: string }`
  - text: 文本内容与样式（由服务生成 drawtext 滤镜）

track:

- `type`: `"video" | "audio"`
- `clips`: clip[]

clip（共通）:

- `name`: 唯一标签名（用于滤镜拼接）
- `source`: inputs 中的键
- `timelineTrackStart`: 在轨道上的起点秒
- `duration`: 持续秒
- `sourceStartOffset`: 源起始偏移秒
- `clipType`: `"video" | "image" | "audio" | "text"`
- `transform`（视频/图片/文本）: `{ x, y, width, height, rotation, opacity }`
- `volume`（音频）: 0–1

output:

- 必填: `file`, `width`, `height`, `framerate`
- 推荐: `startPosition`, `endPosition`（渲染时间窗）
- 可选: `flags`（如 `["-pix_fmt","yuv420p"]`）, `videoCodec`, `audioCodec`, `audioBitrate`, `preset`, `crf`
- 默认: 若缺省将注入合理默认值；缺少 `endPosition` 会在 `warnings` 中提示

## 行为与约束

- 单条 ffmpeg 命令：不进行 tmp 预处理；直接将 inputs 作为 ffmpeg 输入（视频通过 `trim+setpts` 裁剪）。
- 图片/GIF：
  - 静态图：使用 `loop + fps` 延长至 clip.duration
  - GIF：通过 `-ignore_loop 0/1` 控制循环，配合 `fps/trim/setpts`
- 音频：
  - BGM：支持循环、淡入/淡出、音量
  - SFX：使用静音拼接与 `amix` 精确对齐时间轴
  - Narration：与软字幕分离；字幕作为独立流（mp4=mov_text），自动注入语言元数据
- 软字幕：
  - 支持 URL 或本地 .srt；样式由播放器控制（不硬编码 `force_style`）

## 错误与告警

- 400 常见原因：
  - 缺失 `tracks`/`clips`/`type` 或输出关键字段
  - `version` 非 1 或 JSON 结构非法
- `warnings`：默认值注入或不寻常配置提示（例如缺少 `endPosition`）。

## 建议与限制

- 本服务仅生成命令，不执行 ffmpeg；资源可达性与执行环境由调用方保障。
- URL 资源（如字幕）由 ffmpeg 在执行阶段获取，请确保可访问性与权限。
- 输出容器影响字幕编码（mp4 使用 `mov_text`）。
- 为提升可靠性，生产环境建议使用 `args` 方式执行，避免 shell 续行与转义问题。

