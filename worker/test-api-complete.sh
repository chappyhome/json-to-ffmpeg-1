#!/bin/bash

#
# 完整测试演示: JSON Timeline → Worker API → FFmpeg 命令
#
# 此脚本演示完整的工作流程:
# 1. 读取 JSON timeline
# 2. 调用 Worker API
# 3. 提取可执行的 FFmpeg 命令
# 4. 显示命令内容
#

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

WORKER_URL="${WORKER_URL:-http://localhost:8787}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JSON to FFmpeg 完整测试演示${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 步骤 1: 检查 Worker 是否运行
echo -e "${YELLOW}步骤 1: 检查 Worker API...${NC}"
if ! curl -s "$WORKER_URL/health" > /dev/null 2>&1; then
  echo -e "${RED}✗ Worker API 未运行${NC}"
  echo -e "${YELLOW}请先运行: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Worker API 正常运行${NC}"
echo ""

# 步骤 2: 显示输入 JSON
echo -e "${YELLOW}步骤 2: 输入 JSON Timeline${NC}"
echo -e "${BLUE}文件: test/fixtures/simple-timeline.json${NC}"
echo ""
echo "内容预览:"
echo "----------------------------------------"
cat "$SCRIPT_DIR/test/fixtures/simple-timeline.json" | jq -C '.' | head -20
echo "... (省略部分内容) ..."
echo "----------------------------------------"
echo ""

# 步骤 3: 调用 API
echo -e "${YELLOW}步骤 3: 调用 Worker API /build${NC}"
RESPONSE=$(curl -s -X POST "$WORKER_URL/build" \
  -H "Content-Type: application/json" \
  -d @"$SCRIPT_DIR/test/fixtures/simple-timeline.json")

# 检查错误
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}✗ API 返回错误:${NC}"
  echo "$RESPONSE" | jq -C '.'
  exit 1
fi

echo -e "${GREEN}✓ API 调用成功${NC}"
echo ""

# 步骤 4: 显示 API 响应结构
echo -e "${YELLOW}步骤 4: API 响应结构${NC}"
echo "$RESPONSE" | jq -C '{
  command_preview: (.command | split("\n") | .[0:3] | join("\n")),
  args_count: (.args | length),
  warnings: .warnings
}'
echo ""

# 步骤 5: 提取并保存 FFmpeg 命令
echo -e "${YELLOW}步骤 5: 提取 FFmpeg 命令${NC}"
OUTPUT_FILE="$SCRIPT_DIR/test/generated-ffmpeg-command.sh"
echo "$RESPONSE" | jq -r '.command' > "$OUTPUT_FILE"
chmod +x "$OUTPUT_FILE"

echo -e "${GREEN}✓ 命令已保存到: test/generated-ffmpeg-command.sh${NC}"
echo ""

# 步骤 6: 显示完整的 FFmpeg 命令
echo -e "${YELLOW}步骤 6: 生成的 FFmpeg 命令${NC}"
echo -e "${BLUE}这个命令可以直接在命令行执行!${NC}"
echo ""
echo "=========================================="
cat "$OUTPUT_FILE"
echo "=========================================="
echo ""

# 步骤 7: 显示执行提示
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  测试完成! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "生成的命令位于:"
echo "  $OUTPUT_FILE"
echo ""
echo "执行命令:"
echo -e "  ${BLUE}bash $OUTPUT_FILE${NC}"
echo ""
echo "或者复制上面的命令直接在终端执行!"
echo ""

# 步骤 8: 询问是否执行
echo -e "${YELLOW}是否立即执行 FFmpeg 命令? (需要视频样本文件) [y/N]${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo ""
  echo -e "${BLUE}执行 FFmpeg 命令...${NC}"
  bash "$OUTPUT_FILE"
  echo -e "${GREEN}✓ 视频生成完成!${NC}"
else
  echo -e "${YELLOW}跳过执行。命令已保存,可以稍后手动执行。${NC}"
fi
