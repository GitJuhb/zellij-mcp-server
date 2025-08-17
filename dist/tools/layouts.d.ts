import { ToolResponse } from '../types/zellij.js';
export declare class LayoutTools {
    /**
     * Dump current layout to stdout or file
     */
    static dumpLayout(outputPath?: string): Promise<ToolResponse>;
    /**
     * Save current layout to a named file in layouts directory
     */
    static saveLayout(layoutName: string, layoutsDir?: string): Promise<ToolResponse>;
    /**
     * Apply a layout to current session or new session
     */
    static applyLayout(layoutName: string, sessionName?: string): Promise<ToolResponse>;
    /**
     * List available layouts
     */
    static listLayouts(layoutsDir?: string): Promise<ToolResponse>;
    /**
     * Load layout content from file
     */
    static loadLayout(layoutName: string, layoutsDir?: string): Promise<ToolResponse>;
    /**
     * Create a new tab with specific layout
     */
    static newTabWithLayout(layoutName: string, tabName?: string): Promise<ToolResponse>;
    /**
     * Convert layout format (basic conversion utilities)
     */
    static convertLayout(inputPath: string, outputPath: string, fromFormat: 'kdl' | 'json', toFormat: 'kdl' | 'json'): Promise<ToolResponse>;
    /**
     * Simple KDL to JSON conversion (basic implementation)
     */
    private static convertKdlToJson;
    /**
     * Simple JSON to KDL conversion (basic implementation)
     */
    private static convertJsonToKdl;
    /**
     * Validate layout file syntax
     */
    static validateLayout(layoutPath: string): Promise<ToolResponse>;
}
//# sourceMappingURL=layouts.d.ts.map