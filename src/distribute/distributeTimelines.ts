import { VideoEditorFormat } from "../types/VideoEditingFormat";
import { Transform } from "../types/Transform";
import { Inputs, SourceMetadata } from "../types/Inputs";

export type CombineMode = "single" | "pair" | "all";
type AssetType = "video" | "audio" | "image" | "text";

export type DistributionAsset = {
  id: number | string;
  type: AssetType;
  role: string;
  url: string;
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
  meta?: SourceMetadata | Record<string, any>;
};

export type DistributionUiConfig = {
  videoAspectRatio?: string;
  combineMode?: CombineMode;
  strictNoSplit?: boolean;
  variantCount?: number;
  bgmVolume?: number;
  framerate?: number;
};

export type InputWithMetadata = {
  styleCode?: string;
  variantCount?: number;
  uiConfig?: DistributionUiConfig;
  assets: DistributionAsset[];
};

export type DistributionOverrides = {
  numOutputs?: number;
  combineMode?: CombineMode;
  strictNoSplit?: boolean;
  seed?: number;
};

export type DistributionStrategy = {
  combineMode: CombineMode;
  strictNoSplit: boolean;
  numOutputs: number;
  mainVideoCount: number;
  pairCount?: number;
};

export type DistributionOutput = {
  index: number;
  variantKey: string;
  timeline: VideoEditorFormat;
};

export type DistributionError = {
  code: string;
  message: string;
  details?: any;
};

export type DistributionResult =
  | {
      ok: true;
      strategy: DistributionStrategy;
      outputs: DistributionOutput[];
      warnings?: string[];
    }
  | {
      ok: false;
      error: DistributionError;
    };

type KeyedAsset = DistributionAsset & {
  key: string;
  normalizedRole: string;
};

type DerivedConfig = {
  width: number;
  height: number;
  framerate: number;
  bgmVolume: number;
  styleCode?: string;
};

const DEFAULT_DIMENSIONS = { width: 1920, height: 1080 };
const DEFAULT_FRAMERATE = 30;
const DEFAULT_AUDIO_BITRATE = "320k";
const DEFAULT_VIDEO_CODEC = "libx264";
const DEFAULT_AUDIO_CODEC = "aac";
const DEFAULT_PRESET = "veryfast";
const DEFAULT_CRF = 23;
const DEFAULT_FLAGS = ["-pix_fmt", "yuv420p"];

