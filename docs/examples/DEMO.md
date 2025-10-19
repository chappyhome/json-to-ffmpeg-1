# 演示: JSON Timeline → FFmpeg 命令

## ✅ 是的,完全可以实现!

这个项目**已经实现**了你想要的功能:

**输入**: JSON timeline 文件 (如 `worker/test/fixtures/simple-timeline.json`)
**输出**: 可直接在命令行执行的 FFmpeg 命令字符串

---

## 🎯 方案一: 直接使用 Node.js (无需 Worker)

### 使用核心库生成命令

```bash
# 运行演示脚本
node scripts/demo-generate-command.js worker/test/fixtures/simple-timeline.json

# 输出到文件
node scripts/demo-generate-command.js worker/test/fixtures/simple-timeline.json > output.sh

# 直接执行
bash output.sh
```

### 输出示例

```bash
#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 27 -t 5 -r 30 ./tmp/clip4.mp4
ffmpeg -y -i samples/book1920.mp4 -ss 0 -t 5 -r 30 ./tmp/clip5.mp4
ffmpeg -y \
-i ./tmp/clip4.mp4 \
-i ./tmp/clip5.mp4 \
-filter_complex "color=c=black:s=384x216:d=8[base];
color=black@0.0:s=384x216:d=5[QGWFN9b4_base];
[0:v]scale=384:216,format=rgba,colorchannelmixer=aa=1[vqUV2OLd_clip];
...省略...
[base][track_with_some_videos]overlay=0:0[video_output];
anullsrc=channel_layout=stereo:sample_rate=44100:d=8[audio_output];" \
-map '[video_output]' -map '[audio_output]' -c:v libx264 -c:a aac -b:a 320k -r 30 -s 384x216 -ss 0 -t 8 -crf 23 -preset veryfast -pix_fmt yuv420p output.mp4
```

✅ **这个输出可以直接复制到命令行执行!**

---

## 🌐 方案二: 使用 Cloudflare Worker API

### 1. 启动 Worker

```bash
cd worker
npm install
npm run dev
```

Worker 会在 `http://localhost:8787` 启动

### 2. 调用 API 生成命令

#### 方式 A: 使用提供的脚本

```bash
# 提取命令到文件
cd worker
./examples/extract-command.sh test/fixtures/simple-timeline.json output.sh

# 执行生成的命令
bash output.sh
```

#### 方式 B: 使用 curl

```bash
# POST JSON, 获取 FFmpeg 命令
curl -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @worker/test/fixtures/simple-timeline.json

# 或者使用 jq 提取 command 字段
curl -s -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @worker/test/fixtures/simple-timeline.json \
  | jq -r '.command' > output.sh

# 执行
bash output.sh
```

### 3. API 响应格式

```json
{
  "command": "#!/bin/bash\nmkdir -p ./tmp\nffmpeg -y ...",
  "args": ["-y", "-i", "samples/bee1920.mp4", ...],
  "warnings": []
}
```

- **`command`**: 完整的 shell 脚本字符串 (可直接执行)
- **`args`**: FFmpeg 参数数组 (用于程序化调用)
- **`warnings`**: 可选的警告信息

---

## 📋 完整的工作流程示例

### 步骤 1: 准备 JSON 时间线

[worker/test/fixtures/simple-timeline.json](../../worker/test/fixtures/simple-timeline.json):

```json
{
  "version": 1,
  "inputs": {
    "source1": {
      "type": "video",
      "file": "samples/bee1920.mp4",
      "duration": 40
    }
  },
  "tracks": {
    "track_with_some_videos": {
      "type": "video",
      "clips": [...]
    }
  },
  "transitions": [...],
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080
  }
}
```

### 步骤 2: 生成 FFmpeg 命令

```bash
# 使用 Node.js
node scripts/demo-generate-command.js worker/test/fixtures/simple-timeline.json > output.sh

# 或使用 Worker API
curl -s -X POST http://localhost:8787/build \
  -d @worker/test/fixtures/simple-timeline.json \
  | jq -r '.command' > output.sh
```

### 步骤 3: 执行命令

```bash
bash output.sh
```

输出: `output.mp4` 视频文件

---

## 🔧 API 端点

### POST /build

生成 FFmpeg 命令

**请求**:
- Body: JSON timeline (application/json)

**响应**:
```json
{
  "command": "string (shell script)",
  "args": ["array", "of", "arguments"],
  "warnings": ["optional", "warnings"]
}
```

### GET /version

获取版本信息

**响应**:
```json
{
  "workerVersion": "1.0.0",
  "libraryVersion": "1.2.3"
}
```

### GET /health

健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-06-20T12:00:00.000Z"
}
```

---

## 💡 使用场景

### 1. 本地命令生成 (无需 Worker)

```bash
# 直接使用 Node.js 库
node scripts/demo-generate-command.js timeline.json | bash
```

适合:
- 本地开发测试
- CI/CD 流水线
- 批量视频处理脚本

### 2. Web API 服务 (使用 Worker)

```bash
# 启动 API 服务
cd worker && npm run dev

# 通过 HTTP 调用
curl -X POST http://localhost:8787/build -d @timeline.json
```

适合:
- Web 应用后端
- 微服务架构
- Serverless 部署
- 多语言客户端调用

### 3. 部署到 Cloudflare

```bash
# 部署到生产环境
cd worker
npm run deploy

# 使用生产 URL
curl -X POST https://your-worker.workers.dev/build -d @timeline.json
```

---

## 📊 测试文件

项目包含两个测试文件:

1. **simple-timeline.json** - 简单场景
   - 2 个视频剪辑
   - 1 个淡入淡出过渡
   - 输出: 8 秒视频

2. **complex-timeline.json** - 复杂场景
   - 8 个视频剪辑
   - 2 个音频轨道
   - 1 个水印图片
   - 9 个过渡效果
   - 输出: 38 秒视频

---

## ✨ 核心优势

1. **两种输出格式**:
   - Shell 字符串: 便于人类阅读和调试
   - 参数数组: 便于编程调用 (避免 shell 注入)

2. **无 FFmpeg 依赖**:
   - 库只生成命令,不执行
   - 可在任何环境运行 (包括浏览器)

3. **灵活的部署方式**:
   - 本地 Node.js 脚本
   - HTTP API 服务
   - Cloudflare Workers (Serverless)

4. **可扩展的插件系统**:
   - 验证输入
   - 转换时间线
   - 添加默认值

---

## 🎬 结论

✅ **完全可以实现你的需求!**

- **输入**: `worker/test/fixtures/simple-timeline.json`
- **输出**: 可在命令行直接执行的 FFmpeg 命令字符串
- **方式**:
  1. 直接使用 Node.js 脚本 (更简单)
  2. 通过 Cloudflare Worker API (更灵活)

两种方式都已经实现并经过测试! 🎉

