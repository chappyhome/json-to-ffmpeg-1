/**
 * Plugin protocol: transforms timeline JSON
 * Can return warnings that will be included in the response
 */
export type PluginResult = {
  timeline: any;
  warnings?: string[];
};

export type Plugin = (timeline: any) => PluginResult | any;

/**
 * Build result returned by the API
 */
export interface BuildResult {
  command: string;
  args: string[];
  warnings?: string[];
}

/**
 * Version info
 */
export interface VersionInfo {
  workerVersion: string;
  libraryVersion: string;
  libraryCommit?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}
