#!/usr/bin/env tsx
/**
 * 本地验证测试脚本
 * 不需要部署 worker，直接测试验证逻辑
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { validateCompleteTimeline } from '../worker/src/validation-complete';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

interface TestCase {
  name: string;
  file?: string;
  json?: any;
  expectedValid: boolean;
}

// 测试用例
const testCases: TestCase[] = [
  // 有效的 JSON
  {
    name: '简单时间线',
    file: 'worker/test/fixtures/simple-timeline.json',
    expectedValid: true,
  },
  {
    name: '综合功能测试',
    file: 'worker/test/fixtures/comprehensive-test.json',
    expectedValid: true,
  },
  {
    name: '音频类型测试',
    file: 'worker/test/fixtures/audio-types-timeline.json',
    expectedValid: true,
  },
  {
    name: '文本渲染测试',
    file: 'worker/test/fixtures/text-timeline.json',
    expectedValid: true,
  },
  {
    name: 'GIF 动画测试',
    file: 'worker/test/fixtures/gif-timeline.json',
    expectedValid: true,
  },
  {
    name: '旁白字幕测试',
    file: 'worker/test/fixtures/narration-timeline.json',
    expectedValid: true,
  },

  // 无效的 JSON
  {
    name: '错误: version 不等于 1',
    json: {
      version: 2,
      inputs: {},
      tracks: {},
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: 缺少 output 字段',
    json: {
      version: 1,
      inputs: {},
      tracks: {},
    },
    expectedValid: false,
  },
  {
    name: '错误: clip name 重复',
    json: {
      version: 1,
      inputs: {
        video1: {
          type: 'video',
          file: 'test.mp4',
          hasAudio: false,
          hasVideo: true,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'video1',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'video',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 },
            },
            {
              name: 'clip1',
              source: 'video1',
              timelineTrackStart: 5,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'video',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 },
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 10,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: source 不存在于 inputs',
    json: {
      version: 1,
      inputs: {
        video1: {
          type: 'video',
          file: 'test.mp4',
          hasAudio: false,
          hasVideo: true,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'video2',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'video',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 },
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: hasAudio/hasVideo 与 type 不匹配',
    json: {
      version: 1,
      inputs: {
        audio1: {
          type: 'audio',
          file: 'test.mp3',
          hasAudio: false,
          hasVideo: true,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'audio',
          clips: [
            {
              name: 'clip1',
              source: 'audio1',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'audio',
              volume: 1.0,
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: text 类型缺少 metadata.text',
    json: {
      version: 1,
      inputs: {
        text1: {
          type: 'text',
          file: '',
          hasAudio: false,
          hasVideo: true,
          duration: 0,
          metadata: {
            fontSize: 72,
          },
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'text1',
              timelineTrackStart: 0,
              duration: 3,
              sourceStartOffset: 0,
              clipType: 'text',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 },
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 3,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: endPosition <= startPosition',
    json: {
      version: 1,
      inputs: {
        video1: {
          type: 'video',
          file: 'test.mp4',
          hasAudio: false,
          hasVideo: true,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'video1',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'video',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1 },
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 10,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: opacity 超出范围',
    json: {
      version: 1,
      inputs: {
        video1: {
          type: 'video',
          file: 'test.mp4',
          hasAudio: false,
          hasVideo: true,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'video1',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'video',
              transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 1.5 },
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
  {
    name: '错误: video track 包含 audio clip',
    json: {
      version: 1,
      inputs: {
        audio1: {
          type: 'audio',
          file: 'test.mp3',
          hasAudio: true,
          hasVideo: false,
          duration: 10,
        },
      },
      tracks: {
        track1: {
          type: 'video',
          clips: [
            {
              name: 'clip1',
              source: 'audio1',
              timelineTrackStart: 0,
              duration: 5,
              sourceStartOffset: 0,
              clipType: 'audio',
              volume: 1.0,
            },
          ],
        },
      },
      output: {
        file: 'output.mp4',
        width: 1920,
        height: 1080,
        framerate: 30,
        startPosition: 0,
        endPosition: 5,
      },
    },
    expectedValid: false,
  },
];

// 运行测试
function runTests() {
  console.log(`${colors.blue}==================================================`);
  console.log('JSON-to-FFmpeg 本地验证测试');
  console.log(`==================================================${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`${colors.blue}[测试 ${totalTests}]${colors.reset} ${testCase.name}`);

    let data: any;

    // 读取 JSON
    if (testCase.file) {
      try {
        const filePath = join(process.cwd(), testCase.file);
        const content = readFileSync(filePath, 'utf-8');
        data = JSON.parse(content);
        console.log(`文件: ${colors.yellow}${testCase.file}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}✗ 文件读取失败: ${error}${colors.reset}\n`);
        failedTests++;
        continue;
      }
    } else {
      data = testCase.json;
      console.log('数据: 内联 JSON');
    }

    // 验证
    const result = validateCompleteTimeline(data);

    // 检查结果
    if (result.valid === testCase.expectedValid) {
      console.log(`${colors.green}✓ 通过${colors.reset} - 验证结果符合预期: ${testCase.expectedValid}`);
      passedTests++;

      // 显示警告
      if (result.warnings && result.warnings.length > 0) {
        console.log(`${colors.yellow}警告数量: ${result.warnings.length}${colors.reset}`);
        result.warnings.forEach((warning) => {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
        });
      }
    } else {
      console.log(
        `${colors.red}✗ 失败${colors.reset} - 预期: ${testCase.expectedValid}, 实际: ${result.valid}`
      );
      failedTests++;

      // 显示错误
      if (result.errors && result.errors.length > 0) {
        console.log(`${colors.red}错误详情:${colors.reset}`);
        result.errors.forEach((error) => {
          console.log(`  • [${error.path}] ${error.message}`);
        });
      }
    }

    console.log('');
  }

  // 测试总结
  console.log(`${colors.blue}==================================================`);
  console.log('测试总结');
  console.log(`==================================================${colors.reset}`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`${colors.green}通过: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}失败: ${failedTests}${colors.reset}`);

  if (failedTests === 0) {
    console.log(`${colors.green}✓ 所有测试通过！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ 部分测试失败${colors.reset}`);
    process.exit(1);
  }
}

// 执行测试
runTests();
