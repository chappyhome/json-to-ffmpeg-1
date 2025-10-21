# GIF 动画支持

## 概述

json-to-ffmpeg 现在完全支持动画 GIF 和静态图片的渲染。通过 `ImageMetadata`，您可以精确控制 GIF 的循环行为、帧率等属性。

## 特性

- ✅ 支持静态图片 (PNG, JPG)
- ✅ 支持动画 GIF
- ✅ 可配置循环播放
- ✅ 自定义帧率
- ✅ 支持位置、缩放、旋转、透明度
- ✅ 向后兼容（没有 metadata 的图片默认为静态）

## 使用方法

### 1. 静态图片

静态图片会被扩展到指定的 duration，就像单帧视频一样。

```json
{
  "inputs": {
    "watermark": {
      "type": "image",
      "file": "samples/flower.png",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0,
      "metadata": {
        "imageType": "static",
        "format": "png"
      }
    }
  },
  "tracks": {
    "watermark_track": {
      "type": "video",
      "clips": [
        {
          "name": "watermark_clip",
          "source": "watermark",
          "timelineTrackStart": 0,
          "duration": 10,
          "sourceStartOffset": 0,
          "clipType": "image",
          "transform": {
            "x": 1620,
            "y": 10,
            "width": 280,
            "height": 140,
            "rotation": 0,
            "opacity": 0.8
          }
        }
      ]
    }
  }
}
```

### 2. 循环的动画 GIF

设置 `loop: true` 使 GIF 无限循环播放。如果 GIF 的原始时长短于 clip 的 duration，它会自动重复播放。

```json
{
  "inputs": {
    "animated_emoji": {
      "type": "image",
      "file": "samples/emoji.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 2.5,
      "metadata": {
        "imageType": "animated",
        "format": "gif",
        "loop": true,
        "frameRate": 24
      }
    }
  },
  "tracks": {
    "emoji_track": {
      "type": "video",
      "clips": [
        {
          "name": "emoji_clip",
          "source": "animated_emoji",
          "timelineTrackStart": 2,
          "duration": 5,
          "sourceStartOffset": 0,
          "clipType": "image",
          "transform": {
            "x": 50,
            "y": 50,
            "width": 200,
            "height": 200,
            "rotation": 0,
            "opacity": 1
          }
        }
      ]
    }
  }
}
```

**FFmpeg 命令特点：**
- 输入参数：`-ignore_loop 0 -i samples/emoji.gif` （循环播放）
- 过滤器：`fps=24,loop=2:60,setpts=PTS-STARTPTS,trim=duration=5`

### 3. 只播放一次的 GIF

设置 `loop: false` 使 GIF 只播放一次，不循环。

```json
{
  "inputs": {
    "loading_animation": {
      "type": "image",
      "file": "samples/loading.gif",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 1.0,
      "metadata": {
        "imageType": "animated",
        "format": "gif",
        "loop": false,
        "frameRate": 30
      }
    }
  },
  "tracks": {
    "loading_track": {
      "type": "video",
      "clips": [
        {
          "name": "loading_clip",
          "source": "loading_animation",
          "timelineTrackStart": 8,
          "duration": 2,
          "sourceStartOffset": 0,
          "clipType": "image",
          "transform": {
            "x": 860,
            "y": 490,
            "width": 200,
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

**FFmpeg 命令特点：**
- 输入参数：`-ignore_loop 1 -i samples/loading.gif` （不循环）
- 过滤器：`fps=30,setpts=PTS-STARTPTS,trim=duration=2`

## ImageMetadata 类型定义

```typescript
export type ImageMetadata = {
  imageType?: "static" | "animated";  // 图片类型
  format?: "png" | "jpg" | "gif";     // 图片格式
  loop?: boolean;                      // 是否循环（默认 true）
  frameRate?: number;                  // 帧率（GIF 动画）
};
```

### 属性说明

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `imageType` | "static" \| "animated" | - | 区分静态图片和动画 GIF |
| `format` | "png" \| "jpg" \| "gif" | - | 图片格式标识 |
| `loop` | boolean | true | GIF 循环播放标志 |
| `frameRate` | number | output.framerate | 动画帧率（如 GIF 的 24fps） |

## 完整示例

查看 [gif-timeline.json](../worker/test/fixtures/gif-timeline.json) 获取完整的示例配置，包含：
- 背景视频
- 静态水印图片
- 循环播放的动画 GIF
- 只播放一次的 GIF 动画

## 测试

使用以下命令测试 GIF 动画功能：

```bash
# 生成 FFmpeg 命令
node test-gif-animation.js

