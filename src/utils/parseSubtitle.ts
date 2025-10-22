/**
 * Subtitle utilities for soft subtitle (embedded stream) mode
 */

/**
 * Subtitle input information for soft subtitle mode
 */
export interface SubtitleInput {
  url: string;                  // Subtitle file URL or local path
  language?: string;            // Language code (e.g., "en", "zh", "es")
  sourceClip: string;           // Source narration clip name
  timelineTrackStart: number;   // Clip start time in timeline (seconds)
}

/**
 * Check if a path is a URL
 */
export function isUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

/**
 * Get subtitle codec based on output file extension
 */
export function getSubtitleCodec(outputFile: string): string | null {
  const ext = outputFile.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'mp4':
    case 'm4v':
      return 'mov_text';  // MP4 standard

    case 'mkv':
      return 'srt';       // MKV supports SRT/ASS

    case 'webm':
      return null;        // WebM doesn't support subtitle streams

    default:
      return 'mov_text';  // Default
  }
}

/**
 * Convert language code to ISO 639-2/T three-letter code for FFmpeg
 */
export function normalizeLanguageCode(lang?: string): string {
  if (!lang) return 'eng';

  const langMap: Record<string, string> = {
    'en': 'eng',
    'zh': 'chi',
    'zh-CN': 'chi',
    'zh-TW': 'chi',
    'es': 'spa',
    'fr': 'fre',
    'de': 'ger',
    'ja': 'jpn',
    'ko': 'kor',
    'pt': 'por',
    'ru': 'rus',
    'ar': 'ara',
    'hi': 'hin',
  };

  return langMap[lang] || lang.substring(0, 3);
}
