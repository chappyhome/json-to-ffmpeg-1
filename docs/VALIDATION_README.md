# Timeline JSON 验证功能

## 概述

本项目提供了强大的 Timeline JSON 验证功能，帮助你在生成 FFmpeg 命令前快速发现和修复格式错误。

## 🎯 主要特性

- ✅ **完整的类型验证** - 基于 Zod Schema，严格的类型检查
- ✅ **业务逻辑验证** - clip name 唯一性、引用完整性、类型匹配等
- ✅ **精确的错误定位** - 错误信息包含具体路径（如 `tracks.track1.clips[0].name`）
- ✅ **友好的错误提示** - 清晰说明错误原因和修复建议
- ✅ **警告系统** - 提示缺少的可选字段和潜在问题
- ✅ **快速响应** - 纯 JSON 验证，50-200ms 内完成
- ✅ **在线 API** - 无需安装，直接调用

## 📚 文档

- **[完整 API 文档](./VALIDATION_API.md)** - 详细的接口说明、使用示例、错误代码
- **[快速参考](./VALIDATION_QUICK_REFERENCE.md)** - 检查清单、常见错误、调试技巧
- **[语法规则](./语法规则.md)** - 完整的 JSON 格式规范

## 🚀 快速开始

### 在线验证（推荐）

```bash
# 验证 JSON 文件
curl -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json | jq

# 只查看验证结果
curl -s -X POST \
  https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @timeline.json | jq '.valid'
```

### 响应示例

**验证通过:**
```json
{
  "valid": true,
  "message": "Timeline JSON 验证通过",
  "warnings": [
    "未指定 output.tempDir，将使用默认值"
  ]
}
```

**验证失败:**
```json
{
  "valid": false,
  "message": "Timeline JSON 验证失败",
  "errors": [
    {
      "path": "tracks.track1.clips[0].source",
      "message": "source \"video2\" 不存在于 inputs 中",
      "code": "SOURCE_NOT_FOUND"
    }
  ]
}
```

## 🧪 测试脚本

### 1. 自动化测试（包含有效和无效用例）

```bash
# 测试在线 API
bash scripts/test-validate-api.sh

# 使用自定义 URL
WORKER_URL=http://localhost:8787 bash scripts/test-validate-api.sh
```

### 2. 本地验证测试

```bash
# 安装依赖
npm install

# 运行本地测试
npx tsx scripts/test-validate-local.ts
```

## 📋 验证规则概览

### 必填字段检查
- ✅ 顶层: `version`, `inputs`, `tracks`, `output`
- ✅ Inputs: `type`, `file`, `hasAudio`, `hasVideo`, `duration`
- ✅ Clips: `name`, `source`, `timelineTrackStart`, `duration`, `clipType`
- ✅ Output: `file`, `width`, `height`, `framerate`, `startPosition`, `endPosition`

### 数据完整性检查
- ✅ clip `name` 全局唯一
- ✅ clip `source` 存在于 `inputs`
- ✅ transition `from/to` 引用的 clip 存在
- ✅ `hasAudio/hasVideo` 与 `type` 对应
- ✅ track `type` 与 clip `clipType` 匹配

### 数值范围检查
- ✅ `opacity`: 0-1
- ✅ `volume`: 0-1
- ✅ `width`, `height`, `framerate`: > 0
- ✅ `endPosition` > `startPosition`
- ✅ `crf`: 0-51

### 特殊类型检查
- ✅ text 类型必须有 `metadata.text`
- ✅ video/image/text clip 必须有 `transform`
- ✅ audio clip 必须有 `volume`

## 🔍 常见错误示例

### 错误 1: Clip Name 重复
```json
// ❌ 错误
"clips": [
  {"name": "clip1", ...},
  {"name": "clip1", ...}  // 重复！
]
```
**解决:** 确保每个 clip name 在整个 JSON 中唯一

### 错误 2: Source 不存在
```json
// ❌ 错误
"inputs": {"video1": {...}},
"clips": [{"source": "video2", ...}]  // video2 不存在
```
**解决:** 检查 source 是否拼写正确，是否在 inputs 中定义

### 错误 3: 类型不匹配
```json
// ❌ 错误
"audio1": {
  "type": "audio",
  "hasAudio": false,  // 应该是 true
  "hasVideo": true    // 应该是 false
}
```
**解决:** 参考类型对应表设置正确的 hasAudio/hasVideo

### 错误 4: Text 缺少内容
```json
// ❌ 错误
"text1": {
  "type": "text",
  "metadata": {
    "fontSize": 72  // 缺少 text 字段
  }
}
```
**解决:** 添加 `"text": "显示的内容"`

## 💡 使用建议

### 开发流程
1. **编辑时** - 参考[快速参考](./VALIDATION_QUICK_REFERENCE.md)确保格式正确
2. **保存后** - 使用 `/validate` API 验证
3. **修复错误** - 根据错误提示修改
4. **生成命令** - 使用 `/build` API 生成 FFmpeg 命令

### 集成到 CI/CD
```yaml
# .github/workflows/validate.yml
- name: Validate Timeline JSON
  run: |
    for file in examples/*.json; do
      curl -f -X POST $WORKER_URL/validate \
        -H 'Content-Type: application/json' \
        --data-binary @"$file" || exit 1
    done
```

### 编辑器集成
```typescript
// VS Code 插件示例
async function validateOnSave(document: TextDocument) {
  const timeline = JSON.parse(document.getText());
  const response = await fetch(
    'https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev/validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timeline),
    }
  );
  const result = await response.json();

  if (!result.valid) {
    // 在编辑器中显示错误标记
    showDiagnostics(document, result.errors);
  }
}
```

## 📊 性能对比

| 接口 | 验证 | 生成命令 | 响应时间 | 用途 |
|-----|-----|---------|---------|------|
| `/validate` | ✅ 完整 | ❌ | 50-200ms | 快速验证 |
| `/build` | ⚠️ 基础 | ✅ | 500-2000ms | 生产构建 |

**建议:** 开发时用 `/validate`，生产前用 `/build`

## 🔗 相关链接

- [主项目 README](../README.md)
- [API 文档](./API.md)
- [Worker 部署文档](./worker/README.md)
- [GitHub Issues](https://github.com/pilotpirxie/json-to-ffmpeg/issues)

## 📝 更新日志

### v1.0.0 (2025-01-xx)
- ✨ 新增完整的 Zod Schema 验证
- ✨ 新增 POST `/validate` API 接口
- ✨ 新增业务逻辑验证（clip name 唯一性、引用完整性等）
- ✨ 新增友好的错误提示和警告系统
- 📝 新增详细的验证文档和测试脚本

## 🤝 贡献

欢迎提交 PR 改进验证规则或添加新的检查！

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)
