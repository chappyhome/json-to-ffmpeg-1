#!/bin/bash

# Generate executable FFmpeg commands from timeline JSON
# Usage: ./generate-ffmpeg.sh [simple|complex]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_URL="${WORKER_URL:-http://localhost:8787}"
TIMELINE_TYPE="${1:-simple}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Select timeline file
if [ "$TIMELINE_TYPE" = "complex" ]; then
  TIMELINE_FILE="$SCRIPT_DIR/../test/fixtures/complex-timeline.json"
  OUTPUT_FILE="output-complex.mp4"
else
  TIMELINE_FILE="$SCRIPT_DIR/../test/fixtures/simple-timeline.json"
  OUTPUT_FILE="output-simple.mp4"
fi

# Check if timeline file exists
if [ ! -f "$TIMELINE_FILE" ]; then
  echo -e "${RED}Error: Timeline file not found: $TIMELINE_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}=== Generating FFmpeg Command ===${NC}"
echo "Timeline: $TIMELINE_TYPE"
echo "File: $TIMELINE_FILE"
echo ""

# Call worker API
RESPONSE=$(curl -s -X POST "$WORKER_URL/build" \
  -H "Content-Type: application/json" \
  -d @"$TIMELINE_FILE")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}Error from API:${NC}"
  echo "$RESPONSE" | jq .
  exit 1
fi

# Extract command
COMMAND=$(echo "$RESPONSE" | jq -r '.command')
ARGS=$(echo "$RESPONSE" | jq -r '.args[]' 2>/dev/null)
WARNINGS=$(echo "$RESPONSE" | jq -r '.warnings[]?' 2>/dev/null)

if [ -n "$WARNINGS" ]; then
  echo -e "${YELLOW}Warnings:${NC}"
  echo "$WARNINGS" | while read -r warning; do
    echo "  - $warning"
  done
  echo ""
fi

# Output formats
echo -e "${GREEN}=== Generated Command (Shell Script) ===${NC}"
echo "$COMMAND"
echo ""

echo -e "${GREEN}=== Generated Args (Array) ===${NC}"
echo "ffmpeg" "$ARGS"
echo ""

# Save to executable script
SCRIPT_OUTPUT="$SCRIPT_DIR/run-ffmpeg-${TIMELINE_TYPE}.sh"
echo "$COMMAND" > "$SCRIPT_OUTPUT"
chmod +x "$SCRIPT_OUTPUT"

echo -e "${GREEN}=== Saved to: $SCRIPT_OUTPUT ===${NC}"
echo ""

# Ask to execute
echo -e "${YELLOW}Execute the command now? (y/N)${NC}"
read -r -n 1 EXECUTE
echo ""

if [ "$EXECUTE" = "y" ] || [ "$EXECUTE" = "Y" ]; then
  echo -e "${GREEN}=== Executing FFmpeg Command ===${NC}"

  # Change to project root to access samples
  cd "$SCRIPT_DIR/../.."

  # Execute the saved script
  bash "$SCRIPT_OUTPUT"

  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Video generated successfully!${NC}"
    if [ -f "$OUTPUT_FILE" ]; then
      FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
      echo "Output: $OUTPUT_FILE ($FILE_SIZE)"
      echo ""
      echo "Play with:"
      echo "  ffplay $OUTPUT_FILE"
      echo "  open $OUTPUT_FILE"
    fi
  else
    echo ""
    echo -e "${RED}✗ FFmpeg command failed${NC}"
    exit 1
  fi
else
  echo "Skipped execution. You can run manually:"
  echo "  cd $SCRIPT_DIR/../.."
  echo "  bash $SCRIPT_OUTPUT"
fi
