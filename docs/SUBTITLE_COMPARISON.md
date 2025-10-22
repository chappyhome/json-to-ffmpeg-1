# 字幕方案对比：硬字幕 vs 软字幕

## 概述

FFmpeg有两种主要的字幕处理方式，各有优缺点。

## 方案1：硬字幕（Hard-coded/Burned-in Subtitles）

### 当前实现方式

**使用 `subtitles` 滤镜将字幕烧录到视频画面中**

```bash
# 步骤1: 下载字幕（如果是URL）
curl -o ./tmp/subtitle.srt "https://r2.dev/subtitle.srt"

# 步骤2: 烧录字幕
ffmpeg -i video.mp4 \
  -vf "subtitles=filename='./tmp/subtitle.srt':force_style='FontName=Arial,FontSize=28,PrimaryColour=&HFFFFFFFF,BackColour=&H99000000,Alignment=2,MarginV=30'" \
  -c:v libx264 \
  -c:a copy \
  output.mp4
```

### 优点

✅ **完全的样式控制**
```
- 字体族：Arial, Helvetica, 任何系统字体
- 字号：精确到像素
- 颜色：RGB + Alpha通道
- 位置：上/中/下 + 精确边距
- 描边：颜色 + 宽度
- 阴影：颜色 + 模糊 + 偏移
- 背景框：颜色 + 透明度 + 圆角
```

✅ **100%播放器兼容**
- 所有播放器都能看到字幕
- Web播放器完美支持
- 移动设备完美支持
- 不需要播放器支持字幕功能

✅ **视觉一致性**
- 所有用户看到相同的字幕样式
- 不受播放器设置影响
- 适合品牌视频、教程视频

### 缺点

❌ **需要预下载**
- HTTP URL字幕必须先下载到本地
- 增加了一个下载步骤
- 需要临时存储空间

❌ **字幕无法关闭**
- 字幕永久烧录在视频中
- 用户无法关闭字幕
- 不适合不需要字幕的场景

❌ **无多语言支持**
- 每个语言需要单独渲染视频
- 无法在播放时切换语言

❌ **需要重编码**
- 必须重新编码视频流
- 处理时间较长
- 输出文件可能更大

❌ **无法修改**
- 字幕错误无法修正（需要重新渲染）
- 无法后期调整样式

### 适用场景

- 📺 社交媒体短视频（TikTok, Instagram, YouTube Shorts）
- 🎓 在线教程和培训视频
- 📢 广告和营销视频
- 🌐 需要保证所有用户看到字幕的场景
- 🎨 需要精确控制字幕样式的场景
- 📱 移动端优先的视频内容

---

## 方案2：软字幕（Soft Subtitles/Embedded Subtitle Stream）

### 实现方式

**将字幕作为独立的流嵌入到视频容器中**

```bash
# 直接使用URL - 不需要下载！
ffmpeg -i video.mp4 \
  -i https://r2.dev/subtitle.srt \
  -c:v copy \
  -c:a copy \
  -c:s mov_text \
  -metadata:s:s:0 language=eng \
  output.mp4
```

### 多语言示例

```bash
ffmpeg -i video.mp4 \
  -i https://r2.dev/subtitle-en.srt \
  -i https://r2.dev/subtitle-zh.srt \
  -i https://r2.dev/subtitle-es.srt \
  -c:v copy \
  -c:a copy \
  -c:s mov_text \
  -metadata:s:s:0 language=eng \
  -metadata:s:s:1 language=chi \
  -metadata:s:s:2 language=spa \
  output.mp4
```

### 优点

✅ **直接支持HTTP URL**
- 不需要预先下载
- 减少处理步骤
- 节省临时存储

✅ **字幕可以开关**
- 用户可以关闭字幕
- 提供更好的观看体验
- 适合可选字幕场景

✅ **多语言支持**
- 一个视频文件包含多个语言
- 播放时切换语言
- 减少存储空间

✅ **不需要重编码**
- 使用 `-c:v copy -c:a copy`
- 处理速度极快
- 保持原始视频质量
- 文件大小几乎不变（只增加字幕流）

✅ **可以后期修改**
- 可以提取字幕流
- 可以替换字幕流
- 可以移除字幕流

### 缺点

❌ **样式控制极其有限**
```
mov_text 编解码器限制：
- 字体：播放器决定（通常是系统默认）
- 字号：播放器决定
- 颜色：基本控制，但播放器可能忽略
- 位置：底部居中（无法自定义）
- 描边：不支持
- 阴影：不支持
- 背景框：不支持
```

❌ **播放器兼容性问题**
- Web播放器支持有限（video.js需要配置）
- 某些移动播放器不支持
- 浏览器原生支持参差不齐
- 需要JavaScript辅助显示

❌ **容器格式限制**
```
字幕流支持：
- MP4 (mov_text) ✅
- MKV (srt, ass, ssa) ✅
- WebM ❌ 不支持字幕流
- FLV ❌ 不支持字幕流
```

❌ **样式不一致**
- 不同播放器显示不同
- 用户设置会影响显示
- 无法保证视觉一致性

### 适用场景

- 🎬 电影和电视剧
- 📹 长视频内容（>10分钟）
- 🌍 多语言国际化内容
- 💾 存储空间有限
- ⚡ 需要快速处理
- 🎮 需要字幕开关功能

---

## 样式对比示例

### 硬字幕样式示例

```typescript
// 完全自定义
{
  subtitleStyle: {
    fontFamily: "Arial",           // ✅ 精确控制
    fontSize: 28,                   // ✅ 精确像素
    fontColor: "#FFFFFF",           // ✅ 任意颜色
    backgroundColor: "#00000099",   // ✅ 含透明度
    position: "bottom",             // ✅ 上/中/下
    marginV: 30                     // ✅ 精确边距
  }
}
```