export function distributeTimelines(
  input: InputWithMetadata,
  overrides: DistributionOverrides = {},
): DistributionResult {
  const assets = input.assets || [];

  if (assets.length === 0) {
    return {
      ok: false,
      error: {
        code: "ASSET_LIST_EMPTY",
        message: "Asset list is empty. Provide at least one asset with role=main_video.",
      },
    };
  }

  const combineMode: CombineMode =
    overrides.combineMode ||
    (input as any).combineMode ||
    input.uiConfig?.combineMode ||
    "single";

  const strictNoSplit =
    overrides.strictNoSplit ??
    (input as any).strictNoSplit ??
    input.uiConfig?.strictNoSplit ??
    false;

  const requestedOutputs =
    overrides.numOutputs ??
    (input as any).numOutputs ??
    input.variantCount ??
    input.uiConfig?.variantCount ??
    1;

  const numOutputs = Math.max(1, requestedOutputs);

  const seed =
    overrides.seed ??
    (input as any).seed ??
    undefined;

  const config: DerivedConfig = {
    ...deriveDimensions(input.uiConfig?.videoAspectRatio),
    framerate: input.uiConfig?.framerate || DEFAULT_FRAMERATE,
    bgmVolume: normalizeVolume(input.uiConfig?.bgmVolume),
    styleCode: input.styleCode,
  };

  const keyedAssets = assignKeys(assets);
  const mainVideos = keyedAssets.filter((a) => a.normalizedRole === "main_video");

  if (mainVideos.length === 0) {
    return {
      ok: false,
      error: {
        code: "MAIN_VIDEO_EMPTY",
        message: "No main_video assets provided. At least one main video is required.",
      },
    };
  }

  const orderedMainVideos = shuffleWithSeed(mainVideos, seed);

  const strategy: DistributionStrategy = {
    combineMode,
    strictNoSplit,
    numOutputs,
    mainVideoCount: mainVideos.length,
  };

  const warnings: string[] = [];

  if (combineMode === "all") {
    const timeline = buildTimeline({
      mainClips: orderedMainVideos,
      config,
      variantIndex: 0,
      combineMode,
      keyedAssets,
    });

    if (numOutputs > 1) {
      warnings.push(
        "combineMode=all returns a single timeline regardless of numOutputs; request more outputs with combineMode=single or pair.",
      );
    }

    return {
      ok: true,
      strategy,
      outputs: [
        {
          index: 0,
          variantKey: timeline.variantKey,
          timeline: timeline.timeline,
        },
      ],
      warnings: warnings.length ? warnings : undefined,
    };
  }

  if (combineMode === "single") {
    if (strictNoSplit && numOutputs > mainVideos.length) {
      return {
        ok: false,
        error: {
          code: "INSUFFICIENT_MAIN_VIDEOS",
          message:
            `Requested ${numOutputs} outputs but only ${mainVideos.length} main videos available. ` +
            `Use combineMode=pair/all or allow splitting to increase outputs.`,
        },
      };
    }

    const outputCount = Math.min(numOutputs, mainVideos.length);
    const outputs: DistributionOutput[] = [];

    for (let i = 0; i < outputCount; i++) {
      const timeline = buildTimeline({
        mainClips: [orderedMainVideos[i]],
        config,
        variantIndex: i,
        combineMode,
        keyedAssets,
      });

      outputs.push({
        index: i,
        variantKey: timeline.variantKey,
        timeline: timeline.timeline,
      });
    }

    return { ok: true, strategy, outputs };
  }

  if (combineMode === "pair") {
    const pairs = buildPairs(orderedMainVideos);
    strategy.pairCount = pairs.length;

    if (pairs.length === 0) {
      return {
        ok: false,
        error: {
          code: "INSUFFICIENT_COMBINATIONS",
          message: "Pair mode requires at least two main videos.",
        },
      };
    }

    const orderedPairs = shuffleWithSeed(pairs, seed);
    if (numOutputs > orderedPairs.length) {
      return {
        ok: false,
        error: {
          code: "INSUFFICIENT_COMBINATIONS",
          message: `Requested ${numOutputs} outputs but only ${orderedPairs.length} unique pairs available.`,
        },
      };
    }

    const outputCount = Math.min(numOutputs, orderedPairs.length);
    const outputs: DistributionOutput[] = [];

    for (let i = 0; i < outputCount; i++) {
      const mainClips = orderedPairs[i];
      const timeline = buildTimeline({
        mainClips,
        config,
        variantIndex: i,
        combineMode,
        keyedAssets,
      });

      outputs.push({
        index: i,
        variantKey: timeline.variantKey,
        timeline: timeline.timeline,
      });
    }

    return { ok: true, strategy, outputs };
  }

  return {
    ok: false,
    error: {
      code: "UNSUPPORTED_COMBINE_MODE",
      message: `Unsupported combineMode "${combineMode}".`,
    },
  };
}

function assignKeys(assets: DistributionAsset[]): KeyedAsset[] {
  const roleCounters: Record<string, number> = {};

  return assets.map((asset) => {
    const normalizedRole = normalizeRole(asset.role);
    const index = roleCounters[normalizedRole] || 0;
    roleCounters[normalizedRole] = index + 1;

    const key = buildInputKey(normalizedRole, index, asset);

    return {
      ...asset,
      normalizedRole,
      key,
    };
  });
}

function buildInputKey(role: string, index: number, asset: DistributionAsset): string {
  if (role === "main_video") return `main_video_${index + 1}`;
  if (role === "bgm") return `bgm_${index + 1}`;
  if (role === "sfx") return `sfx_${index + 1}`;
  if (role === "voiceover" || role === "narration") {
    const language = (asset.meta as any)?.language;
    const suffix = language ? sanitize(language) : String(index + 1);
    return `voiceover_${suffix}`;
  }
  if (role === "watermark") return `watermark_${index + 1}`;
  if (role === "sticker") return `sticker_${index + 1}`;
  if (role === "title") return `title_${index + 1}`;
  if (role === "subtitle") return `subtitle_${index + 1}`;
  return `${role}_${index + 1}`;
}

