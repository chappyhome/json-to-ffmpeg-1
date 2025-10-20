# 文本渲染功能

## 概述

文本渲染功能允许您在视频中添加动态文本，无需外部字体文件。文本通过 FFmpeg 的 `drawtext` 滤镜实时生成。

## 特性

- ✅ 支持自定义文本内容
- ✅ 可配置字体、大小、颜色
- ✅ 支持文本描边（stroke）
- ✅ 支持阴影效果
- ✅ 支持背景框
- ✅ 支持透明度控制
- ✅ 支持旋转

## 使用方法

### 1. 定义文本源 (Source)

在 `inputs` 中添加 `type: "text"` 的源：

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
        "text": "Hello World!",
        "fontFamily": "Arial",
        "fontSize": 72,
        "fontColor": "#FFFFFF",
        "backgroundColor": "#00000080",
        "stroke": {
          "color": "#000000",
          "width": 2
        },
        "shadow": {
          "color": "#00000080",
          "blur": 4,
          "offsetX": 2,
          "offsetY": 2
        }
      }
    }
  }
}
```

### 2. 在轨道中使用文本 Clip

```json
{
  "tracks": {
    "text_track": {
      "type": "video",
      "clips": [
        {
          "name": "title_text",
          "source": "text_title",
          "timelineTrackStart": 0.5,
          "duration": 3.0,
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
    }
  }
}
```

## 文本元数据配置

### TextMetadata 类型定义

```typescript
export type TextMetadata = {
  text: string;                    // 必填：文本内容
  fontFamily?: string;              // 字体名称（默认：Arial）
  fontSize?: number;                // 字体大小（默认：48）
  fontColor?: string;               // 文字颜色（默认：#FFFFFF）
  backgroundColor?: string;         // 背景颜色（可选）
  textAlign?: "left" | "center" | "right";  // 对齐方式（默认：left）
  fontWeight?: "normal" | "bold";   // 字重（默认：normal）
  stroke?: {                        // 描边
    color: string;
    width: number;
  };
  shadow?: {                        // 阴影
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  boxPadding?: number;              // 背景框内边距（默认：10）
};
```

### 颜色格式

支持以下颜色格式：
- `#RGB` - 例如：`#F00`（红色）
- `#RRGGBB` - 例如：`#FF0000`（红色）
- `#RRGGBBAA` - 例如：`#FF000080`（半透明红色）

颜色会自动转换为 FFmpeg 支持的格式。

## 完整示例

查看 [text-timeline.json](../worker/test/fixtures/text-timeline.json) 获取完整的示例配置。

## 测试

使用以下命令测试文本渲染功能：

```bash
# 生成 FFmpeg 命令
node test-text-rendering.js

# 查看生成的命令
cat test-text-output.sh
```

## 注意事项

1. **字体路径**: 当前实现使用系统字体路径 `/System/Library/Fonts/Supplemental/`，主要适用于 macOS。对于其他系统，可能需要调整字体路径。

2. **文本转义**: 文本中的特殊字符会自动转义，支持：
   - 反斜杠 `\`
   - 单引号 `'`
   - 冒号 `:`
   - 换行符 `\n`

3. **性能**: 文本通过 FFmpeg 的 `drawtext` 滤镜实时生成，不需要额外的输入文件。

4. **对齐**: 目前文本对齐通过 `x` 和 `y` 坐标控制。未来可能会添加更智能的对齐选项。

## 与其他功能的集成

文本 clip 可以与其他 video clip 组合使用：
- 可以添加到多个轨道
- 支持透明度混合
- 支持旋转变换
- 可以与过渡效果配合使用

## 未来增强

- [ ] 自动文本对齐（center/left/right）
- [ ] 文本动画效果
- [ ] 更多字体样式
- [ ] 字幕文件支持（SRT/ASS）
- [ ] 文本滚动效果
