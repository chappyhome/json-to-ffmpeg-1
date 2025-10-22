# 综合功能测试使用指南

## 🚀 快速开始

### 1. 运行综合测试

```bash
# 确保已构建项目
npm run build

# 运行综合测试
node test-comprehensive.js
```

### 2. 查看测试报告

测试会自动显示：
- ✅ 已通过的功能（绿色）
- ❌ 失败的功能（红色）
- 详细的功能验证报告
- Timeline时间轴可视化
- 执行步骤和检查清单

### 3. 生成测试视频

```bash
# 执行生成的FFmpeg命令
chmod +x test-comprehensive-output.sh
./test-comprehensive-output.sh

# 播放查看效果
ffplay output-comprehensive-test.mp4
```

---

## 📊 当前功能状态

### ✅ 完全可用的功能（11/17 = 65%）

#### 🎵 音频类型分类 (Audio Types)

**1. BGM - 背景音乐**
```json
{
  "type": "audio",
  "file": "bgm.mp3",
  "metadata": {
    "audioType": "bgm",
    "loop": true,         // 自动循环
    "fadeIn": 2.0,        // 淡入2秒
    "fadeOut": 2.0        // 淡出2秒
  }
}
```
✅ **状态**: 完全支持
- 自动循环播放
- 淡入淡出效果
- 音量控制

**2. SFX - 音效**
```json
{
  "type": "audio",
  "file": "click.wav",
  "metadata": {
    "audioType": "sfx",
    "fadeIn": 0.05,
    "fadeOut": 0.05
  }
}
```
✅ **状态**: 完全支持
- 精确时间点触发
- 支持多个SFX
- 独立淡入淡出

**3. Narration - 旁白**
```json
{
  "type": "audio",
  "file": "narration.mp3",
  "metadata": {
    "audioType": "narration",
    "fadeIn": 0.3,
    "fadeOut": 0.3,
    "subtitleUrl": "https://example.com/subtitle.srt",
    "language": "zh"
  }
}
```
✅ **状态**: 完全支持
- 软字幕自动嵌入
- 多语言支持
- 播放器可切换字幕

#### 🖼️ 动画图片支持 (Image Types)

**1. 静态图片**
```json
{
  "type": "image",
  "file": "logo.png",
  "metadata": {
    "imageType": "static"
  }
}
```
✅ **状态**: 完全支持
- PNG/JPG/BMP等格式
- 缩放、位置、透明度
- 多层叠加

**2. GIF动画**
```json
{
  "type": "image",
  "file": "loading.gif",
  "metadata": {
    "imageType": "animated",
    "loop": true,
    "frameRate": 10
  }
}
```
✅ **状态**: 完全支持
- GIF循环播放
- 帧率控制
- 动画叠加

#### 🎬 高级功能

✅ **多轨叠加**: 支持多条视频轨道叠加
✅ **软字幕流**: 字幕作为独立流，可切换
✅ **时间轴同步**: 所有clips精确同步
✅ **音量控制**: 每条音轨独立音量

---

### ❌ 待修复功能（6/17 = 35%）

#### 📝 文本渲染 (Text Rendering)

**⚠️ 已知问题**: 文本类型在预处理时输出`undefined`

**期望用法**:
```json
{
  "type": "text",
  "duration": 3,
  "metadata": {
    "text": "标题文字",
    "fontSize": 72,
    "fontColor": "#FFFFFF",
    "fontFamily": "Arial",
    "x": "center",
    "y": "center",
    "strokeColor": "#000000",
    "strokeWidth": 2,
    "shadowColor": "#000000",
    "shadowX": 3,
    "shadowY": 3
  }
}
```

**当前状态**: ❌ 不可用
- 配置正确，但未生成FFmpeg命令
- 输出`-i undefined`
- drawtext滤镜未集成

**修复进度**: 待修复（优先级: 高）

---

## 🧪 测试场景详解

### Timeline配置

综合测试创建了一个**20秒**的复杂视频，包含：

```
🎬 视频轨道:
├── Main Track: 主视频 (0-20s)
├── Overlay Track 1:
│   ├── Title Text (1-4s) ← ❌ 待修复
│   ├── Static Image (5-8s) ← ✅ 正常
│   └── Animated GIF (9-12s) ← ✅ 正常
└── Overlay Track 2:
    └── Subtitle Text (2-7s) ← ❌ 待修复

🎵 音频轨道:
├── BGM Track: 背景音乐 (0-20s, 30%) ← ✅ 正常
├── Narration Track: 中文旁白 (2-12s, 100%) + 字幕 ← ✅ 正常
└── SFX Track: 音效
    ├── Click (1s, 80%) ← ✅ 正常
    ├── Whoosh (5s, 70%) ← ✅ 正常
    └── Click (9s, 80%) ← ✅ 正常
```

### 时间轴事件

| 时间 | 视觉 | 音频 |
|-----|------|------|
| 0-1s | 主视频 | BGM淡入 |
| 1s | ~~主标题出现~~ (文本待修复) | 点击音效 |
| 1-4s | ~~主标题显示~~ | BGM继续 |
| 2s | ~~副标题出现~~ (文本待修复) | Narration开始 |
| 2-7s | ~~副标题显示~~ | Narration + 字幕 |
| 5s | Logo图片出现 (左上角) | Whoosh音效 |
| 5-8s | Logo显示 | Narration继续 |
| 9s | GIF动画出现 (右上角) | 点击音效 |
| 9-12s | GIF循环播放 | Narration结束 |
| 18-20s | 主视频 | BGM淡出 |

