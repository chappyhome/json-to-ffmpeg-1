import { z } from 'zod';

/**
 * 完整的 JSON-to-FFmpeg 时间线验证 Schema
 * 基于语法规则文档
 */

// Transform 对象（video/image/text clip 专用）
const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive('width 必须 > 0'),
  height: z.number().positive('height 必须 > 0'),
  rotation: z.number(),
  opacity: z.number().min(0, 'opacity 必须 >= 0').max(1, 'opacity 必须 <= 1'),
});

// 字幕样式（Narration 专用）
const SubtitleStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).optional(),
  position: z.enum(['top', 'bottom', 'middle']).optional(),
  marginV: z.number().optional(),
});

// Audio Metadata
const AudioMetadataSchema = z.object({
  audioType: z.enum(['bgm', 'sfx', 'narration']).optional().default('sfx'),
  loop: z.boolean().optional(),
  fadeIn: z.number().nonnegative().optional(),
  fadeOut: z.number().nonnegative().optional(),
  subtitleUrl: z.string().url().optional(),
  subtitleFile: z.string().optional(),
  subtitleStyle: SubtitleStyleSchema.optional(),
  language: z.string().optional(),
  speaker: z.string().optional(),
  category: z.string().optional(),
});

// Image Metadata
const ImageMetadataSchema = z.object({
  imageType: z.enum(['static', 'animated']),
  format: z.enum(['png', 'jpg', 'gif']).optional(),
  loop: z.boolean().optional(),
  frameRate: z.number().positive().optional(),
});

// Text Metadata
const TextMetadataSchema = z.object({
  text: z.string().min(1, 'text 内容不能为空'),
  fontFamily: z.string().optional(),
  fontFile: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  stroke: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/),
    width: z.number().nonnegative(),
  }).optional(),
  shadow: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/),
    blur: z.number().nonnegative(),
    offsetX: z.number(),
    offsetY: z.number(),
  }).optional(),
  boxPadding: z.number().nonnegative().optional(),
}).passthrough(); // 允许额外字段通过,保持向后兼容

// Source 对象（inputs 中的资源）
const SourceSchema = z.object({
  type: z.enum(['video', 'audio', 'image', 'text']),
  file: z.string(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
  duration: z.number().nonnegative(),
  metadata: z.any().optional(), // 先用 any 接收,后续在 refine 中根据 type 验证
}).refine((data) => {
  // 验证 hasAudio/hasVideo 与 type 的匹配
  if (data.type === 'video') {
    return data.hasVideo === true;
  }
  if (data.type === 'audio') {
    return data.hasAudio === true && data.hasVideo === false;
  }
  if (data.type === 'image' || data.type === 'text') {
    return data.hasVideo === true && data.hasAudio === false;
  }
  return true;
}, {
  message: 'hasAudio/hasVideo 与 type 不匹配',
}).refine((data) => {
  // text 类型允许空 file,其他类型必须有非空 file
  if (data.type === 'text') {
    return true;
  }
  return data.file && data.file.length > 0;
}, {
  message: 'file 字段不能为空 (text 类型除外)',
  path: ['file'],
}).refine((data) => {
  // text 类型必须有 metadata.text (强制要求)
  if (data.type === 'text') {
    return data.metadata &&
           'text' in data.metadata &&
           typeof data.metadata.text === 'string' &&
           data.metadata.text.length > 0;
  }
  return true;
}, {
  message: 'text 类型必须提供 metadata.text 且不能为空',
});

// Video Clip
const VideoClipSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  timelineTrackStart: z.number().nonnegative(),
  duration: z.number().positive(),
  sourceStartOffset: z.number().nonnegative(),
  clipType: z.literal('video'),
  transform: TransformSchema,
  metadata: z.any().optional(),
});

// Audio Clip
const AudioClipSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  timelineTrackStart: z.number().nonnegative(),
  duration: z.number().positive(),
  sourceStartOffset: z.number().nonnegative(),
  clipType: z.literal('audio'),
  volume: z.number().min(0).max(1, 'volume 必须在 0-1 之间'),
  metadata: z.any().optional(),
});

// Image Clip
const ImageClipSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  timelineTrackStart: z.number().nonnegative(),
  duration: z.number().positive(),
  sourceStartOffset: z.number().nonnegative(),
  clipType: z.literal('image'),
  transform: TransformSchema,
  metadata: z.any().optional(),
});

// Text Clip
const TextClipSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  timelineTrackStart: z.number().nonnegative(),
  duration: z.number().positive(),
  sourceStartOffset: z.number().nonnegative(),
  clipType: z.literal('text'),
  transform: TransformSchema,
  metadata: z.any().optional(),
});

// Clip 联合类型
const ClipSchema = z.union([
  VideoClipSchema,
  AudioClipSchema,
  ImageClipSchema,
  TextClipSchema,
]);

// Track
const TrackSchema = z.object({
  type: z.enum(['video', 'audio']),
  clips: z.array(ClipSchema).min(1, '每个 track 至少需要一个 clip'),
});

// Transition
const TransitionSchema = z.object({
  type: z.string().min(1),
  duration: z.number().positive('转场时长必须 > 0'),
  from: z.string().nullable(),
  to: z.string().nullable(),
}).refine((data) => {
  // from 和 to 不能同时为 null
  return data.from !== null || data.to !== null;
}, {
  message: 'from 和 to 不能同时为 null',
});

