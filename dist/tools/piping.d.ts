import { ToolResponse, PipeOptions } from '../types/zellij.js';
export declare class PipingTools {
    /**
     * Send data to one or more plugins via pipe
     */
    static pipe(payload: string, options?: PipeOptions): Promise<ToolResponse>;
    /**
     * Send data to a specific plugin
     */
    static pipeToPlugin(payload: string, pluginUrl: string, pipeName?: string, configuration?: Record<string, any>): Promise<ToolResponse>;
    /**
     * Broadcast data to all listening plugins
     */
    static pipeBroadcast(payload: string, pipeName: string): Promise<ToolResponse>;
    /**
     * Send data with advanced action pipe options
     */
    static actionPipe(payload: string, options?: PipeOptions): Promise<ToolResponse>;
    /**
     * Pipe with response capture (using STDIN/STDOUT)
     */
    static pipeWithResponse(payload: string, options?: PipeOptions): Promise<ToolResponse>;
    /**
     * Pipe data from a file
     */
    static pipeFromFile(filePath: string, options?: PipeOptions): Promise<ToolResponse>;
}
//# sourceMappingURL=piping.d.ts.map