#!/bin/bash
# JSON 合法性验证脚本
# 使用方法: ./validate-json.sh <json文件路径>

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Worker URL（可通过环境变量覆盖）
WORKER_URL="${WORKER_URL:-https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev}"

# 检查参数
if [ $# -eq 0 ]; then
  echo -e "${RED}错误: 缺少 JSON 文件路径参数${NC}"
  echo ""
  echo -e "使用方法:"
  echo -e "  $0 <json文件路径>"
  echo ""
  echo -e "示例:"
  echo -e "  $0 timeline.json"
  echo -e "  $0 worker/test/fixtures/simple-timeline.json"
  echo ""
  exit 1
fi

JSON_FILE="$1"

# 检查文件是否存在
if [ ! -f "$JSON_FILE" ]; then
  echo -e "${RED}✗ 错误: 文件不存在${NC}"
  echo -e "路径: ${YELLOW}$JSON_FILE${NC}"
  exit 1
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}JSON 合法性验证${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "文件: ${YELLOW}$JSON_FILE${NC}"
echo -e "接口: ${YELLOW}$WORKER_URL/validate${NC}"
echo ""

# 发送请求
response=$(curl -s -w "\n%{http_code}" -X POST \
  "$WORKER_URL/validate" \
  -H 'Content-Type: application/json' \
  --data-binary "@$JSON_FILE")

# 分离响应体和状态码
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

# 检查网络请求是否成功
if [ -z "$http_code" ] || [ "$http_code" == "000" ]; then
  echo -e "${RED}✗ 错误: 无法连接到验证服务${NC}"
  echo -e "请检查网络连接或 Worker URL 是否正确"
  exit 1
fi

# 提取 valid 字段
valid=$(echo "$response_body" | jq -r '.valid')

# 输出结果
echo -e "${BLUE}验证结果:${NC}"
echo ""

if [ "$valid" == "true" ]; then
  echo -e "${GREEN}✓ JSON 合法${NC}"
  echo ""

  # 显示警告信息（如果有）
  warnings_count=$(echo "$response_body" | jq -r '.warnings // [] | length')
  if [ "$warnings_count" -gt 0 ]; then
    echo -e "${YELLOW}⚠ 警告信息 ($warnings_count 条):${NC}"
    echo "$response_body" | jq -r '.warnings[]' | while IFS= read -r warning; do
      echo -e "  ${YELLOW}•${NC} $warning"
    done
    echo ""
  fi

  exit 0
else
  echo -e "${RED}✗ JSON 不合法${NC}"
  echo ""

  # 显示错误信息
  errors_count=$(echo "$response_body" | jq -r '.errors // [] | length')
  if [ "$errors_count" -gt 0 ]; then
    echo -e "${RED}错误详情 ($errors_count 条):${NC}"
    echo "$response_body" | jq -r '.errors[] | "  • [\(.path)] \(.message)"'
    echo ""

    # 显示完整错误信息（JSON 格式）
    echo -e "${BLUE}详细错误 (JSON):${NC}"
    echo "$response_body" | jq '.errors'
  else
    # 显示原始响应（调试用）
    echo -e "${RED}无法解析错误信息，原始响应:${NC}"
    echo "$response_body" | jq '.'
  fi
  echo ""

  exit 1
fi
