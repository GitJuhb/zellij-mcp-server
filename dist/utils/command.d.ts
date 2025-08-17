export interface CommandResult {
    stdout: string;
    stderr: string;
}
export declare function execAsync(command: string, options?: {
    timeout?: number;
    cwd?: string;
}): Promise<CommandResult>;
//# sourceMappingURL=command.d.ts.map