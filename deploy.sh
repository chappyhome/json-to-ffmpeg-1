#!/bin/bash
# json-to-ffmpeg Worker 一键部署脚本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 json-to-ffmpeg Worker 部署工具${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "worker" ]; then
  echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
  exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ 错误: 需要 Node.js >= 18，当前版本: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js 版本检查通过: $(node -v)${NC}"

# 检查 wrangler
if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}⚠️  wrangler 未安装，尝试使用 npx...${NC}"
  WRANGLER_CMD="npx wrangler"
else
  WRANGLER_CMD="wrangler"
  echo -e "${GREEN}✓ wrangler 已安装: $(wrangler --version)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 1/5: 检查登录状态${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否已登录
if $WRANGLER_CMD whoami &> /dev/null; then
  ACCOUNT_INFO=$($WRANGLER_CMD whoami 2>&1 | grep -E "Account Name|Account ID" || true)
  echo -e "${GREEN}✓ 已登录 Cloudflare${NC}"
  if [ -n "$ACCOUNT_INFO" ]; then
    echo "$ACCOUNT_INFO"
  fi
else
  echo -e "${YELLOW}⚠️  未登录 Cloudflare，启动登录流程...${NC}"
  $WRANGLER_CMD login
  echo -e "${GREEN}✓ 登录成功${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 2/5: 构建核心库${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📥 安装核心库依赖...${NC}"
  npm install
else
  echo -e "${GREEN}✓ 核心库依赖已存在${NC}"
fi

# 构建核心库
echo -e "${YELLOW}🔨 构建核心库...${NC}"
npm run build
echo -e "${GREEN}✓ 核心库构建完成${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 3/5: 准备 Worker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd worker

# 检查 worker 依赖
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📥 安装 Worker 依赖...${NC}"
  npm install
else
  echo -e "${GREEN}✓ Worker 依赖已存在${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 4/5: 构建 Worker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}🔨 编译 TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Worker 构建完成${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 5/5: 部署到 Cloudflare${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 读取 worker 名称
WORKER_NAME=$(grep "^name = " wrangler.toml | cut -d'"' -f2)
echo -e "${YELLOW}📤 部署 Worker: ${WORKER_NAME}${NC}"

# 部署
npm run deploy

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 部署成功！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 提取 Worker URL（从最后的部署输出中）
echo -e "${BLUE}📍 Worker 信息:${NC}"
echo -e "   名称: ${YELLOW}${WORKER_NAME}${NC}"

# 尝试从 wrangler 输出中提取 URL
WORKER_URL="https://${WORKER_NAME}.workers.dev"
echo -e "   URL: ${YELLOW}${WORKER_URL}${NC}"

echo ""
echo -e "${BLUE}🧪 快速测试:${NC}"
echo ""
echo -e "  ${YELLOW}# 健康检查${NC}"
echo -e "  curl ${WORKER_URL}/health"
echo ""
echo -e "  ${YELLOW}# 版本信息${NC}"
echo -e "  curl ${WORKER_URL}/version"
echo ""
echo -e "  ${YELLOW}# 验证接口${NC}"
echo -e "  curl -X POST ${WORKER_URL}/validate \\"
echo -e "    -H 'Content-Type: application/json' \\"
echo -e "    --data-binary @test/fixtures/simple-timeline.json | jq"
echo ""
echo -e "  ${YELLOW}# 构建接口${NC}"
echo -e "  curl -X POST ${WORKER_URL}/build \\"
echo -e "    -H 'Content-Type: application/json' \\"
echo -e "    --data-binary @test/fixtures/simple-timeline.json | jq"
echo ""

# 询问是否立即测试
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "$(echo -e ${YELLOW}是否立即测试 Worker？ [y/N]: ${NC})" -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}测试 Worker...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # 测试健康检查
  echo -e "${YELLOW}1. 测试健康检查...${NC}"
  HEALTH_RESPONSE=$(curl -s "${WORKER_URL}/health")
  if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
  else
    echo -e "${RED}✗ 健康检查失败${NC}"
    echo "$HEALTH_RESPONSE"
  fi
  echo ""

  # 测试版本信息
  echo -e "${YELLOW}2. 测试版本信息...${NC}"
  VERSION_RESPONSE=$(curl -s "${WORKER_URL}/version")
  if echo "$VERSION_RESPONSE" | grep -q "workerVersion"; then
    echo -e "${GREEN}✓ 版本信息获取成功${NC}"
    echo "$VERSION_RESPONSE" | jq '.' 2>/dev/null || echo "$VERSION_RESPONSE"
  else
    echo -e "${RED}✗ 版本信息获取失败${NC}"
    echo "$VERSION_RESPONSE"
  fi
  echo ""

  # 测试验证接口
  echo -e "${YELLOW}3. 测试验证接口...${NC}"
  VALIDATE_RESPONSE=$(curl -s -X POST "${WORKER_URL}/validate" \
    -H 'Content-Type: application/json' \
    --data-binary @test/fixtures/simple-timeline.json)
  if echo "$VALIDATE_RESPONSE" | grep -q '"valid"'; then
    echo -e "${GREEN}✓ 验证接口测试通过${NC}"
    echo "$VALIDATE_RESPONSE" | jq '.valid, .warnings?, .errors?' 2>/dev/null || echo "$VALIDATE_RESPONSE"
  else
    echo -e "${RED}✗ 验证接口测试失败${NC}"
    echo "$VALIDATE_RESPONSE"
  fi
  echo ""

  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ 所有测试完成！${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo -e "${BLUE}📚 更多信息:${NC}"
echo -e "   文档: ${YELLOW}WORKER_DEPLOYMENT_GUIDE.md${NC}"
echo -e "   控制台: ${YELLOW}https://dash.cloudflare.com/workers${NC}"
echo ""

# 返回项目根目录
cd ..
