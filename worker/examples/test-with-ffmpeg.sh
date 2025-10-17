#!/bin/bash

# Complete workflow: Generate + Execute FFmpeg command
# Checks prerequisites and executes the full pipeline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMELINE_TYPE="${1:-simple}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== FFmpeg Test Workflow ===${NC}"
echo ""

# 1. Check if worker is running
echo -e "${YELLOW}[1/5] Checking worker status...${NC}"
if ! curl -s http://localhost:8787/health > /dev/null 2>&1; then
  echo -e "${RED}✗ Worker is not running${NC}"
  echo ""
  echo "Please start the worker first:"
  echo "  cd worker"
  echo "  npm run dev"
  echo ""
  exit 1
fi
echo -e "${GREEN}✓ Worker is running${NC}"
echo ""

# 2. Check if FFmpeg is installed
echo -e "${YELLOW}[2/5] Checking FFmpeg installation...${NC}"
if ! command -v ffmpeg &> /dev/null; then
  echo -e "${RED}✗ FFmpeg is not installed${NC}"
  echo ""
  echo "Install FFmpeg:"
  echo "  brew install ffmpeg          # macOS"
  echo "  sudo apt install ffmpeg      # Ubuntu/Debian"
  echo ""
  exit 1
fi
FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
echo -e "${GREEN}✓ $FFMPEG_VERSION${NC}"
echo ""

# 3. Check if samples exist
echo -e "${YELLOW}[3/5] Checking sample files...${NC}"
SAMPLES_DIR="$SCRIPT_DIR/../../samples"
if [ ! -d "$SAMPLES_DIR" ]; then
  echo -e "${RED}✗ Samples directory not found${NC}"
  exit 1
fi

REQUIRED_SAMPLES=("bee1920.mp4" "book1920.mp4")
if [ "$TIMELINE_TYPE" = "complex" ]; then
  REQUIRED_SAMPLES+=("cows1920.mp4" "flowers1920.mp4" "ever.mp3" "weekend.mp3" "flower.png")
fi

MISSING_SAMPLES=()
for sample in "${REQUIRED_SAMPLES[@]}"; do
  if [ ! -f "$SAMPLES_DIR/$sample" ]; then
    MISSING_SAMPLES+=("$sample")
  fi
done

if [ ${#MISSING_SAMPLES[@]} -gt 0 ]; then
  echo -e "${RED}✗ Missing sample files:${NC}"
  for sample in "${MISSING_SAMPLES[@]}"; do
    echo "  - $sample"
  done
  exit 1
fi
echo -e "${GREEN}✓ All required samples found${NC}"
echo ""

# 4. Generate FFmpeg command
echo -e "${YELLOW}[4/5] Generating FFmpeg command...${NC}"
TIMELINE_FILE="$SCRIPT_DIR/../test/fixtures/${TIMELINE_TYPE}-timeline.json"
RESPONSE=$(curl -s -X POST http://localhost:8787/build \
  -H "Content-Type: application/json" \
  -d @"$TIMELINE_FILE")

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}✗ API error:${NC}"
  echo "$RESPONSE" | jq .
  exit 1
fi

COMMAND=$(echo "$RESPONSE" | jq -r '.command')
WARNINGS=$(echo "$RESPONSE" | jq -r '.warnings[]?' 2>/dev/null)

if [ -n "$WARNINGS" ]; then
  echo -e "${YELLOW}Warnings:${NC}"
  echo "$WARNINGS"
  echo ""
fi

# Save command
CMD_SCRIPT="$SCRIPT_DIR/ffmpeg-${TIMELINE_TYPE}.sh"
echo "$COMMAND" > "$CMD_SCRIPT"
chmod +x "$CMD_SCRIPT"
echo -e "${GREEN}✓ Command generated and saved to: $CMD_SCRIPT${NC}"
echo ""

# 5. Execute FFmpeg
echo -e "${YELLOW}[5/5] Executing FFmpeg command...${NC}"
cd "$SCRIPT_DIR/../.."

# Show first few lines of command
echo "Command preview:"
echo "$COMMAND" | head -n 5
echo "..."
echo ""

# Execute with progress
bash "$CMD_SCRIPT"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}=== ✓ SUCCESS ===${NC}"

  OUTPUT_FILE="output.mp4"
  if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE" 2>/dev/null)
    DURATION_INT=${DURATION%.*}

    echo ""
    echo "Output file: $OUTPUT_FILE"
    echo "Size: $FILE_SIZE"
    echo "Duration: ${DURATION_INT}s"
    echo ""
    echo "Play with:"
    echo -e "  ${BLUE}ffplay $OUTPUT_FILE${NC}"
    echo -e "  ${BLUE}open $OUTPUT_FILE${NC}"
    echo ""
    echo "Video info:"
    ffprobe -v error -select_streams v:0 \
      -show_entries stream=width,height,r_frame_rate,codec_name \
      -of default=noprint_wrappers=1 "$OUTPUT_FILE" 2>/dev/null | \
      sed 's/^/  /'
  fi
else
  echo ""
  echo -e "${RED}=== ✗ FAILED ===${NC}"
  echo "Check the error messages above"
  exit 1
fi
