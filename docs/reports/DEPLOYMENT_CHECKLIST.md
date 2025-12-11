# Worker 部署检查清单

## 🎯 部署前准备

### 环境检查
- [ ] Node.js >= 18 已安装（`node --version`）
- [ ] npm 可用（`npm --version`）
- [ ] git 已安装（可选，`git --version`）

### Cloudflare 账户
- [ ] 已注册 Cloudflare 账户
- [ ] 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/) 能正常登录
- [ ] 了解 Workers 免费额度（100,000 请求/天）

### 项目准备
- [ ] 已克隆/下载项目代码
- [ ] 在项目根目录（包含 `package.json` 和 `worker/` 目录）

## 🚀 快速部署（推荐）

### 方法 1: 使用一键部署脚本
```bash
# 在项目根目录执行
bash deploy.sh
```

脚本会自动完成：
- ✅ 检查 Node.js 版本
- ✅ 检查/安装 wrangler
- ✅ 登录 Cloudflare
- ✅ 构建核心库
- ✅ 构建 Worker
- ✅ 部署到 Cloudflare
- ✅ 运行基础测试

### 方法 2: 手动分步部署
```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 构建核心库
npm install
npm run build

# 3. 构建并部署 Worker
cd worker
npm install
npm run build
npm run deploy
```

## ✅ 部署后验证

### 1. 检查部署状态
```bash
cd worker
npx wrangler list
```

应该看到：
```
┌──────────────────────────┬─────────────────────────────────────────┬──────────┐
│ Name                     │ URL                                      │ Updated  │
├──────────────────────────┼─────────────────────────────────────────┼──────────┤
│ json-to-ffmpeg-worker    │ https://json-to-ffmpeg-worker.workers.dev│ 1 min ago│
└──────────────────────────┴─────────────────────────────────────────┴──────────┘
```

### 2. 测试所有接口
```bash
# 设置 Worker URL（替换为你的实际 URL）
export WORKER_URL="https://json-to-ffmpeg-worker.<your-subdomain>.workers.dev"

# 测试健康检查
curl $WORKER_URL/health
# 预期: {"status":"ok","timestamp":"..."}

# 测试版本信息
curl $WORKER_URL/version
# 预期: {"workerVersion":"1.0.0","libraryVersion":"1.2.3"}

# 测试验证接口
cd worker
curl -X POST $WORKER_URL/validate \
  -H 'Content-Type: application/json' \
  --data-binary @test/fixtures/simple-timeline.json | jq
# 预期: {"valid":true,"message":"...","warnings":[...]}

# 测试构建接口
curl -X POST $WORKER_URL/build \
  -H 'Content-Type: application/json' \
  --data-binary @test/fixtures/simple-timeline.json | jq '.command' -r
# 预期: 返回 FFmpeg 命令
```

### 3. 运行完整测试套件
```bash
# 使用测试脚本
cd worker
WORKER_URL=$WORKER_URL bash ../scripts/test-validate-api.sh
```

预期结果：
```
总测试数: 14
通过: 14
失败: 0
✓ 所有测试通过！
```

## 📊 监控部署

### Cloudflare Dashboard
1. 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击你的 Worker 名称
4. 查看以下指标：
   - [ ] 请求数 > 0（说明有流量）
   - [ ] 成功率 > 95%（2xx 响应）
   - [ ] CPU 时间 < 10ms（免费版限制）
   - [ ] 错误率 < 5%

### 实时日志
```bash
cd worker
npx wrangler tail
```

发送几个测试请求，观察日志输出。

## 🔧 常见问题处理

### 问题 1: `wrangler: command not found`
```bash
# 全局安装
npm install -g wrangler

# 或使用 npx（无需全局安装）
npx wrangler login
npx wrangler deploy
```

### 问题 2: 部署失败 - "Authentication error"
```bash
# 重新登录
npx wrangler logout
npx wrangler login
```

### 问题 3: 构建失败 - "Cannot find module"
```bash
# 回到项目根目录，重新构建
cd ..  # 如果在 worker 目录
npm install
npm run build
cd worker
npm install
npm run build
```

### 问题 4: Worker 返回 500 错误
```bash
# 查看实时日志
cd worker
npx wrangler tail

# 在另一个终端发送测试请求
curl $WORKER_URL/health
```

### 问题 5: CORS 错误
检查 `worker/src/index.ts` 中的 CORS 配置：
```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',  // 允许所有域名
  // 如果需要限制，改为: 'https://yourdomain.com'
};
```

## 📝 部署记录

记录你的部署信息：

```
部署日期: _______________
Worker 名称: json-to-ffmpeg-worker
Worker URL: https://json-to-ffmpeg-worker._____.workers.dev
Cloudflare 账户: _____________________
部署版本: 1.0.0

测试结果:
[ ] 健康检查通过
[ ] 版本信息正确
[ ] 验证接口工作正常
[ ] 构建接口工作正常
[ ] 测试脚本全部通过

备注:
_______________________________________
```

## 🎉 部署成功后

### 更新文档
- [ ] 在项目文档中更新 Worker URL
- [ ] 更新 README.md 中的 API 基础地址
- [ ] 更新测试脚本中的默认 URL

### 通知团队
- [ ] 将新的 Worker URL 分享给团队
- [ ] 提供 API 文档链接
- [ ] 说明使用方法和限制

### 设置监控（可选）
- [ ] 配置 Cloudflare 告警（错误率过高时通知）
- [ ] 设置请求量监控
- [ ] 定期检查日志

### 后续维护
- [ ] 记录部署流程和问题
- [ ] 定期更新 Worker（修复 bug、添加功能）
- [ ] 监控性能和使用量
- [ ] 备份 wrangler.toml 配置

## 🔄 更新 Worker

当需要更新已部署的 Worker 时：

```bash
# 快速更新
bash deploy.sh

# 或手动更新
cd worker
npm run build
npm run deploy
```

更新后记得：
- [ ] 测试所有接口
- [ ] 检查是否有破坏性变更
- [ ] 通知团队（如果有 API 变更）

## 📞 获取帮助

遇到问题？
1. 查看 [WORKER_DEPLOYMENT_GUIDE.md](./WORKER_DEPLOYMENT_GUIDE.md) 详细文档
2. 查看 Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
3. 提交 Issue：https://github.com/pilotpirxie/json-to-ffmpeg/issues

---

**祝部署顺利！** 🎊