**渲染效果：**
```
┌─────────────────────────────────┐
│                                 │
│         Video Content           │
│                                 │
│  ┌───────────────────────────┐  │
│  │  白色文字，黑色半透明背景  │  │ ← 30px边距
└──┴───────────────────────────┴──┘
   Arial 28px, #FFF on #00000099
```

### 软字幕样式示例

```bash
# 样式控制非常有限
-c:s mov_text -metadata:s:s:0 language=eng
```

**渲染效果：**
```
┌─────────────────────────────────┐
│                                 │
│         Video Content           │
│                                 │
│  播放器决定的样式（通常很基础）  │
└─────────────────────────────────┘
   取决于播放器设置
```

---

## 技术实现对比

### 处理时间对比

**测试场景：** 1080p视频，10分钟，添加英文字幕

| 方案 | 处理时间 | CPU使用 | 备注 |
|------|---------|---------|------|
| 硬字幕 | ~8-15分钟 | 高 | 需要重编码视频 |
| 软字幕 | ~10-30秒 | 低 | 仅复制流+添加字幕 |

### 文件大小对比

**测试场景：** 1080p视频，100MB原始文件

| 方案 | 输出大小 | 增量 | 备注 |
|------|---------|------|------|
| 硬字幕 | 95-110MB | ±10% | 取决于编码参数 |
| 软字幕 | 100.1MB | +0.1% | 字幕流很小（~50KB） |

### URL支持对比

```bash
# 硬字幕 - subtitles滤镜不支持URL
curl -o ./tmp/sub.srt "https://r2.dev/sub.srt"  # ❌ 必须先下载
ffmpeg -i video.mp4 -vf "subtitles=./tmp/sub.srt" out.mp4

# 软字幕 - 输入流支持URL
ffmpeg -i video.mp4 -i "https://r2.dev/sub.srt" -c:s mov_text out.mp4  # ✅ 直接使用
```

---

## Web播放器支持

### 硬字幕（Burned-in）

```html
<!-- 100%兼容 - 字幕已在视频中 -->
<video controls>
  <source src="video-with-hardcoded-subs.mp4" type="video/mp4">
</video>
```

✅ **无需任何配置，开箱即用**

### 软字幕（mov_text）

```html
<!-- 需要JavaScript支持 -->
<video id="player" controls>
  <source src="video-with-soft-subs.mp4" type="video/mp4">
  <track kind="subtitles" src="extracted-subtitle.vtt" srclang="en" label="English">
</video>

<script>
  // 浏览器对MP4内嵌字幕支持有限
  // 通常需要video.js等播放器库
  videojs('player', {
    textTrackSettings: true
  });
</script>
```

⚠️ **需要额外配置和库支持**

---

## 推荐选择

### 选择硬字幕（当前实现）如果你需要：

1. ✅ **完全控制字幕样式**（字体、颜色、位置等）
2. ✅ **确保所有用户都能看到字幕**
3. ✅ **品牌一致性**（固定样式）
4. ✅ **社交媒体分发**（TikTok, Instagram等）
5. ✅ **简单的Web播放**（无需额外配置）

**典型场景：**
- 教育培训视频
- 营销广告视频
- 社交媒体内容
- 产品演示视频

### 选择软字幕如果你需要：

1. ✅ **快速处理**（不重编码）
2. ✅ **多语言支持**（一个文件多个语言）
3. ✅ **字幕可选**（用户可以关闭）
4. ✅ **节省存储**（不增加文件大小）
5. ✅ **后期可修改**（替换字幕）

**典型场景：**
- 电影和电视剧
- 多语言国际内容
- 长视频内容
- 专业视频平台

---

## 混合方案

有些场景可能需要**同时提供**两种版本：

```bash
# 生成硬字幕版本（社交媒体）
ffmpeg -i video.mp4 \
  -vf "subtitles=subtitle.srt:force_style='...'" \
  video-hardcoded.mp4

# 生成软字幕版本（网站播放）
ffmpeg -i video.mp4 \
  -i subtitle.srt \
  -c:v copy -c:s mov_text \
  video-softcoded.mp4
```

**用途：**
- 硬字幕版本 → 上传到Instagram/TikTok
- 软字幕版本 → 网站播放，提供多语言选择

---

## 结论

| 需求 | 推荐方案 | 原因 |
|------|---------|------|
| 样式控制 | 硬字幕 ⭐⭐⭐ | 完全控制 vs 几乎无控制 |
| 处理速度 | 软字幕 ⭐⭐⭐ | 30秒 vs 15分钟 |
| 多语言 | 软字幕 ⭐⭐⭐ | 一个文件 vs 多个文件 |
| 兼容性 | 硬字幕 ⭐⭐⭐ | 100% vs 依赖播放器 |
| 文件大小 | 软字幕 ⭐⭐⭐ | +0.1% vs ±10% |
| URL支持 | 软字幕 ⭐⭐⭐ | 直接支持 vs 需要下载 |

**当前项目选择硬字幕的原因：**
1. 用户明确需要自定义样式（fontSize, fontColor等）
2. 目标场景是教程、营销视频（需要样式一致性）
3. 社交媒体分发（需要100%兼容）
4. Cloudflare Workers场景可以快速下载R2文件

**如果未来需要软字幕支持，可以添加 `subtitleMode` 选项：**
```typescript
{
  audioType: "narration",
  subtitleMode: "hard" | "soft",  // 新增选项
  subtitleUrl: "https://...",
  subtitleStyle: { ... }  // 仅在hard模式有效
}
```
