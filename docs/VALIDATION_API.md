# Timeline JSON 验证 API 文档

## 概述

本项目提供了完整的 Timeline JSON 验证功能，包括：
1. **完整的 Zod Schema 验证** - 严格的类型和格式检查
2. **业务逻辑验证** - clip name 唯一性、引用完整性等
3. **友好的错误提示** - 精确定位错误位置和原因
4. **警告系统** - 提示缺少的可选字段

## API 接口

### POST /validate

验证 Timeline JSON 格式，不生成 FFmpeg 命令。

**请求:**
```bash
POST https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate
Content-Type: application/json

{
  "version": 1,
  "inputs": {...},
  "tracks": {...},
  "output": {...},
  "transitions": [...]
}
```

**响应（验证通过）:**
```json
{
  "valid": true,
  "message": "Timeline JSON 验证通过",
  "warnings": [
    "未指定 output.tempDir，将使用默认值",
    "未定义任何转场效果"
  ]
}
```

**响应（验证失败）:**
```json
{
  "valid": false,
  "message": "Timeline JSON 验证失败",
  "errors": [
    {
      "path": "tracks.track1.clips[1].name",
      "message": "clip name \"clip1\" 重复，必须全局唯一",
      "code": "DUPLICATE_CLIP_NAME"
    },
    {
      "path": "tracks.track1.clips[0].source",
      "message": "source \"video2\" 不存在于 inputs 中",
      "code": "SOURCE_NOT_FOUND"
    }
  ]
}
```

## 验证规则

### 1. 顶层结构验证
- ✅ 必须包含 `version`, `inputs`, `tracks`, `output`
- ✅ `version` 必须等于 `1`
- ✅ `transitions` 可选，但如果存在必须是数组

### 2. Inputs 验证
- ✅ 每个 input 必须有 `type`, `file`, `hasAudio`, `hasVideo`, `duration`
- ✅ `hasAudio/hasVideo` 必须与 `type` 对应
  - video: `hasVideo=true`
  - audio: `hasAudio=true, hasVideo=false`
  - image/text: `hasVideo=true, hasAudio=false`
- ✅ text 类型必须提供 `metadata.text` 且不能为空
- ✅ `duration` 必须 ≥ 0

### 3. Tracks 验证
- ✅ 每个 track 必须有 `type` 和 `clips`
- ✅ Track type 必须是 `video` 或 `audio`
- ✅ 每个 track 至少需要一个 clip

### 4. Clips 验证
- ✅ clip `name` 在整个 JSON 中必须全局唯一
- ✅ clip `source` 必须存在于 `inputs` 中
- ✅ clip `clipType` 必须与 source `type` 匹配
- ✅ video track 只能包含 video/image/text clip
- ✅ audio track 只能包含 audio clip
- ✅ video/image/text clip 必须有 `transform`
- ✅ audio clip 必须有 `volume`（0-1）
- ✅ `opacity` 必须在 0-1 之间
- ✅ `width` 和 `height` 必须 > 0

### 5. Transitions 验证
- ✅ `from` 和 `to` 不能同时为 `null`
- ✅ `from` 和 `to` 引用的 clip 必须存在
- ✅ `duration` 必须 > 0

### 6. Output 验证
- ✅ 必填字段: `file`, `width`, `height`, `framerate`, `startPosition`, `endPosition`
- ✅ `width`, `height`, `framerate` 必须 > 0
- ✅ `endPosition` 必须 > `startPosition`
- ✅ `crf` 必须在 0-51 之间

## 使用示例

### cURL 示例
```bash
# 验证本地文件
curl -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json

# 查看格式化输出
curl -s -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json | jq
```

### JavaScript/TypeScript 示例
```typescript
async function validateTimeline(timeline: any) {
  const response = await fetch(
    'https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timeline),
    }
  );

  const result = await response.json();

  if (result.valid) {
    console.log('✓ 验证通过');
    if (result.warnings) {
      console.warn('警告:', result.warnings);
    }
    return true;
  } else {
    console.error('✗ 验证失败');
    result.errors.forEach((error: any) => {
      console.error(`  [${error.path}] ${error.message}`);
    });
    return false;
  }
}
```

### Python 示例
```python
import requests
import json

def validate_timeline(timeline_path):
    with open(timeline_path, 'r') as f:
        timeline = json.load(f)

    response = requests.post(
        'https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate',
        json=timeline
    )

    result = response.json()

    if result['valid']:
        print('✓ 验证通过')
        if 'warnings' in result:
            print('警告:', result['warnings'])
        return True
    else:
        print('✗ 验证失败')
        for error in result['errors']:
            print(f"  [{error['path']}] {error['message']}")
        return False

# 使用
validate_timeline('timeline.json')
```

## 测试脚本

