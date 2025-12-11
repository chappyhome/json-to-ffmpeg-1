# Cloudflare Worker 部署指南

## 📋 前置要求

### 1. 安装必要工具
```bash
# 检查 Node.js 版本（需要 >= 18）
node --version

# 安装 Cloudflare Wrangler CLI（如果没有）
npm install -g wrangler

# 验证安装
wrangler --version
```

### 2. Cloudflare 账户准备
1. 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. 注册/登录账户
3. 进入 Workers & Pages 页面

## 🚀 部署流程

### 步骤 1: 登录 Cloudflare
```bash
# 在项目根目录执行
wrangler login
```
这会打开浏览器，授权 Wrangler 访问你的 Cloudflare 账户。

### 步骤 2: 构建主库
```bash
# 在项目根目录
npm install
npm run build
```

### 步骤 3: 构建并部署 Worker
```bash
# 进入 worker 目录
cd worker

# 安装依赖
npm install

# 构建 TypeScript
npm run build

# 部署到 Cloudflare Workers
npm run deploy
```

### 步骤 4: 验证部署
部署成功后，Wrangler 会输出 Worker 的 URL：
```
Published json-to-ffmpeg-worker (1.23 sec)
  https://json-to-ffmpeg-worker.<your-subdomain>.workers.dev
```

测试 Worker：
```bash
# 测试健康检查
curl https://json-to-ffmpeg-worker.<your-subdomain>.workers.dev/health

# 测试版本信息
curl https://json-to-ffmpeg-worker.<your-subdomain>.workers.dev/version

# 测试验证接口
curl -X POST https://json-to-ffmpeg-worker.<your-subdomain>.workers.dev/validate \
  -H 'Content-Type: application/json' \
  --data-binary @test/fixtures/simple-timeline.json | jq
```

## 📝 配置文件说明

### wrangler.toml
```toml
name = "json-to-ffmpeg-worker"       # Worker 名称
main = "dist/index.js"                # 入口文件
compatibility_date = "2024-06-01"     # 兼容性日期
compatibility_flags = ["nodejs_compat"] # Node.js 兼容

[build]
command = "npm --prefix .. run build && npm ci --silent && npm run build"
# 构建命令：先构建主库，再构建 worker
```

### 自定义 Worker 名称
编辑 `worker/wrangler.toml`：
```toml
name = "your-custom-worker-name"  # 修改这里
```

### 自定义域名（可选）
在 `worker/wrangler.toml` 添加：
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## 🔄 更新代码并重新部署

### 场景 1: 修改了 worker 代码
```bash
cd worker
npm run build
npm run deploy
```

### 场景 2: 修改了核心库代码
```bash
# 在项目根目录
npm run build

# 重新部署 worker
cd worker
npm run build
npm run deploy
```

### 场景 3: 添加了新的验证规则
```bash
# worker/src/validation-complete.ts 已修改
cd worker
npm run build
npm run deploy
```

## 🧪 本地开发

### 启动本地开发服务器
```bash
cd worker
npm run dev
```
这会在 `http://localhost:8787` 启动本地 Worker。

### 在另一个终端测试
```bash
# 测试本地 API
curl http://localhost:8787/health
curl http://localhost:8787/version

# 测试验证接口
curl -X POST http://localhost:8787/validate \
  -H 'Content-Type: application/json' \
  --data-binary @test/fixtures/simple-timeline.json | jq

# 使用测试脚本
WORKER_URL=http://localhost:8787 bash scripts/test-validate-api.sh
```

## 📊 部署后的 Worker 信息

### 查看 Worker 列表
```bash
wrangler list
```

### 查看 Worker 日志
```bash
cd worker
wrangler tail
```
实时查看 Worker 的请求日志。

### 查看 Worker 详情
访问 Cloudflare Dashboard:
1. 登录 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 找到你的 Worker
4. 查看请求统计、日志、设置等

## 🔒 环境变量和密钥（如需要）

### 添加环境变量
```bash
# 添加环境变量
wrangler secret put MY_SECRET_KEY

# 在代码中使用（需要在 worker/src/index.ts 中定义 Env 类型）
export interface Env {
  MY_SECRET_KEY: string;
}
```

### 在 wrangler.toml 中配置非敏感变量
```toml
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
```

## 🎯 完整部署命令（一键部署）

创建一个部署脚本 `deploy.sh`：
```bash
#!/bin/bash
set -e

echo "🚀 开始部署 json-to-ffmpeg-worker..."

# 1. 构建主库
echo "📦 构建主库..."
npm run build

# 2. 进入 worker 目录
cd worker

# 3. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "📥 安装依赖..."
  npm install
fi

# 4. 构建 worker
echo "🔨 构建 worker..."
npm run build

# 5. 部署
echo "☁️  部署到 Cloudflare..."
npm run deploy

echo "✅ 部署完成！"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🐛 常见问题

### 问题 1: `wrangler: command not found`
**解决:**
```bash
npm install -g wrangler
# 或使用 npx
npx wrangler login
```

### 问题 2: 构建失败 - `Cannot find module 'json-to-ffmpeg'`
**解决:**
```bash
# 确保先构建主库
cd ..  # 回到项目根目录
npm install
npm run build
cd worker
npm install  # 重新安装，会链接本地包
```

### 问题 3: 部署时提示权限错误
**解决:**
```bash
wrangler logout
wrangler login
```

### 问题 4: Worker 超时
Cloudflare Workers 免费版有 10ms CPU 时间限制，付费版 50ms。
如果处理大型 JSON，考虑：
- 优化验证逻辑
- 使用 Durable Objects（付费功能）
- 分批处理

### 问题 5: CORS 错误
Worker 已配置 CORS，如果仍有问题：
```typescript
// worker/src/index.ts 中的 CORS_HEADERS
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',  // 可以改为特定域名
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

## 📈 性能监控

### Cloudflare Dashboard 指标
- **请求数**: 每天的总请求量
- **成功率**: 2xx 响应占比
- **CPU 时间**: 平均执行时间
- **错误率**: 4xx/5xx 响应占比

### 添加自定义监控
在代码中添加：
```typescript
// worker/src/index.ts
console.log('Request processed:', {
  path: url.pathname,
  method: request.method,
  duration: Date.now() - startTime,
});
```

## 💰 费用说明

### 免费额度（Cloudflare Workers 免费计划）
- **100,000 请求/天**
- **10ms CPU 时间/请求**
- **适合**: 开发、测试、小规模使用

### 付费计划（Workers Paid）
- **$5/月** 起
- **10M 请求/月** 包含
- **50ms CPU 时间/请求**
- **超出**: $0.50/百万请求
- **适合**: 生产环境、高流量应用

## 🎉 下一步

部署成功后，你可以：

1. **更新 API 文档中的 URL**
   - 将 `https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev`
   - 替换为你的 Worker URL

2. **集成到前端应用**
   ```javascript
   const WORKER_URL = 'https://your-worker.workers.dev';

   async function validateTimeline(timeline) {
     const response = await fetch(`${WORKER_URL}/validate`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(timeline),
     });
     return response.json();
   }
   ```

3. **设置 CI/CD 自动部署**
   ```yaml
   # .github/workflows/deploy.yml
   - name: Deploy to Cloudflare Workers
     run: |
       cd worker
       npm install
       npm run build
       npx wrangler deploy
     env:
       CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   ```

## 📞 获取帮助

- Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
- Wrangler CLI 文档: https://developers.cloudflare.com/workers/wrangler/
- 项目 Issues: https://github.com/pilotpirxie/json-to-ffmpeg/issues

---

**祝部署顺利！** 🚀
