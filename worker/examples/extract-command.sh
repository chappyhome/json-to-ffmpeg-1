#!/bin/bash

# Extract FFmpeg command from Worker API response
# Usage: ./extract-command.sh [timeline.json] [output-script.sh]

set -e

TIMELINE_FILE="${1:-../test/fixtures/simple-timeline.json}"
OUTPUT_SCRIPT="${2:-ffmpeg-command.sh}"
WORKER_URL="${WORKER_URL:-http://localhost:8787}"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$TIMELINE_FILE" ]; then
  echo -e "${RED}Error: Timeline file not found: $TIMELINE_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}Extracting FFmpeg command...${NC}"

# Call API
RESPONSE=$(curl -s -X POST "$WORKER_URL/build" \
  -H "Content-Type: application/json" \
  -d @"$TIMELINE_FILE")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}Error:${NC}"
  echo "$RESPONSE" | jq .
  exit 1
fi

# Extract and save command
COMMAND=$(echo "$RESPONSE" | jq -r '.command')
echo "$COMMAND" > "$OUTPUT_SCRIPT"
chmod +x "$OUTPUT_SCRIPT"

echo -e "${GREEN}✓ Command saved to: $OUTPUT_SCRIPT${NC}"
echo ""
echo "Content:"
echo "----------------------------------------"
cat "$OUTPUT_SCRIPT"
echo "----------------------------------------"
echo ""
echo "Execute with:"
echo "  bash $OUTPUT_SCRIPT"
