import { ToolResponse } from '../types/zellij.js';
export declare class PaneTools {
    /**
     * Advanced pane creation with full options
     */
    static newPane(direction?: string, command?: string, cwd?: string): Promise<ToolResponse>;
    /**
     * Swap pane positions
     */
    static swapPanes(direction: string): Promise<ToolResponse>;
    /**
     * Stack panes by IDs
     */
    static stackPanes(paneIds: string[]): Promise<ToolResponse>;
    /**
     * Toggle floating pane mode
     */
    static toggleFloating(): Promise<ToolResponse>;
    /**
     * Toggle fullscreen mode
     */
    static toggleFullscreen(): Promise<ToolResponse>;
    /**
     * Toggle pane embed/floating
     */
    static togglePaneEmbedFloat(): Promise<ToolResponse>;
    /**
     * Pin floating pane
     */
    static pinPane(): Promise<ToolResponse>;
    /**
     * Toggle pane frames
     */
    static toggleFrames(): Promise<ToolResponse>;
    /**
     * Clear pane buffer
     */
    static clearPane(): Promise<ToolResponse>;
    /**
     * Dump pane screen content to file
     */
    static dumpScreen(outputPath?: string): Promise<ToolResponse>;
    /**
     * Edit pane scrollback in editor
     */
    static editScrollback(): Promise<ToolResponse>;
    /**
     * Rename current pane
     */
    static renamePane(name: string): Promise<ToolResponse>;
    /**
     * Undo pane rename
     */
    static undoRenamePane(): Promise<ToolResponse>;
    /**
     * Enhanced move focus with validation
     */
    static moveFocus(direction: string): Promise<ToolResponse>;
    /**
     * Move focus or tab (edge behavior)
     */
    static moveFocusOrTab(direction: string): Promise<ToolResponse>;
    /**
     * Scroll in pane
     */
    static scroll(direction: 'up' | 'down', amount?: 'line' | 'half-page' | 'page'): Promise<ToolResponse>;
    /**
     * Scroll to top or bottom
     */
    static scrollToEdge(edge: 'top' | 'bottom'): Promise<ToolResponse>;
    /**
     * Execute command in current pane
     */
    static execInPane(command: string): Promise<ToolResponse>;
    /**
     * Write text to pane (enhanced with validation)
     */
    static writeToPane(text: string, submit?: boolean): Promise<ToolResponse>;
    /**
     * Get pane information (simulated - Zellij doesn't provide direct pane info)
     */
    static getPaneInfo(): Promise<ToolResponse>;
    /**
     * Change floating pane coordinates
     */
    static changeFloatingCoordinates(x: number, y: number, width?: number, height?: number): Promise<ToolResponse>;
}
//# sourceMappingURL=panes.d.ts.map