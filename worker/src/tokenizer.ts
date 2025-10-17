/**
 * Robust shell command tokenizer
 * Handles quotes, escapes, and line continuations
 */
export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  // Remove bash shebang if present
  const lines = command.split('\n').filter(line => !line.startsWith('#!'));

  // Join lines, handling backslash continuations
  const normalized = lines
    .map(line => line.trim())
    .join(' ')
    .replace(/\\\s+/g, ' ');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      // Check if it's a space escape or line continuation
      if (nextChar && /\s/.test(nextChar)) {
        escaped = true;
      }
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens.filter(t => t.length > 0);
}

/**
 * Parse ffmpeg command to extract arguments
 * Removes 'ffmpeg' and common prefixes
 */
export function parseFFmpegArgs(command: string): string[] {
  const tokens = tokenizeCommand(command);

  // Find ffmpeg command start
  const ffmpegIndex = tokens.findIndex(t =>
    t === 'ffmpeg' || t.endsWith('/ffmpeg')
  );

  if (ffmpegIndex === -1) {
    // No ffmpeg found, return all tokens
    return tokens;
  }

  // Return everything after 'ffmpeg'
  return tokens.slice(ffmpegIndex + 1);
}
