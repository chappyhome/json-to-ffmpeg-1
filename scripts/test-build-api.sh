#!/bin/bash

# 测试脚本：调用线上 build 接口生成 FFmpeg 命令
# 用法: ./scripts/test-build-api.sh <json-file-path>

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 线上 Worker URL
WORKER_URL="https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev"

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 错误: 缺少 JSON 文件路径${NC}"
    echo -e "${YELLOW}用法: $0 <json-file-path>${NC}"
    echo -e "${YELLOW}示例: $0 worker/test/fixtures/simple-timeline.json${NC}"
    exit 1
fi

JSON_FILE="$1"

# 检查文件是否存在
if [ ! -f "$JSON_FILE" ]; then
    echo -e "${RED}❌ 错误: 文件不存在: $JSON_FILE${NC}"
    exit 1
fi

# 打印信息
echo -e "${BLUE}=== JSON to FFmpeg Build API 测试 ===${NC}"
echo -e "${BLUE}Worker URL: ${WORKER_URL}/build${NC}"
echo -e "${BLUE}输入文件: ${JSON_FILE}${NC}"
echo ""

# 调用 API
echo -e "${YELLOW}正在调用 API...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WORKER_URL}/build" \
    -H "Content-Type: application/json" \
    --data-binary "@${JSON_FILE}")

# 提取 HTTP 状态码和响应体 (兼容 macOS)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""

# 检查 HTTP 状态码
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API 调用成功 (HTTP $HTTP_CODE)${NC}"
    echo ""

    # 解析 JSON 响应获取 command
    COMMAND=$(echo "$BODY" | jq -r '.command // .error // "无法解析响应"')

    if [ "$COMMAND" = "null" ] || [ -z "$COMMAND" ]; then
        echo -e "${RED}❌ 响应中没有找到 command 字段${NC}"
        echo -e "${YELLOW}完整响应:${NC}"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        exit 1
    fi

    echo -e "${GREEN}=== 生成的 FFmpeg 命令 ===${NC}"
    echo ""
    echo "$COMMAND"
    echo ""

    # 保存命令到文件
    OUTPUT_FILE="test-build-output.sh"
    echo "$COMMAND" > "$OUTPUT_FILE"
    echo -e "${GREEN}✓ 命令已保存到: $OUTPUT_FILE${NC}"

    # 显示统计信息
    COMMAND_LENGTH=$(echo "$COMMAND" | wc -c | tr -d ' ')
    echo -e "${BLUE}命令长度: $COMMAND_LENGTH 字符${NC}"

else
    echo -e "${RED}❌ API 调用失败 (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo -e "${YELLOW}错误响应:${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi
