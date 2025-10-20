# Scripts 使用说明

## test-text-rendering.js

测试文本渲染功能并生成 FFmpeg 命令。

### 使用方法

**方法 1: 使用 node 命令（推荐）**

```bash
# 从项目根目录运行
node scripts/test-text-rendering.js

# 或从 scripts 目录运行
cd scripts
node test-text-rendering.js
```

**方法 2: 直接执行（需要执行权限）**

```bash
# 添加执行权限（仅需一次）
chmod +x scripts/test-text-rendering.js

# 从项目根目录运行
./scripts/test-text-rendering.js

# 或从 scripts 目录运行
cd scripts
./test-text-rendering.js
```

### ⚠️ 常见错误

**错误 1: 使用 bash 命令**

❌ **错误用法：**
```bash
bash ./scripts/test-text-rendering.js
```

**错误信息：**
```
./scripts/test-text-rendering.js: line 3: syntax error near unexpected token `('
./scripts/test-text-rendering.js: line 3: `const { parseSchema } = require('../dist/src/index.js');'
```

**原因：** `.js` 文件是 JavaScript 文件，需要用 `node` 运行，不能用 `bash` 运行。

✅ **正确用法：**
```bash
node ./scripts/test-text-rendering.js
```

**错误 2: 文件路径错误**

如果看到 `ENOENT: no such file or directory` 错误，确保：
1. 从项目根目录运行脚本
2. 或使用绝对路径

### 输出

脚本会：
1. 读取 `worker/test/fixtures/text-timeline.json`
2. 生成 FFmpeg 命令
3. 在控制台显示完整命令
4. 保存到 `test-text-output.sh`

示例输出：
```
=== Generated FFmpeg Command ===

#!/bin/bash
mkdir -p ./tmp
ffmpeg -y -i samples/bee1920.mp4 -ss 0 -t 8 -r 30 ./tmp/background_clip.mp4
ffmpeg -y \
-i ./tmp/background_clip.mp4 \
-filter_complex "...文本渲染滤镜..."
...

✓ Command saved to /Volumes/工作区/video-project/json-to-ffmpeg/test-text-output.sh
```

### 验证生成的命令

检查 `-i` 参数：
```bash
cat test-text-output.sh | grep "^-i"
```

预期输出（只有一个 -i）：
```
-i ./tmp/background_clip.mp4 \
```

### 执行生成的 FFmpeg 命令

```bash
# 添加执行权限
chmod +x test-text-output.sh

# 执行命令
./test-text-output.sh
```

或直接用 bash：
```bash
bash test-text-output.sh
```

## 其他脚本

### demo-generate-command.js

生成示例视频编辑命令的演示脚本。

```bash
node scripts/demo-generate-command.js
```

## 注意事项

1. **JavaScript vs Shell Script**
   - `.js` 文件用 `node` 运行
   - `.sh` 文件用 `bash` 或 `./` 运行

2. **路径问题**
   - 脚本使用相对于 `scripts/` 目录的路径
   - 建议从项目根目录运行

3. **权限问题**
   - 如果遇到 `Permission denied`，使用 `chmod +x` 添加执行权限

## 快速参考

```bash
# 测试文本渲染
node scripts/test-text-rendering.js

# 查看生成的命令
cat test-text-output.sh

# 执行 FFmpeg 命令
bash test-text-output.sh
```
