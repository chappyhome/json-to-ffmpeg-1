#!/bin/bash
# JSON-to-FFmpeg Worker /validate 接口测试脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Worker URL（可通过环境变量覆盖）
WORKER_URL="${WORKER_URL:-https://json-to-ffmpeg-worker.sgqjpw2023.workers.dev}"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}JSON-to-FFmpeg Worker /validate 接口测试${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "Worker URL: ${YELLOW}$WORKER_URL${NC}"
echo ""

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_validate() {
  local test_name="$1"
  local json_file="$2"
  local expected_valid="$3"  # "true" 或 "false"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  echo -e "${BLUE}[测试 $TOTAL_TESTS]${NC} $test_name"
  echo -e "文件: ${YELLOW}$json_file${NC}"

  if [ ! -f "$json_file" ]; then
    echo -e "${RED}✗ 文件不存在: $json_file${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo ""
    return 1
  fi

  # 发送请求
  response=$(curl -s -X POST \
    "$WORKER_URL/validate" \
    -H 'Content-Type: application/json' \
    --data-binary "@$json_file")

  # 提取 valid 字段
  valid=$(echo "$response" | jq -r '.valid')

  # 检查结果
  if [ "$valid" == "$expected_valid" ]; then
    echo -e "${GREEN}✓ 通过${NC} - 验证结果符合预期: $expected_valid"
    PASSED_TESTS=$((PASSED_TESTS + 1))

    # 显示警告（如果有）
    warnings=$(echo "$response" | jq -r '.warnings // [] | length')
    if [ "$warnings" -gt 0 ]; then
      echo -e "${YELLOW}警告数量: $warnings${NC}"
      echo "$response" | jq -r '.warnings[]' | while read -r warning; do
        echo -e "  ${YELLOW}⚠${NC} $warning"
      done
    fi
  else
    echo -e "${RED}✗ 失败${NC} - 预期: $expected_valid, 实际: $valid"
    FAILED_TESTS=$((FAILED_TESTS + 1))

    # 显示错误信息
    if [ "$valid" == "false" ]; then
      echo -e "${RED}错误详情:${NC}"
      echo "$response" | jq -r '.errors[]? | "  • [\(.path)] \(.message)"'
    fi
  fi

  echo ""
}

# 测试有效的 JSON
echo -e "${GREEN}========== 有效 JSON 测试 ==========${NC}"
echo ""

test_validate \
  "简单时间线" \
  "worker/test/fixtures/simple-timeline.json" \
  "true"

test_validate \
  "综合功能测试" \
  "worker/test/fixtures/comprehensive-test.json" \
  "true"

test_validate \
  "音频类型测试" \
  "worker/test/fixtures/audio-types-timeline.json" \
  "true"

test_validate \
  "文本渲染测试" \
  "worker/test/fixtures/text-timeline.json" \
  "true"

test_validate \
  "GIF 动画测试" \
  "worker/test/fixtures/gif-timeline.json" \
  "true"

test_validate \
  "旁白字幕测试" \
  "worker/test/fixtures/narration-timeline.json" \
  "true"

# 测试无效的 JSON
echo -e "${RED}========== 无效 JSON 测试 ==========${NC}"
echo ""

test_validate \
  "生成的json测试" \
  "worker/test/fixtures/timeline-hotel_vertical_mix_v1-seed12345.json" \
  "false"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 错误测试 1: version 不等于 1
cat > "$TEMP_DIR/error-version.json" <<'EOF'
{
  "version": 2,
  "inputs": {},
  "tracks": {},
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5
  }
}
EOF

test_validate \
  "错误: version 不等于 1" \
  "$TEMP_DIR/error-version.json" \
  "false"

# 错误测试 2: 缺少必填字段
cat > "$TEMP_DIR/error-missing-output.json" <<'EOF'
{
  "version": 1,
  "inputs": {},
  "tracks": {}
}
EOF

