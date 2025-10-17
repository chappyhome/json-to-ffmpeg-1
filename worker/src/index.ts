import { parseSchema } from 'json-to-ffmpeg';
import { validateTimeline } from './validation';
import { parseFFmpegArgs } from './tokenizer';
import { PluginManager } from './plugin-manager';
import { normalizeOutputPlugin, validateTracksPlugin } from './plugins';
import type { BuildResult, VersionInfo, HealthResponse } from './types';

// Package version (update manually or via build process)
const WORKER_VERSION = '1.0.0';
const LIBRARY_VERSION = '1.2.3';

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

    // Generate command using library
    const command = parseSchema(timeline);

    // Try to use buildTokens if available, otherwise parse command
    let args: string[];
    try {
      // Import buildTokens dynamically
      const { buildTokens } = await import('json-to-ffmpeg');
      args = buildTokens(timeline);
    } catch (error) {
      // Fallback to parsing command string
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
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Main fetch handler
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Route handlers
    if (method === 'POST' && path === '/build') {
      return handleBuild(request);
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
