export interface ZellijSession {
    name: string;
    created: string;
    attached: boolean;
    tabs?: ZellijTab[];
}
export interface ZellijTab {
    name: string;
    active: boolean;
    panes?: ZellijPane[];
}
export interface ZellijPane {
    id: string;
    title?: string;
    command?: string;
    cwd?: string;
    focused: boolean;
}
export interface ZellijPlugin {
    id: string;
    name: string;
    url: string;
    configuration?: Record<string, any>;
    running: boolean;
}
export interface ZellijLayout {
    name: string;
    description?: string;
    tabs: Array<{
        name?: string;
        panes: Array<{
            split_direction?: 'horizontal' | 'vertical';
            parts?: any[];
        }>;
    }>;
}
export interface PipeOptions {
    name?: string;
    plugin?: string;
    args?: string;
    configuration?: Record<string, any>;
    forceLaunch?: boolean;
    skipCache?: boolean;
    floating?: boolean;
    inPlace?: boolean;
    cwd?: string;
    title?: string;
}
export interface PluginLaunchOptions {
    url: string;
    configuration?: Record<string, any>;
    floating?: boolean;
    inPlace?: boolean;
    skipCache?: boolean;
    width?: string;
    height?: string;
    x?: string;
    y?: string;
    pinned?: boolean;
}
export interface SessionExport {
    name: string;
    layout: ZellijLayout;
    created: string;
    metadata?: Record<string, any>;
}
export interface ZellijCommand {
    command: string;
    args: string[];
    session?: string;
    cwd?: string;
    timeout?: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitized?: any;
}
export interface ZellijMetrics {
    sessionsCount: number;
    activeTabsCount: number;
    activePanesCount: number;
    pluginsCount: number;
    memoryUsage?: string;
    uptime?: string;
}
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
}
export declare class ZellijError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class SecurityError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=zellij.d.ts.map