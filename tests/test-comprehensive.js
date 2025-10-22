#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseSchema } = require('../dist/index.js');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          JSON-to-FFmpeg 综合功能测试                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// 读取测试timeline
const rootDir = path.join(__dirname, '..');
const timelineFile = path.join(rootDir, 'worker/test/fixtures/comprehensive-test.json');
const timeline = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));

console.log('📋 测试场景:');
console.log('   - 时长: 20秒视频');
console.log('   - 视频轨道: 1条 (主视频)');
console.log('   - 叠加轨道: 2条 (文本 + 图片/GIF)');
console.log('   - 音频轨道: 3条 (BGM + Narration + SFX)\n');

try {
  // 生成FFmpeg命令
  console.log('🔧 生成FFmpeg命令...\n');
  const command = parseSchema(timeline);

  // 写入输出文件
  const outputFile = path.join(rootDir, 'scripts/tests/test-comprehensive-output.sh');
  fs.writeFileSync(outputFile, command);

  console.log('✅ FFmpeg命令生成成功！');
  console.log(`📄 输出文件: ${outputFile}\n`);

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 功能验证报告\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 定义所有检查项
  const categories = [
    {
      name: '1️⃣  音频类型分类 (Audio Types)',
      checks: [
        {
          name: 'BGM - 背景音乐循环',
          test: () => {
            // 检查BGM是否使用loop
            const bgmClip = timeline.tracks.bgm_track.clips[0];
            const bgmInput = timeline.inputs[bgmClip.source];
            return bgmInput.metadata.audioType === 'bgm' && bgmInput.metadata.loop === true;
          },
          verify: () => {
            // 检查生成的命令中是否有loop
            return command.includes('loop=') || command.includes('aloop=');
          },
          detail: 'BGM配置了循环播放和淡入淡出(2秒)'
        },
        {
          name: 'BGM - 淡入淡出效果',
          test: () => {
            const bgmInput = timeline.inputs.bgm_audio;
            return bgmInput.metadata.fadeIn === 2.0 && bgmInput.metadata.fadeOut === 2.0;
          },
          verify: () => {
            return command.includes('afade=t=in') && command.includes('afade=t=out');
          },
          detail: 'BGM淡入2秒, 淡出2秒'
        },
        {
          name: 'SFX - 音效精确触发',
          test: () => {
            const sfxClips = timeline.tracks.sfx_track.clips;
            return sfxClips.length === 3; // 3个音效
          },
          verify: () => {
            // 检查是否使用adelay进行精确定时
            return command.includes('adelay=') || command.includes('atrim');
          },
          detail: `SFX在1秒、5秒、9秒触发 (${timeline.tracks.sfx_track.clips.length}个音效)`
        },
        {
          name: 'Narration - 旁白字幕',
          test: () => {
            const narInput = timeline.inputs.narration_voice;
            return narInput.metadata.audioType === 'narration' &&
                   narInput.metadata.subtitleUrl !== undefined;
          },
          verify: () => {
            return command.includes('narration-zh.srt') &&
                   command.includes('-c:s mov_text') &&
                   command.includes('language=chi');
          },
          detail: 'Narration配置软字幕 (mov_text, language=chi)'
        },
        {
          name: 'Audio Mixing - 音轨混合',
          test: () => {
            const audioTracks = Object.values(timeline.tracks).filter(
              t => t.type === 'audio'
            );
            return audioTracks.length === 3; // BGM + Narration + SFX
          },
          verify: () => {
            return command.includes('amix=inputs=') || command.includes('concat');
          },
          detail: '3条音轨 (BGM 30% + Narration 100% + SFX 70-80%)'
        }
      ]
    },
    {
      name: '2️⃣  动画图片支持 (Image Types)',
      checks: [
        {
          name: 'Static Image - 静态图片',
          test: () => {
            const imgInput = timeline.inputs.static_image;
            return imgInput.type === 'image' && imgInput.metadata.imageType === 'static';
          },
          verify: () => {
            return command.includes('logo.png');
          },
          detail: '静态图片显示在5-8秒，左上角位置'
        },
        {
          name: 'Animated GIF - GIF动画',
          test: () => {
            const gifInput = timeline.inputs.animated_gif;
            return gifInput.type === 'image' &&
                   gifInput.metadata.imageType === 'animated' &&
                   gifInput.metadata.loop === true;
          },
          verify: () => {
            return command.includes('loading.gif') &&
                   (command.includes('ignore_loop=0') || command.includes('-stream_loop'));
          },
          detail: 'GIF动画循环播放，显示在9-12秒，右上角位置'
        },
        {
          name: 'Image Transform - 图片变换',
          test: () => {
            const imgClip = timeline.tracks.overlay_track_1.clips.find(
              c => c.source === 'static_image'
            );
            return imgClip.transform.width === 300 &&
                   imgClip.transform.height === 300 &&
                   imgClip.transform.opacity === 0.8;
          },
          verify: () => {
            return command.includes('scale=') && command.includes('overlay=');
          },
          detail: '图片缩放至300x300，透明度80%'
        }
      ]
    },
    {
      name: '3️⃣  文本渲染 (Text Rendering)',
      checks: [
        {
          name: 'Text Type - 文本源类型',
          test: () => {
            const titleInput = timeline.inputs.title_text;
            return titleInput.type === 'text';
          },
          verify: () => {
            return command.includes('drawtext=');
          },
          detail: '使用FFmpeg drawtext滤镜渲染文本'
        },
        {
          name: 'Text Content - 文本内容',
          test: () => {
            const titleInput = timeline.inputs.title_text;
            const subtitleInput = timeline.inputs.subtitle_text;
            return titleInput.metadata.text === '综合功能测试' &&
                   subtitleInput.metadata.text === 'Audio Types + Animation + Text Rendering';
          },
          verify: () => {
            return command.includes('text=') &&
                   (command.includes('综合功能测试') || command.includes('Audio Types'));
          },
          detail: '主标题 + 副标题文本'
        },
        {
          name: 'Text Styling - 文本样式',
          test: () => {
            const titleInput = timeline.inputs.title_text;
            return titleInput.metadata.fontSize === 72 &&
                   titleInput.metadata.fontColor === '#FFFFFF' &&
                   titleInput.metadata.strokeWidth === 2 &&
                   titleInput.metadata.shadowX === 3;
          },
          verify: () => {
            return command.includes('fontsize=') &&
                   command.includes('fontcolor=') &&
                   (command.includes('borderw=') || command.includes('shadowx='));
          },
          detail: '字号72, 白色, 黑色描边, 阴影效果'
        },
        {
          name: 'Text Position - 文本定位',
          test: () => {
            const titleInput = timeline.inputs.title_text;
            const subtitleInput = timeline.inputs.subtitle_text;
            return titleInput.metadata.x === 'center' &&
                   titleInput.metadata.y === 'center' &&
                   subtitleInput.metadata.y === 900;
          },
          verify: () => {
            return command.includes('x=') && command.includes('y=');
          },
          detail: '主标题居中，副标题底部 (y=900)'
        },
        {
          name: 'Multiple Text Layers - 多层文本',
          test: () => {
            const textClips = Object.values(timeline.tracks)
              .filter(t => t.type === 'video')
              .flatMap(t => t.clips)
              .filter(c => {
                const source = timeline.inputs[c.source];
                return source && source.type === 'text';
              });
            return textClips.length >= 2;
          },
          verify: () => {
            // 检查是否有多个drawtext
            const drawtextCount = (command.match(/drawtext=/g) || []).length;
            return drawtextCount >= 2;
          },
          detail: `${Object.values(timeline.tracks).filter(t => t.type === 'video').flatMap(t => t.clips).filter(c => timeline.inputs[c.source]?.type === 'text').length}个文本图层`
        }
      ]
    },
    {
      name: '4️⃣  高级功能验证',
      checks: [
        {
          name: 'Multi-track Overlay - 多轨叠加',
          test: () => {
            const videoTracks = Object.values(timeline.tracks).filter(
              t => t.type === 'video'
            );
            return videoTracks.length === 3; // main + overlay1 + overlay2
          },
          verify: () => {
            return command.includes('overlay=');
          },
          detail: '3条视频轨道叠加 (主视频 + 2条overlay)'
        },
        {
          name: 'Soft Subtitles - 软字幕流',
          test: () => {
            return timeline.inputs.narration_voice.metadata.subtitleUrl !== undefined;
          },
          verify: () => {
            return command.includes('-map') &&
                   command.includes(':s') &&
                   command.includes('-c:s mov_text') &&
                   command.includes('-metadata:s:s:');
          },
          detail: '软字幕作为独立流嵌入，可切换'
        },
        {
          name: 'Timeline Synchronization - 时间轴同步',
          test: () => {
            // 验证所有clips的timelineTrackStart是否合理
            const allClips = Object.values(timeline.tracks).flatMap(t => t.clips);
            return allClips.every(c =>
              c.timelineTrackStart >= 0 &&
              c.timelineTrackStart + c.duration <= timeline.output.endPosition
            );
          },
          verify: () => {
            return command.includes('setpts=PTS-STARTPTS');
          },
          detail: '所有clips时间轴同步正确'
        },
        {
          name: 'Volume Control - 音量控制',
          test: () => {
            const bgmVol = timeline.tracks.bgm_track.clips[0].volume;
            const narVol = timeline.tracks.narration_track.clips[0].volume;
            const sfxVol = timeline.tracks.sfx_track.clips[0].volume;
            return bgmVol === 0.3 && narVol === 1.0 && sfxVol === 0.8;
          },
          verify: () => {
            return command.includes('volume=');
          },
          detail: 'BGM 30%, Narration 100%, SFX 80%'
        }
      ]
    }
  ];

  // 执行所有检查
  let totalChecks = 0;
  let passedChecks = 0;

  categories.forEach(category => {
    console.log(`${category.name}`);
    console.log('─'.repeat(65) + '\n');

    category.checks.forEach(check => {
      totalChecks++;
      const configPass = check.test();
      const commandPass = check.verify();
      const passed = configPass && commandPass;

      if (passed) passedChecks++;

      const symbol = passed ? '✅' : '❌';
      console.log(`${symbol} ${check.name}`);
      console.log(`   配置: ${configPass ? '✓' : '✗'}  |  命令: ${commandPass ? '✓' : '✗'}`);
      console.log(`   ${check.detail}`);

      if (!passed) {
        if (!configPass) {
          console.log(`   ⚠️  Timeline配置未正确设置`);
        }
        if (!commandPass) {
          console.log(`   ⚠️  FFmpeg命令未包含预期的滤镜/参数`);
        }
      }
      console.log('');
    });

    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📈 测试总结\n');
  console.log(`   总检查项: ${totalChecks}`);
  console.log(`   通过: ${passedChecks} ✅`);
  console.log(`   失败: ${totalChecks - passedChecks} ❌`);
  console.log(`   通过率: ${Math.round(passedChecks / totalChecks * 100)}%\n`);

  if (passedChecks === totalChecks) {
    console.log('🎉 所有功能测试通过！\n');
  } else {
    console.log('⚠️  部分功能测试失败，请检查实现。\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 Timeline结构\n');

  // 显示timeline时间轴
  console.log('时间轴 (0-20秒):');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Video Track:                                                │');
  console.log('│   [████████████████████████████] main_video (0-20s)         │');
  console.log('│                                                             │');
  console.log('│ Overlay Track 1:                                            │');
  console.log('│     [███] title_text (1-4s)                                 │');
  console.log('│          [███] static_image (5-8s)                          │');
  console.log('│                  [███] animated_gif (9-12s)                 │');
  console.log('│                                                             │');
  console.log('│ Overlay Track 2:                                            │');
  console.log('│      [█████] subtitle_text (2-7s)                           │');
  console.log('│                                                             │');
  console.log('│ Audio:                                                      │');
  console.log('│   [████████████████████████████] BGM (0-20s, 30%)           │');
  console.log('│      [██████████] Narration (2-12s, 100%) + Subtitles      │');
  console.log('│     ▼     ▼        ▼  SFX (1s, 5s, 9s, 70-80%)             │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🚀 执行步骤\n');

  console.log('1️⃣  执行生成的FFmpeg命令:');
  console.log(`   chmod +x ${outputFile}`);
  console.log(`   ${outputFile}\n`);

  console.log('2️⃣  验证生成的视频:');
  console.log('   ffprobe -v error -show_streams output-comprehensive-test.mp4\n');

  console.log('3️⃣  播放视频查看效果:');
  console.log('   ffplay output-comprehensive-test.mp4');
  console.log('   (按 "v" 键切换字幕显示)\n');

  console.log('4️⃣  检查各个时间点的效果:');
  console.log('   0-1s:   主视频 + BGM淡入');
  console.log('   1-4s:   主标题文本 "综合功能测试" + 点击音效');
  console.log('   2-7s:   副标题文本 + 中文Narration开始');
  console.log('   5-8s:   静态图片logo (左上角) + whoosh音效');
  console.log('   9-12s:  GIF动画 (右上角) + 点击音效');
  console.log('   18-20s: BGM淡出\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📝 预期效果检查清单\n');

  const checklist = [
    { time: '全程', item: 'BGM背景音乐循环播放，音量适中(30%)' },
    { time: '0-2s', item: 'BGM淡入效果' },
    { time: '1s', item: '点击音效触发' },
    { time: '1-4s', item: '白色大标题居中显示，带黑色描边和阴影' },
    { time: '2-7s', item: '金色副标题底部显示' },
    { time: '2-12s', item: '中文Narration语音播放，音量清晰(100%)' },
    { time: '2-12s', item: '中文软字幕同步显示（可通过播放器切换）' },
    { time: '5s', item: 'Whoosh音效触发' },
    { time: '5-8s', item: '静态PNG图片左上角显示，略微透明(80%)' },
    { time: '9s', item: '点击音效触发' },
    { time: '9-12s', item: 'GIF动画右上角循环播放' },
    { time: '18-20s', item: 'BGM淡出效果' }
  ];

  checklist.forEach((item, i) => {
    console.log(`   [ ] ${item.time.padEnd(8)} - ${item.item}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // 保存详细的FFmpeg命令供检查
  console.log('💾 完整FFmpeg命令已保存到: test-comprehensive-output.sh');
  console.log('   可以手动检查命令细节\n');

  // 退出码
  process.exit(passedChecks === totalChecks ? 0 : 1);

} catch (error) {
  console.error('❌ 测试执行出错:', error.message);
  console.error(error.stack);
  process.exit(1);
}
