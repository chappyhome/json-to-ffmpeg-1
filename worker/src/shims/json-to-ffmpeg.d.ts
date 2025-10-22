declare module 'json-to-ffmpeg' {
  // Minimal fallback typings to satisfy TypeScript when the package
  // isn't installed locally. Runtime should use the real package.
  export function parseSchema(schema: any, onlyFilterComplex?: boolean): string;
  export function buildTokens(schema: any): string[];
}

