# 字体配置说明

## 两种字体配置方式

### ✅ 方式 1: 使用系统字体名称（推荐）

```json
{
  "inputs": {
    "text_title": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "Hello World",
        "fontFamily": "Arial"
      }
    }
  }
}
```

**生成的 FFmpeg 命令：**
```bash
drawtext=text='Hello World':font='Arial':fontsize=48:fontcolor=0xFFFFFF
```

**优点：**
- ✅ 跨平台兼容（macOS, Linux, Windows）
- ✅ FFmpeg 自动在系统中查找字体
- ✅ 配置简单
- ✅ 不需要知道具体的字体文件路径

**常用字体名称：**
- `Arial`
- `Helvetica`
- `Times New Roman`
- `Courier`
- `Verdana`

---

### ✅ 方式 2: 指定字体文件路径

```json
{
  "inputs": {
    "text_custom": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "Custom Font",
        "fontFile": "/System/Library/Fonts/Supplemental/Arial.ttf"
      }
    }
  }
}
```

**生成的 FFmpeg 命令：**
```bash
drawtext=text='Custom Font':fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:fontsize=48
```

**优点：**
- ✅ 精确控制使用哪个字体文件
- ✅ 可以使用自定义字体（.ttf, .otf 等）
- ✅ 不依赖系统字体配置

**字体文件路径示例：**

**macOS:**
```
/System/Library/Fonts/Supplemental/Arial.ttf
/Library/Fonts/Arial.ttf
~/Library/Fonts/CustomFont.ttf
```

**Linux:**
```
/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf
~/.fonts/CustomFont.ttf
```

**Windows:**
```
C:/Windows/Fonts/arial.ttf
C:/Windows/Fonts/msyh.ttc  (微软雅黑)
```

---

## 优先级规则

如果同时指定了 `fontFile` 和 `fontFamily`，**`fontFile` 优先**：

```json
{
  "metadata": {
    "text": "Test",
    "fontFamily": "Arial",
    "fontFile": "/path/to/custom.ttf"
  }
}
```

将使用 `/path/to/custom.ttf`，忽略 `fontFamily`。

---

## 完整示例

### 示例 1: 混合使用两种方式

```json
{
  "version": 1,
  "inputs": {
    "source1": {
      "type": "video",
      "file": "samples/bee1920.mp4",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 40
    },
    "text_system_font": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "使用系统字体",
        "fontFamily": "Arial",
        "fontSize": 60,
        "fontColor": "#FFFFFF"
      }
    },
    "text_custom_font": {
      "type": "text",
      "file": "",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "text": "使用自定义字体",
        "fontFile": "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "fontSize": 48,
        "fontColor": "#00FF00"
      }
    }
  },
  "tracks": {
    "video_track": {
      "type": "video",
      "clips": [
        {
          "name": "bg",
          "source": "source1",
          "timelineTrackStart": 0,
          "duration": 6,
          "sourceStartOffset": 0,
          "clipType": "video",
          "transform": {
            "x": 0,
            "y": 0,
            "width": 1920,
            "height": 1080,
            "rotation": 0,
            "opacity": 1
          }
        }
      ]
    },
    "text_track_1": {
      "type": "video",
      "clips": [
        {
          "name": "system_text",
          "source": "text_system_font",
          "timelineTrackStart": 0.5,
          "duration": 2.5,
          "sourceStartOffset": 0,
          "clipType": "text",
          "transform": {
            "x": 660,
            "y": 200,
            "width": 600,
            "height": 100,
            "rotation": 0,
            "opacity": 1
          }
        }
      ]
    },
    "text_track_2": {
      "type": "video",
      "clips": [
        {
          "name": "custom_text",
          "source": "text_custom_font",
          "timelineTrackStart": 3.5,
          "duration": 2.5,
          "sourceStartOffset": 0,
          "clipType": "text",
          "transform": {
            "x": 360,
            "y": 800,
            "width": 1200,
            "height": 80,
            "rotation": 0,
            "opacity": 0.9
          }
        }
      ]
    }
  },
  "transitions": [],
  "output": {
    "tempDir": "./tmp",
    "file": "output.mp4",
    "videoCodec": "libx264",
    "audioCodec": "aac",
    "width": 1920,
    "height": 1080,
    "audioBitrate": "320k",
    "preset": "veryfast",
    "crf": 23,
    "framerate": 30,
    "flags": ["-pix_fmt", "yuv420p"],
    "startPosition": 0,
    "endPosition": 6,
    "scaleRatio": 0.2
  }
}
```

---

## 注意事项

1. **字体文件路径必须存在**
   - 如果指定了 `fontFile`，确保路径正确且文件存在
   - 否则 FFmpeg 会报错

2. **系统字体查找**
   - 使用 `fontFamily` 时，FFmpeg 会在系统字体目录中查找
   - 不同系统的字体名称可能不同

3. **字体格式支持**
   - `.ttf` (TrueType Font)
   - `.otf` (OpenType Font)
   - `.ttc` (TrueType Collection)

4. **测试字体是否可用**
   ```bash
   # 查看 FFmpeg 可用的字体
   ffmpeg -list_fonts

   # 或使用 fc-list (Linux/macOS)
   fc-list | grep Arial
   ```

---

## 快速参考

| 配置项 | 用途 | 示例 |
|--------|------|------|
| `fontFamily` | 系统字体名称 | `"Arial"`, `"Helvetica"` |
| `fontFile` | 字体文件路径 | `"/path/to/font.ttf"` |
| 优先级 | `fontFile` > `fontFamily` | - |

## 相关文档

- [TEXT_RENDERING_IMPLEMENTATION.md](TEXT_RENDERING_IMPLEMENTATION.md) - 实现细节
- [worker/test/fixtures/text-timeline-custom-font.json](worker/test/fixtures/text-timeline-custom-font.json) - 完整示例

