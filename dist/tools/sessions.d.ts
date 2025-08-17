import { ToolResponse } from '../types/zellij.js';
export declare class SessionTools {
    /**
     * Enhanced session listing with caching
     */
    static listSessions(): Promise<ToolResponse>;
    /**
     * Get detailed session information
     */
    static getSessionInfo(sessionName: string): Promise<ToolResponse>;
    /**
     * Export session configuration to JSON
     */
    static exportSession(sessionName: string, outputPath?: string): Promise<ToolResponse>;
    /**
     * Import session from JSON
     */
    static importSession(importPath: string, newSessionName?: string): Promise<ToolResponse>;
    /**
     * Clone an existing session
     */
    static cloneSession(sourceSessionName: string, newSessionName: string): Promise<ToolResponse>;
    /**
     * Rename a session
     */
    static renameSession(oldName: string, newName: string): Promise<ToolResponse>;
    /**
     * Switch to a session
     */
    static switchSession(sessionName: string): Promise<ToolResponse>;
    /**
     * Convert JSON layout to basic KDL format (simplified)
     */
    private static convertJsonToKdl;
    /**
     * Kill all sessions
     */
    static killAllSessions(): Promise<ToolResponse>;
    /**
     * Delete all sessions
     */
    static deleteAllSessions(): Promise<ToolResponse>;
}
//# sourceMappingURL=sessions.d.ts.map