---

## 📋 功能验证清单

### 执行视频后检查

播放生成的`output-comprehensive-test.mp4`，验证：

**音频（5项）**:
- [ ] BGM从头到尾循环播放，音量适中
- [ ] BGM在0-2秒淡入，18-20秒淡出
- [ ] 在1秒、5秒、9秒听到音效
- [ ] 2-12秒中文Narration清晰播放
- [ ] 中文字幕可以在播放器中切换显示（按"v"键）

**图片（3项）**:
- [ ] 5-8秒左上角显示静态logo图片
- [ ] 9-12秒右上角显示循环GIF动画
- [ ] 图片缩放和透明度正确

**文本（2项）** - ❌ 当前不可用:
- [ ] ~~1-4秒中心显示大标题~~
- [ ] ~~2-7秒底部显示副标题~~

**整体（2项）**:
- [ ] 所有元素时间同步正确
- [ ] 视频流畅，无卡顿或错误

---

## 🔧 故障排查

### 问题1: 文本不显示

**症状**: 视频中没有文本，命令显示`-i undefined`

**原因**: 文本渲染功能待修复

**临时解决方案**: 使用图片代替文本，或等待修复

### 问题2: 字幕和语音不同步

**症状**: 字幕显示时间与语音不匹配

**原因**: SRT时间码需要调整到timeline位置

**解决方案**: 参考 `docs/SOFT_SUBTITLE_TIMING.md`
- Narration从2秒开始 → SRT时间码应该从00:00:02开始

### 问题3: GIF不循环

**症状**: GIF只播放一次

**检查**: 命令中是否有`-ignore_loop 0`

**解决方案**: 确保metadata中设置`"loop": true`

### 问题4: BGM太短

**症状**: BGM在视频结束前停止

**检查**:
1. BGM源文件是否足够长
2. metadata中是否设置`"loop": true`

---

## 📚 相关文档

### 功能文档
- [音频类型分类](docs/AUDIO_TYPES.md)
- [Narration with Soft Subtitles](docs/NARRATION.md)
- [字幕时间同步指南](docs/SOFT_SUBTITLE_TIMING.md)
- [文本渲染](docs/TEXT_RENDERING.md) ← 功能待修复
- [GIF动画](docs/GIF_ANIMATION.md)

### 测试文档
- [测试结果报告](COMPREHENSIVE_TEST_RESULTS.md) - 详细分析
- [字幕对比](docs/SUBTITLE_COMPARISON.md) - 软字幕 vs 硬字幕

### 示例文件
- `worker/test/fixtures/comprehensive-test.json` - 完整测试timeline
- `worker/test/fixtures/narration-zh-only.json` - 纯中文Narration
- `worker/test/fixtures/soft-subtitle-timeline.json` - 多语言字幕

---

## 🎯 推荐使用场景

### 当前可用（推荐使用）

1. **教程视频 + 多语言字幕**
   ```
   视频 + BGM + 中文Narration + 软字幕（可切换中英文）
   ```

2. **产品演示 + Logo水印**
   ```
   演示视频 + BGM + 品牌Logo图片叠加
   ```

3. **社交媒体短视频**
   ```
   主视频 + BGM + 音效触发 + GIF动画点缀
   ```

### 等待修复后可用

4. **动态标题视频**（需要文本渲染）
   ```
   视频 + 动态标题文字 + BGM
   ```

5. **字幕样式视频**（需要文本渲染）
   ```
   视频 + 自定义样式字幕（非SRT）
   ```

---

## 💡 最佳实践

### 1. 音频混合
- BGM音量设置为 0.2-0.4
- Narration音量保持 1.0
- SFX音量设置为 0.6-0.8

### 2. Narration字幕同步
- 让Narration从0秒开始（避免时间码调整）
- 或者使用工具调整SRT时间码
- 参考：`docs/SOFT_SUBTITLE_TIMING.md`

### 3. 图片叠加
- 使用PNG格式支持透明度
- GIF动画控制在5秒以内
- 注意图片位置避免遮挡重要内容

### 4. Timeline规划
```
0-2s:  开场（BGM淡入）
2-10s: 主要内容（Narration + 字幕）
10-18s: 补充内容（GIF动画、Logo）
18-20s: 结尾（BGM淡出）
```

---

## 🔄 更新日志

**2025-10-22**:
- ✅ 创建综合功能测试脚本
- ✅ 验证音频类型分类（BGM/SFX/Narration）
- ✅ 验证图片支持（静态/GIF动画）
- ✅ 验证软字幕功能
- ⚠️ 发现文本渲染功能待修复
- 📝 创建详细测试报告和指南

---

## 📞 获取帮助

如果遇到问题：
1. 查看 `COMPREHENSIVE_TEST_RESULTS.md` 了解已知问题
2. 查看相关功能文档（`docs/`目录）
3. 检查生成的FFmpeg命令（`test-comprehensive-output.sh`）
4. 提交Issue并附上timeline JSON配置