function sanitize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function normalizeRole(role: string): string {
  return (role || "asset").toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function deriveDimensions(aspectRatio?: string): { width: number; height: number } {
  if (!aspectRatio || typeof aspectRatio !== "string") {
    return { ...DEFAULT_DIMENSIONS };
  }

  const parts = aspectRatio.split(":");
  if (parts.length !== 2) return { ...DEFAULT_DIMENSIONS };

  const widthRatio = Number(parts[0]);
  const heightRatio = Number(parts[1]);
  if (!widthRatio || !heightRatio) return { ...DEFAULT_DIMENSIONS };

  const baseHeight = DEFAULT_DIMENSIONS.height;
  const computedWidth = ensureEven(Math.round((widthRatio / heightRatio) * baseHeight));

  return { width: computedWidth, height: baseHeight };
}

function ensureEven(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DIMENSIONS.width;
  return value % 2 === 0 ? value : value + 1;
}

function normalizeVolume(bgmVolume?: number): number {
  if (typeof bgmVolume !== "number") return 1;
  const normalized = bgmVolume / 100;
  if (normalized <= 0) return 0;
  if (normalized > 2) return 2;
  return normalized;
}

function buildPairs(items: KeyedAsset[]): KeyedAsset[][] {
  const pairs: KeyedAsset[][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

function shuffleWithSeed<T>(items: T[], seed?: number): T[] {
  if (seed === undefined) return [...items];
  const result = [...items];
  let currentSeed = seed;

  for (let i = result.length - 1; i > 0; i--) {
    currentSeed = mulberry32(currentSeed);
    const j = Math.floor(currentSeed * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function mulberry32(a: number): number {
  let t = a + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function buildTimeline({
  mainClips,
  config,
  variantIndex,
  combineMode,
  keyedAssets,
}: {
  mainClips: KeyedAsset[];
  config: DerivedConfig;
  variantIndex: number;
  combineMode: CombineMode;
  keyedAssets: KeyedAsset[];
}): { variantKey: string; timeline: VideoEditorFormat } {
  const totalDuration = mainClips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
  const inputs: Inputs = {};
  const tracks: VideoEditorFormat["tracks"] = {};

  const addInput = (asset: KeyedAsset) => {
    if (inputs[asset.key]) return;
    inputs[asset.key] = {
      type: asset.type,
      file: asset.url,
      hasAudio: asset.hasAudio,
      hasVideo: asset.hasVideo,
      duration: asset.duration,
      metadata: asset.meta,
    };
  };

  const fullFrameTransform: Transform = {
    x: 0,
    y: 0,
    width: config.width,
    height: config.height,
    rotation: 0,
    opacity: 1,
  };

  let cursor = 0;
  const videoClips = mainClips.map((clip) => {
    addInput(clip);
    const clipDuration = clip.duration || 0;
    const videoClip = {
      name: `${clip.key}_clip`,
      source: clip.key,
      timelineTrackStart: cursor,
      duration: clipDuration,
      sourceStartOffset: 0,
      clipType: "video" as const,
      transform: fullFrameTransform,
      metadata: clip.meta,
    };
    cursor += clipDuration;
    return videoClip;
  });

  tracks.video_track = {
    type: "video",
    clips: videoClips,
  };

  const watermarkAssets = keyedAssets.filter((a) => a.normalizedRole === "watermark");
  if (watermarkAssets.length > 0) {
    const clips = watermarkAssets.map((asset) => {
      addInput(asset);
      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: 0,
        duration: totalDuration,
        sourceStartOffset: 0,
        clipType: "image" as const,
        transform: overlayTransform(config.width, config.height, { anchor: "topRight" }),
        metadata: asset.meta,
      };
    });

    tracks.watermark_track = { type: "video", clips };
  }

  const stickerAssets = keyedAssets.filter((a) => a.normalizedRole === "sticker");
  if (stickerAssets.length > 0) {
    const clips = stickerAssets.map((asset, idx) => {
      addInput(asset);
      const offset = Math.min(idx * 1.5, Math.max(0, totalDuration - 1));
      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: offset,
        duration: Math.max(totalDuration - offset, asset.duration || 1),
        sourceStartOffset: 0,
        clipType: "image" as const,
        transform: overlayTransform(config.width, config.height, { anchor: "bottomLeft" }),
        metadata: asset.meta,
      };
    });

    tracks.sticker_track = { type: "video", clips };
  }

  const titleAssets = keyedAssets.filter(
    (a) => a.normalizedRole === "title" || a.normalizedRole === "subtitle",
  );
  if (titleAssets.length > 0) {
    const clips = titleAssets.map((asset, idx) => {
      addInput(asset);
      const isSubtitle = asset.normalizedRole === "subtitle";
      const yAnchor = isSubtitle ? "bottomCenter" : "topCenter";
      const timelineStart = Math.min(idx, Math.max(0, totalDuration - 1));
      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: timelineStart,
        duration: totalDuration - timelineStart,
        sourceStartOffset: 0,
        clipType: "text" as const,
        transform: textTransform(config.width, config.height, yAnchor),
        metadata: asset.meta,
      };
    });

    tracks.title_track = { type: "video", clips };
  }

  const bgmAssets = keyedAssets.filter((a) => a.normalizedRole === "bgm");
  if (bgmAssets.length > 0 && totalDuration > 0) {
    const segmentDuration = totalDuration / bgmAssets.length;
    const clips = bgmAssets.map((asset, idx) => {
      addInput(asset);
      const start = Math.min(idx * segmentDuration, totalDuration);
      const duration =
        idx === bgmAssets.length - 1
          ? totalDuration - start
          : segmentDuration;

      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: start,
        duration: Math.max(duration, 0),
        sourceStartOffset: 0,
        clipType: "audio" as const,
        volume: config.bgmVolume,
        metadata: asset.meta,
      };
    });

    tracks.bgm_track = { type: "audio", clips };
  }

  const sfxAssets = keyedAssets.filter((a) => a.normalizedRole === "sfx");
  if (sfxAssets.length > 0) {
    const clips = sfxAssets.map((asset, idx) => {
      addInput(asset);
      const offset = Math.min(idx * 1, Math.max(0, totalDuration - (asset.duration || 1)));
      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: offset,
        duration: asset.duration || 1,
        sourceStartOffset: 0,
        clipType: "audio" as const,
        volume: 1,
        metadata: asset.meta,
      };
    });

    tracks.sfx_track = { type: "audio", clips };
  }

  const voiceoverAssets = keyedAssets.filter(
    (a) => a.normalizedRole === "voiceover" || a.normalizedRole === "narration",
  );
  const narrationSelection =
    voiceoverAssets.length === 0
      ? []
      : combineMode === "all"
        ? voiceoverAssets
        : [voiceoverAssets[variantIndex % voiceoverAssets.length]];

  if (narrationSelection.length > 0) {
    const clips = narrationSelection.map((asset) => {
      addInput(asset);
      return {
        name: `${asset.key}_clip`,
        source: asset.key,
        timelineTrackStart: 0,
        duration: Math.min(asset.duration || totalDuration, totalDuration),
        sourceStartOffset: 0,
        clipType: "audio" as const,
        volume: 1,
        metadata: asset.meta,
      };
    });

    tracks.narration_track = { type: "audio", clips };
  }

  const timeline: VideoEditorFormat = {
    version: 1,
    inputs,
    tracks,
    transitions: [],
    output: {
      tempDir: "./tmp",
      file: `output-variant-${variantIndex + 1}.mp4`,
      videoCodec: DEFAULT_VIDEO_CODEC,
      audioCodec: DEFAULT_AUDIO_CODEC,
      width: config.width,
      height: config.height,
      audioBitrate: DEFAULT_AUDIO_BITRATE,
      preset: DEFAULT_PRESET,
      crf: DEFAULT_CRF,
      framerate: config.framerate,
      flags: [...DEFAULT_FLAGS],
      startPosition: 0,
      endPosition: totalDuration,
      scaleRatio: 1,
    },
  };

  const variantKey =
    combineMode === "pair" && mainClips.length === 2
      ? `pair-${mainClips[0].key}-${mainClips[1].key}`
      : `${combineMode}-${mainClips[0].key}`;

  return { variantKey, timeline };
}

function overlayTransform(
  width: number,
  height: number,
  opts: { anchor: "topRight" | "bottomLeft" },
): Transform {
  const clipWidth = Math.round(width * 0.18);
  const clipHeight = Math.round(height * 0.18);

  if (opts.anchor === "topRight") {
    return {
      x: Math.max(0, width - clipWidth - 30),
      y: 30,
      width: clipWidth,
      height: clipHeight,
      rotation: 0,
      opacity: 0.9,
    };
  }

  return {
    x: 30,
    y: Math.max(0, height - clipHeight - 30),
    width: clipWidth,
    height: clipHeight,
    rotation: 0,
    opacity: 0.9,
  };
}

function textTransform(
  width: number,
  height: number,
  anchor: "topCenter" | "bottomCenter",
): Transform {
  const clipWidth = Math.round(width * 0.8);
  const clipHeight = Math.round(height * 0.12);
  const x = Math.round(width * 0.1);
  const y = anchor === "topCenter" ? Math.round(height * 0.08) : Math.round(height * 0.8);

  return {
    x,
    y,
    width: clipWidth,
    height: clipHeight,
    rotation: 0,
    opacity: 1,
  };
}