# 查看生成的命令
cat test-gif-output.sh

# 执行命令（需要实际的 GIF 文件）
chmod +x test-gif-output.sh
./test-gif-output.sh
```

## FFmpeg 命令生成逻辑

### 静态图片
```bash
# 输入（无特殊参数）
-i samples/flower.png

# 过滤器
loop=loop=300:size=300,setpts=PTS-STARTPTS,fps=30
```

### 循环 GIF
```bash
# 输入（ignore_loop 0 = 循环）
-ignore_loop 0 -i samples/emoji.gif

# 过滤器
fps=24,loop=2:60,setpts=PTS-STARTPTS,trim=duration=5
```

### 不循环 GIF
```bash
# 输入（ignore_loop 1 = 不循环）
-ignore_loop 1 -i samples/loading.gif

# 过滤器
fps=30,setpts=PTS-STARTPTS,trim=duration=2
```

## 实现细节

### 文件修改

1. **parseImageClip.ts** (新文件)
   - 专门处理图片 clips 的逻辑
   - 支持静态图片和动画 GIF
   - 根据 metadata 生成不同的 FFmpeg 过滤器

2. **parseClip.ts**
   - 添加了图片专用路由
   - 将 `clipType === "image"` 路由到 `parseImageClip()`

3. **parseVideoClip.ts**
   - 移除了图片处理逻辑
   - 现在只处理视频 clips

4. **parseInputs.ts**
   - 添加了 GIF 输入参数处理
   - 根据 `metadata.loop` 添加 `-ignore_loop` 参数

### 处理流程

```
JSON Schema
    ↓
parseInputs()
    → 检测 GIF metadata
    → 添加 -ignore_loop 参数
    ↓
parseClip()
    → 路由到 parseImageClip()
    ↓
parseImageClip()
    → 检测 imageType
    → 生成适当的过滤器
    → 静态图片: loop → setpts → fps
    → GIF 动画: fps → loop (如需要) → setpts → trim
    ↓
FFmpeg 命令
```

## 注意事项

1. **GIF 时长**：`duration` 字段应该填写 GIF 的实际时长（秒）
2. **循环行为**：默认 `loop: true`，如果不想循环请明确设置为 `false`
3. **帧率匹配**：建议将 `frameRate` 设置为 GIF 的实际帧率
4. **性能**：GIF 解码比静态图片消耗更多资源
5. **文件大小**：循环的 GIF 不会增加输出文件大小

## 向后兼容

所有现有的图片配置仍然有效：

```json
{
  "inputs": {
    "old_image": {
      "type": "image",
      "file": "samples/flower.png",
      "hasAudio": false,
      "hasVideo": true,
      "duration": 0
      // 没有 metadata，默认为静态图片
    }
  }
}
```

## 与其他功能的集成

图片 clips 可以与其他类型的 clips 组合使用：
- ✅ 可以添加到多个轨道
- ✅ 支持透明度混合
- ✅ 支持旋转变换
- ✅ 可以与过渡效果配合使用
- ✅ 可以叠加在视频或其他图片上

## 未来增强

- [ ] 支持 APNG (Animated PNG)
- [ ] 支持 WebP 动画
- [ ] GIF 优化选项（减少文件大小）
- [ ] 自动检测 GIF 帧率
- [ ] 支持 GIF 帧范围提取

## 相关文档

- [ImageMetadata 类型定义](../src/types/Inputs.ts)
- [parseImageClip 实现](../src/parseImageClip.ts)
- [设计对比](./design/DESIGN_COMPARISON.md)
- [文本渲染文档](./TEXT_RENDERING.md)
