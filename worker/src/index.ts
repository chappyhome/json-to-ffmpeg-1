import { parseSchema, buildTokens } from 'json-to-ffmpeg';
import { validateTimeline } from './validation';
import { validateCompleteTimeline, type ValidationResult } from './validation-complete';
import { parseFFmpegArgs } from './tokenizer';
import { PluginManager } from './plugin-manager';
import { normalizeOutputPlugin, validateTracksPlugin } from './plugins';
import type { BuildResult, VersionInfo, HealthResponse } from './types';

// Package version (update manually or via build process)
const WORKER_VERSION = '1.0.0';
const LIBRARY_VERSION = '1.2.3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Initialize plugin manager with default plugins
 */
function createPluginManager(): PluginManager {
  const manager = new PluginManager();
  manager.register(validateTracksPlugin);
  manager.register(normalizeOutputPlugin);
  return manager;
}

/**
 * Handle POST /build
 */
async function handleBuild(request: Request): Promise<Response> {
  try {
    // Parse JSON body
    const body = await request.json();

    // Validate basic structure
    const validatedTimeline = validateTimeline(body);

    // Run plugins
    const pluginManager = createPluginManager();
    const { timeline, warnings } = await pluginManager.execute(validatedTimeline);

    // Generate command and args via library
    const command = parseSchema(timeline);
    let args: string[] = [];
    try {
      args = buildTokens(timeline);
    } catch {
      // Fallback to parsing when tokens are unavailable
      args = parseFFmpegArgs(command);
    }

    const result: BuildResult = {
      command,
      args,
    };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: 'Failed to build FFmpeg command',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

/**
 * Handle GET /version
 */
function handleVersion(): Response {
  const versionInfo: VersionInfo = {
    workerVersion: WORKER_VERSION,
    libraryVersion: LIBRARY_VERSION,
  };

  return new Response(JSON.stringify(versionInfo, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Handle GET /health
 */
function handleHealth(): Response {
  const health: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Handle POST /validate
 * 完整验证 timeline JSON，不生成命令
 */
async function handleValidate(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result: ValidationResult = validateCompleteTimeline(body);

    if (result.valid) {
      return new Response(JSON.stringify({
        valid: true,
        message: 'Timeline JSON 验证通过',
        warnings: result.warnings,
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    } else {
      return new Response(JSON.stringify({
        valid: false,
        message: 'Timeline JSON 验证失败',
        errors: result.errors,
      }, null, 2), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        valid: false,
        message: '无法解析 JSON 或验证过程出错',
        errors: [{
          path: '',
          message: errorMessage,
          code: 'PARSE_ERROR',
        }],
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

/**
 * Main fetch handler
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
    }

    // Route handlers
    if (method === 'POST' && path === '/build') {
      return handleBuild(request);
    }

    if (method === 'POST' && path === '/validate') {
      return handleValidate(request);
    }

    if (method === 'GET' && path === '/version') {
      return handleVersion();
    }

    if (method === 'GET' && path === '/health') {
      return handleHealth();
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: `Route ${method} ${path} not found`,
        availableRoutes: [
          'POST /build - Build FFmpeg command from timeline JSON',
          'POST /validate - Validate timeline JSON without building',
          'GET /version - Get version information',
          'GET /health - Health check',
        ],
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
