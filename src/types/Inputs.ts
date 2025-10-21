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

/**
 * Metadata for audio sources
 */
export type AudioMetadata = {
  /**
   * Type of audio content:
   * - bgm: Background music (single instance, continuous playback with fade in/out and looping)
   * - sfx: Sound effects (multiple instances, precise timing triggers)
   * - narration: Dialogue/voiceover with subtitle support
   * Default: "sfx"
   */
  audioType?: "bgm" | "sfx" | "narration";

  /**
   * Whether to loop audio if source duration is shorter than clip duration
   * Only applies to BGM type
   * Default: false
   */
  loop?: boolean;

  /**
   * Duration in seconds for audio fade-in at the start of the clip
   * Applies to BGM, SFX, and narration
   */
  fadeIn?: number;

  /**
   * Duration in seconds for audio fade-out at the end of the clip
   * Applies to BGM, SFX, and narration
   */
  fadeOut?: number;

  /**
   * URL to SRT subtitle file (for narration type)
   * Will be downloaded to temp directory before processing
   */
  subtitleUrl?: string;

  /**
   * Local path to SRT subtitle file (for narration type)
   * Takes precedence over subtitleUrl if both are provided
   */
  subtitleFile?: string;

  /**
   * Subtitle styling options (for narration type)
   */
  subtitleStyle?: {
    /** Font family name (e.g., "Arial", "Helvetica") */
    fontFamily?: string;
    /** Font size in points */
    fontSize?: number;
    /** Primary text color in hex format (e.g., "#FFFFFF") */
    fontColor?: string;
    /** Background color in hex format with optional alpha (e.g., "#00000080") */
    backgroundColor?: string;
    /** Vertical position of subtitles */
    position?: "top" | "bottom" | "middle";
    /** Vertical margin in pixels */
    marginV?: number;
  };

  /** Language code (e.g., "en", "zh-CN") */
  language?: string;

  /** Speaker name for narration */
  speaker?: string;

  /** Audio category for organization */
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
