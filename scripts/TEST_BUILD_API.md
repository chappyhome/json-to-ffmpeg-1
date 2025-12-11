# 测试脚本说明

## test-build-api.sh

### 功能描述
直接调用线上 Worker 的 `/build` 接口,将 JSON 时间线转换为 FFmpeg 命令。

### 依赖要求
- `curl`: 用于 HTTP 请求
- `jq`: 用于解析 JSON 响应

### 安装 jq (如果未安装)
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### 使用方法

#### 基本用法
```bash
./scripts/test-build-api.sh <json-file-path>
```

#### 示例

**测试简单时间线:**
```bash
./scripts/test-build-api.sh worker/test/fixtures/simple-timeline.json
```

**测试复杂时间线:**
```bash
./scripts/test-build-api.sh worker/test/fixtures/timeline-hotel_vertical_mix_v1-seed12345.json
```

**测试综合场景:**
```bash
./scripts/test-build-api.sh worker/test/fixtures/comprehensive-test.json
```

### 输出说明

#### 成功输出
- ✓ API 调用成功提示
- 完整的 FFmpeg 命令
- 命令保存到 `test-build-output.sh`
- 命令长度统计

#### 输出文件
- `test-build-output.sh`: 生成的 FFmpeg 命令脚本,可直接执行

#### 失败输出
- ❌ 错误提示
- HTTP 状态码
- 详细错误响应

### 线上接口地址
- **Worker URL**: `https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev`
- **Build 端点**: `POST /build`

### 接口格式

**请求:**
```bash
POST /build
Content-Type: application/json

{
  "duration": 10,
  "width": 1920,
  "height": 1080,
  "tracks": [...]
}
```

**响应:**
```json
{
  "command": "#!/bin/bash\nffmpeg -y ...",
  "duration": 10,
  "width": 1920,
  "height": 1080
}
```

### 错误处理

脚本会自动处理以下错误:
- 文件不存在
- API 调用失败
- JSON 解析错误
- HTTP 错误状态码

### 与原 test-text-rendering.js 的对比

| 特性 | test-text-rendering.js | test-build-api.sh |
|------|------------------------|-------------------|
| 运行环境 | Node.js | Bash (系统工具) |
| 调用方式 | 本地库函数 | 线上 API |
| 依赖 | 需要构建本地包 | 只需 curl + jq |
| 输出 | 本地生成命令 | API 返回命令 |
| 适用场景 | 开发测试 | 集成测试/生产验证 |

### 高级用法

#### 查看详细响应
```bash
./scripts/test-build-api.sh worker/test/fixtures/simple-timeline.json | tee test.log
```

#### 直接执行生成的命令
```bash
./scripts/test-build-api.sh worker/test/fixtures/simple-timeline.json
bash test-build-output.sh
```

#### 批量测试所有 fixture 文件
```bash
for file in worker/test/fixtures/*.json; do
  echo "Testing: $file"
  ./scripts/test-build-api.sh "$file"
  echo "---"
done
```

### 故障排查

#### 问题: command not found: jq
**解决**: 安装 jq 工具 (见上方依赖要求)

#### 问题: API 返回 500 错误
**检查**:
1. JSON 文件格式是否正确
2. Worker 是否正常运行
3. 网络连接是否正常

#### 问题: curl: (6) Could not resolve host
**解决**: 检查网络连接和 DNS 设置

### 注意事项

1. **输出文件覆盖**: 每次运行都会覆盖 `test-build-output.sh`
2. **Worker 限制**: Cloudflare Workers 有请求大小和超时限制
3. **JSON 编码**: 确保 JSON 文件使用 UTF-8 编码
4. **权限**: 脚本需要可执行权限 (`chmod +x`)

### 相关文件

- 原 JavaScript 版本: [test-text-rendering.js](test-text-rendering.js)
- Worker 源码: [../worker/src/index.ts](../worker/src/index.ts)
- 部署文档: [../WORKER_DEPLOYMENT_GUIDE.md](../WORKER_DEPLOYMENT_GUIDE.md)
