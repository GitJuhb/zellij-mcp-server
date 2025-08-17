import { ToolResponse } from '../types/zellij.js';
export declare class DetectionTools {
    private static watchers;
    private static processes;
    /**
     * Watch a pipe for specific patterns or EOF with timeout
     */
    static watchPipe(pipePath: string, patterns?: string[], timeoutMs?: number): Promise<ToolResponse>;
    /**
     * Create a named pipe for bidirectional communication
     */
    static createNamedPipe(pipeName: string, mode?: string): Promise<ToolResponse>;
    /**
     * Pipe command output with automatic timeout completion
     */
    static pipeWithTimeout(command: string, targetPipe: string, timeoutMs?: number): Promise<ToolResponse>;
    /**
     * Poll process status by PID
     */
    static pollProcess(pid: string | number, intervalMs?: number): Promise<ToolResponse>;
    /**
     * Watch file for changes with inotify-like functionality
     */
    static watchFile(filePath: string, patterns?: string[], timeoutMs?: number): Promise<ToolResponse>;
    /**
     * Create LLM completion detector wrapper
     */
    static createLLMWrapper(wrapperName: string, llmCommand: string, detectMarker?: string, timeoutMs?: number): Promise<ToolResponse>;
    /**
     * Clean up detection resources
     */
    static cleanupDetection(): Promise<ToolResponse>;
}
//# sourceMappingURL=detection.d.ts.map