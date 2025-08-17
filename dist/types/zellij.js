// Zellij type definitions for the MCP server
// Error types
export class ZellijError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ZellijError';
    }
}
export class ValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}
//# sourceMappingURL=zellij.js.map