### 1. 远程 API 测试（需要网络）
```bash
# 测试已部署的 worker
bash scripts/test-validate-api.sh

# 使用自定义 worker URL
WORKER_URL=http://localhost:8787 bash scripts/test-validate-api.sh
```

### 2. 本地验证测试（无需网络）
```bash
# 需要先安装依赖和构建
npm install
npm run build

# 运行本地测试
npx tsx scripts/test-validate-local.ts
```

## 错误代码说明

| 错误代码 | 说明 |
|---------|------|
| `DUPLICATE_CLIP_NAME` | clip name 重复 |
| `SOURCE_NOT_FOUND` | source 不存在于 inputs |
| `TYPE_MISMATCH` | clipType 与 source type 不匹配 |
| `TRACK_CLIP_TYPE_MISMATCH` | track type 与 clip type 不匹配 |
| `CLIP_NOT_FOUND` | transition 引用的 clip 不存在 |
| `PARSE_ERROR` | JSON 解析错误 |
| `UNKNOWN_ERROR` | 未知错误 |

## 常见错误示例

### 错误 1: clip name 重复
```json
{
  "tracks": {
    "track1": {
      "clips": [
        {"name": "clip1", ...},
        {"name": "clip1", ...}  // ❌ 重复
      ]
    }
  }
}
```

**错误信息:**
```
[tracks.track1.clips[1].name] clip name "clip1" 重复，必须全局唯一
```

### 错误 2: source 引用不存在
```json
{
  "inputs": {
    "video1": {...}
  },
  "tracks": {
    "track1": {
      "clips": [
        {"source": "video2", ...}  // ❌ video2 不存在
      ]
    }
  }
}
```

**错误信息:**
```
[tracks.track1.clips[0].source] source "video2" 不存在于 inputs 中
```

### 错误 3: hasAudio/hasVideo 类型不匹配
```json
{
  "inputs": {
    "audio1": {
      "type": "audio",
      "hasAudio": false,  // ❌ 应该是 true
      "hasVideo": true    // ❌ 应该是 false
    }
  }
}
```

**错误信息:**
```
[inputs.audio1] hasAudio/hasVideo 与 type 不匹配
```

### 错误 4: text 类型缺少内容
```json
{
  "inputs": {
    "text1": {
      "type": "text",
      "metadata": {
        "fontSize": 72  // ❌ 缺少 text 字段
      }
    }
  }
}
```

**错误信息:**
```
[inputs.text1] text 类型必须提供 metadata.text 且不能为空
```

### 错误 5: opacity 超出范围
```json
{
  "transform": {
    "opacity": 1.5  // ❌ 必须在 0-1 之间
  }
}
```

**错误信息:**
```
[tracks.track1.clips[0].transform.opacity] opacity 必须 <= 1
```

## 集成到工作流

### 1. 在构建前验证
```bash
# 先验证
curl -X POST https://...workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json

# 验证通过后再构建
if [ $? -eq 0 ]; then
  curl -X POST https://...workers.dev/build \
    -H 'Content-Type: application/json' \
    --data-binary @timeline.json | jq -r '.command' > run.sh
  bash run.sh
fi
```

### 2. 在编辑器中实时验证
```typescript
// 编辑器保存时自动验证
editor.onDidSave(async (document) => {
  const timeline = JSON.parse(document.getText());
  const result = await validateTimeline(timeline);

  if (!result.valid) {
    // 显示错误标记
    showErrorMarkers(result.errors);
  }
});
```

### 3. CI/CD 集成
```yaml
# .github/workflows/validate.yml
- name: Validate Timeline
  run: |
    for file in examples/*.json; do
      echo "Validating $file..."
      curl -f -X POST $WORKER_URL/validate \
        -H 'Content-Type: application/json' \
        --data-binary @"$file" || exit 1
    done
```

## 性能特点

- **快速响应**: 验证通常在 50-200ms 内完成
- **无需 FFmpeg**: 纯 JSON 验证，不调用 FFmpeg
- **详细报告**: 一次返回所有错误，无需逐个修复
- **友好提示**: 错误消息包含路径和代码，易于定位

## 与 /build 接口的区别

| 特性 | /validate | /build |
|-----|-----------|--------|
| 验证 JSON | ✅ 完整验证 | ✅ 基础验证 |
| 生成命令 | ❌ 不生成 | ✅ 生成 |
| 错误详情 | ✅ 非常详细 | ⚠️ 基础错误 |
| 响应速度 | 🚀 极快 | ⚠️ 较慢 |
| 用途 | 开发调试 | 生产构建 |

## 建议工作流

1. **开发阶段**: 使用 `/validate` 快速检查格式
2. **测试阶段**: 使用 `/build` 生成并测试命令
3. **生产阶段**: 先 `/validate` 再 `/build`

## 支持

如有问题或建议，请在 GitHub 提 issue:
https://github.com/pilotpirxie/json-to-ffmpeg/issues
