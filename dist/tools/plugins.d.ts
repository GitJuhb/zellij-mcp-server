import { ToolResponse, PluginLaunchOptions } from '../types/zellij.js';
export declare class PluginTools {
    /**
     * Launch a plugin with full options
     */
    static launchPlugin(options: PluginLaunchOptions): Promise<ToolResponse>;
    /**
     * Launch plugin with action command (more options)
     */
    static actionLaunchPlugin(url: string, options?: {
        configuration?: Record<string, any>;
        floating?: boolean;
        inPlace?: boolean;
        skipCache?: boolean;
    }): Promise<ToolResponse>;
    /**
     * Launch or focus plugin (smart activation)
     */
    static launchOrFocusPlugin(url: string, configuration?: Record<string, any>): Promise<ToolResponse>;
    /**
     * Start or reload plugin
     */
    static startOrReloadPlugin(url: string, configuration?: Record<string, any>): Promise<ToolResponse>;
    /**
     * List plugin aliases
     */
    static listAliases(): Promise<ToolResponse>;
    /**
     * Get plugin status/info (simulated - Zellij doesn't have direct plugin status)
     */
    static getPluginInfo(url: string): Promise<ToolResponse>;
    /**
     * Kill/stop plugin (simulated - Zellij handles plugin lifecycle internally)
     */
    static killPlugin(url: string): Promise<ToolResponse>;
    /**
     * List running plugins (simulated - limited info available)
     */
    static listRunningPlugins(): Promise<ToolResponse>;
}
//# sourceMappingURL=plugins.d.ts.map