test_validate \
  "错误: 缺少 output 字段" \
  "$TEMP_DIR/error-missing-output.json" \
  "false"

# 错误测试 3: clip name 重复
cat > "$TEMP_DIR/error-duplicate-clip.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "video1": {
      "type": "video",
      "file": "test.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 10
    }
  },
  "tracks": {
    "track1": {
      "type": "video",
      "clips": [
        {
          "name": "clip1",
          "source": "video1",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        },
        {
          "name": "clip1",
          "source": "video1",
          "timelineTrackStart": 5,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 10
  }
}
EOF

test_validate \
  "错误: clip name 重复" \
  "$TEMP_DIR/error-duplicate-clip.json" \
  "false"

# 错误测试 4: source 不存在
cat > "$TEMP_DIR/error-source-not-found.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "video1": {
      "type": "video",
      "file": "test.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 10
    }
  },
  "tracks": {
    "track1": {
      "type": "video",
      "clips": [
        {
          "name": "clip1",
          "source": "video2",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5
  }
}
EOF

test_validate \
  "错误: source 不存在于 inputs" \
  "$TEMP_DIR/error-source-not-found.json" \
  "false"

# 错误测试 5: hasAudio/hasVideo 类型不匹配
cat > "$TEMP_DIR/error-type-mismatch.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "audio1": {
      "type": "audio",
      "file": "test.mp3",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 10
    }
  },
  "tracks": {
    "track1": {
      "type": "audio",
      "clips": [
        {
          "name": "clip1",
          "source": "audio1",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "volume": 1.0
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5
  }
}
EOF

test_validate \
  "错误: hasAudio/hasVideo 与 type 不匹配" \
  "$TEMP_DIR/error-type-mismatch.json" \
  "false"

# 错误测试 6: text 类型缺少 metadata.text
cat > "$TEMP_DIR/error-text-missing-content.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "text1": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "fontSize": 72
      }
    }
  },
  "tracks": {
    "track1": {
      "type": "video",
      "clips": [
        {
          "name": "clip1",
          "source": "text1",
          "timelineTrackStart": 0,
          "duration": 3,
          "sourceStartOffset": 0,
          "clipType": "text",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 3
  }
}
EOF

test_validate \
  "错误: text 类型缺少 metadata.text" \
  "$TEMP_DIR/error-text-missing-content.json" \
  "false"

# 错误测试 7: endPosition <= startPosition
cat > "$TEMP_DIR/error-invalid-positions.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "video1": {
      "type": "video",
      "file": "test.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 10
    }
  },
  "tracks": {
    "track1": {
      "type": "video",
      "clips": [
        {
          "name": "clip1",
          "source": "video1",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 10,
    "endPosition": 5
  }
}
EOF

test_validate \
  "错误: endPosition <= startPosition" \
  "$TEMP_DIR/error-invalid-positions.json" \
  "false"

# 错误测试 8: audio clip 使用了 transform
cat > "$TEMP_DIR/error-audio-with-transform.json" <<'EOF'
{
  "version": 1,
  "inputs": {
    "audio1": {
      "type": "audio",
      "file": "test.mp3",
      "hasAudio": true,
      "hasVideo": false,
      "duration": 10
    }
  },
  "tracks": {
    "track1": {
      "type": "audio",
      "clips": [
        {
          "name": "clip1",
          "source": "audio1",
          "timelineTrackStart": 0,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "audio",
          "transform": {
            "x": 0, "y": 0, "width": 1920, "height": 1080,
            "rotation": 0, "opacity": 1
          }
        }
      ]
    }
  },
  "output": {
    "file": "output.mp4",
    "width": 1920,
    "height": 1080,
    "framerate": 30,
    "startPosition": 0,
    "endPosition": 5
  }
}
EOF

test_validate \
  "错误: audio clip 不应该有 transform" \
  "$TEMP_DIR/error-audio-with-transform.json" \
  "false"

# 打印测试总结
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}测试总结${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}✗ 部分测试失败${NC}"
  exit 1
fi