// Output
const OutputSchema = z.object({
  tempDir: z.string().optional(),
  file: z.string().min(1, 'output.file 必填'),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  width: z.number().positive('output.width 必须 > 0'),
  height: z.number().positive('output.height 必须 > 0'),
  audioBitrate: z.string().optional(),
  preset: z.string().optional(),
  crf: z.number().min(0).max(51).optional(),
  framerate: z.number().positive('output.framerate 必须 > 0'),
  flags: z.array(z.string()).optional(),
  startPosition: z.number().nonnegative('output.startPosition 必须 >= 0'),
  endPosition: z.number().nonnegative('output.endPosition 必须 >= 0'),
  scaleRatio: z.number().positive().optional(),
}).refine((data) => {
  return data.endPosition > data.startPosition;
}, {
  message: 'output.endPosition 必须 > output.startPosition',
});

// 完整的 Timeline Schema
export const CompleteTimelineSchema = z.object({
  version: z.literal(1, { errorMap: () => ({ message: 'version 必须等于 1' }) }),
  inputs: z.record(z.string(), SourceSchema),
  tracks: z.record(z.string(), TrackSchema),
  output: OutputSchema,
  transitions: z.array(TransitionSchema).optional().default([]),
});

export type CompleteTimeline = z.infer<typeof CompleteTimelineSchema>;

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
  timeline?: CompleteTimeline;
}

export interface ValidationError {
  path: string;
  message: string;
  code?: string;
}

/**
 * 完整验证函数
 */
export function validateCompleteTimeline(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    // 1. Schema 验证
    const timeline = CompleteTimelineSchema.parse(data);

    // 2. 业务逻辑验证
    const inputKeys = Object.keys(timeline.inputs);
    const clipNames = new Set<string>();
    const videoClipNames = new Set<string>();

    // 验证 tracks
    Object.entries(timeline.tracks).forEach(([trackName, track]) => {
      track.clips.forEach((clip, index) => {
        const clipPath = `tracks.${trackName}.clips[${index}]`;

        // 检查 clip name 唯一性
        if (clipNames.has(clip.name)) {
          errors.push({
            path: `${clipPath}.name`,
            message: `clip name "${clip.name}" 重复，必须全局唯一`,
            code: 'DUPLICATE_CLIP_NAME',
          });
        } else {
          clipNames.add(clip.name);
        }

        // 记录 video clip（用于 transition 验证）
        if (clip.clipType === 'video' || clip.clipType === 'image' || clip.clipType === 'text') {
          videoClipNames.add(clip.name);
        }

        // 检查 source 存在
        if (!inputKeys.includes(clip.source)) {
          errors.push({
            path: `${clipPath}.source`,
            message: `source "${clip.source}" 不存在于 inputs 中`,
            code: 'SOURCE_NOT_FOUND',
          });
        } else {
          // 检查 clipType 与 source type 匹配
          const source = timeline.inputs[clip.source];
          if (clip.clipType !== source.type) {
            // 特殊情况：image/text clip 可以引用 image/text source
            const validCombos = [
              ['video', 'video'],
              ['audio', 'audio'],
              ['image', 'image'],
              ['text', 'text'],
            ];
            const combo = [clip.clipType, source.type];
            if (!validCombos.some(v => v[0] === combo[0] && v[1] === combo[1])) {
              errors.push({
                path: `${clipPath}.clipType`,
                message: `clipType "${clip.clipType}" 与 source type "${source.type}" 不匹配`,
                code: 'TYPE_MISMATCH',
              });
            }
          }
        }

        // 检查 track type 与 clip type 匹配
        if (track.type === 'video') {
          if (clip.clipType === 'audio') {
            errors.push({
              path: clipPath,
              message: `video track 不能包含 audio clip`,
              code: 'TRACK_CLIP_TYPE_MISMATCH',
            });
          }
        } else if (track.type === 'audio') {
          if (clip.clipType !== 'audio') {
            errors.push({
              path: clipPath,
              message: `audio track 只能包含 audio clip`,
              code: 'TRACK_CLIP_TYPE_MISMATCH',
            });
          }
        }
      });
    });

    // 验证 transitions
    timeline.transitions.forEach((transition, index) => {
      const transPath = `transitions[${index}]`;

      if (transition.from && !videoClipNames.has(transition.from)) {
        errors.push({
          path: `${transPath}.from`,
          message: `transition.from "${transition.from}" 引用的 clip 不存在`,
          code: 'CLIP_NOT_FOUND',
        });
      }

      if (transition.to && !videoClipNames.has(transition.to)) {
        errors.push({
          path: `${transPath}.to`,
          message: `transition.to "${transition.to}" 引用的 clip 不存在`,
          code: 'CLIP_NOT_FOUND',
        });
      }
    });

    // 添加警告
    if (timeline.transitions.length === 0) {
      warnings.push('未定义任何转场效果');
    }

    // 检查是否缺少可选但推荐的字段
    if (!timeline.output.tempDir) {
      warnings.push('未指定 output.tempDir，将使用默认值');
    }
    if (!timeline.output.videoCodec) {
      warnings.push('未指定 output.videoCodec，将使用默认值 libx264');
    }
    if (!timeline.output.audioCodec) {
      warnings.push('未指定 output.audioCodec，将使用默认值 aac');
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    return { valid: true, timeline, warnings: warnings.length > 0 ? warnings : undefined };

  } catch (error) {
    if (error instanceof z.ZodError) {
      // 转换 Zod 错误为友好格式
      const zodErrors: ValidationError[] = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return { valid: false, errors: zodErrors };
    }

    // 其他未知错误
    return {
      valid: false,
      errors: [{
        path: '',
        message: error instanceof Error ? error.message : '未知验证错误',
        code: 'UNKNOWN_ERROR',
      }],
    };
  }
}
