export type Inputs = {
  [key: string]: Source;
};

export type Source = {
  type: "video" | "audio" | "image" | "text";
  file: string;
  hasAudio: boolean;
  hasVideo: boolean;
  duration: number;
  metadata?: SourceMetadata;
};

// Metadata types
export type SourceMetadata =
  | AudioMetadata
  | ImageMetadata
  | TextMetadata;

export type AudioMetadata = {
  audioType?: "bgm" | "sfx" | "narration";
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  subtitle?: string;
  language?: string;
  speaker?: string;
  category?: string;
};

export type ImageMetadata = {
  imageType?: "static" | "animated";
  format?: "png" | "jpg" | "gif";
  loop?: boolean;
  frameRate?: number;
};

export type TextMetadata = {
  text: string;
  fontFamily?: string;      // Font name (e.g., "Arial", "Helvetica")
  fontFile?: string;         // Full path to font file (e.g., "/path/to/font.ttf")
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  stroke?: { color: string; width: number };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  boxPadding?: number;
};
