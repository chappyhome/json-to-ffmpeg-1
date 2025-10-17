import type { Plugin, PluginResult } from './types';

/**
 * Plugin manager - executes plugins in order
 */
export class PluginManager {
  private plugins: Plugin[] = [];

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Execute all plugins in sequence
   * Returns transformed timeline and accumulated warnings
   */
  async execute(timeline: any): Promise<{ timeline: any; warnings: string[] }> {
    let current = timeline;
    const warnings: string[] = [];

    for (const plugin of this.plugins) {
      const result = await plugin(current);

      // Handle both direct return and PluginResult format
      if (result && typeof result === 'object' && 'timeline' in result) {
        const pluginResult = result as PluginResult;
        current = pluginResult.timeline;
        if (pluginResult.warnings) {
          warnings.push(...pluginResult.warnings);
        }
      } else {
        current = result;
      }
    }

    return { timeline: current, warnings };
  }

  /**
   * Get plugin count
   */
  get count(): number {
    return this.plugins.length;
  }
}
