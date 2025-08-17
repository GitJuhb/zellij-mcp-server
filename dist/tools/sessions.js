import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { cache } from '../utils/cache.js';
import { ValidationError } from '../types/zellij.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
export class SessionTools {
    /**
     * Enhanced session listing with caching
     */
    static async listSessions() {
        // Check cache first
        const cacheKey = 'sessions_list';
        const cached = cache.get(cacheKey);
        if (cached) {
            return {
                content: [{
                        type: 'text',
                        text: cached
                    }]
            };
        }
        const result = await execAsync('zellij list-sessions');
        const output = result.stdout || 'No active sessions found.';
        // Cache for 5 seconds
        cache.set(cacheKey, output, 5000);
        return {
            content: [{
                    type: 'text',
                    text: output
                }]
        };
    }
    /**
     * Get detailed session information
     */
    static async getSessionInfo(sessionName) {
        // Validate session name
        const nameValidation = Validator.validateSessionName(sessionName);
        if (!nameValidation.valid) {
            throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
        }
        // Check cache first
        const cacheKey = `session_info_${sessionName}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return {
                content: [{
                        type: 'text',
                        text: cached
                    }]
            };
        }
        try {
            // Get session list to check if session exists and get basic info
            const sessionsList = await execAsync('zellij list-sessions');
            let sessionInfo = `Session Information: ${sessionName}\n\n`;
            if (sessionsList.stdout.includes(sessionName)) {
                sessionInfo += `Status: Active\n`;
                // Try to get layout information
                try {
                    const layoutResult = await execAsync(`zellij action dump-layout --session ${sessionName}`);
                    sessionInfo += `Layout available: Yes\n`;
                    sessionInfo += `Layout details in dump-layout command output\n`;
                }
                catch (e) {
                    sessionInfo += `Layout available: No (session may not be current session)\n`;
                }
            }
            else {
                sessionInfo += `Status: Not found or inactive\n`;
            }
            // Cache for 10 seconds
            cache.set(cacheKey, sessionInfo, 10000);
            return {
                content: [{
                        type: 'text',
                        text: sessionInfo
                    }]
            };
        }
        catch (error) {
            throw new ValidationError(`Failed to get session info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Export session configuration to JSON
     */
    static async exportSession(sessionName, outputPath) {
        // Validate session name
        const nameValidation = Validator.validateSessionName(sessionName);
        if (!nameValidation.valid) {
            throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
        }
        // Validate output path if provided
        if (outputPath) {
            if (outputPath.includes('..') || !outputPath.match(/^[\w\/\-\.]+$/)) {
                throw new ValidationError('Invalid output path');
            }
        }
        try {
            // Get current layout
            const layoutResult = await execAsync(`zellij action dump-layout --session ${sessionName}`);
            // Create export object
            const sessionExport = {
                name: sessionName,
                layout: JSON.parse(layoutResult.stdout),
                created: new Date().toISOString(),
                metadata: {
                    exportedBy: 'zellij-mcp-server',
                    version: '1.0.0'
                }
            };
            const exportJson = JSON.stringify(sessionExport, null, 2);
            if (outputPath) {
                // Save to file
                writeFileSync(outputPath, exportJson);
                return {
                    content: [{
                            type: 'text',
                            text: `Session exported to: ${outputPath}`
                        }]
                };
            }
            else {
                // Return JSON directly
                return {
                    content: [{
                            type: 'text',
                            text: `Session Export (JSON):\n\n${exportJson}`
                        }]
                };
            }
        }
        catch (error) {
            throw new ValidationError(`Failed to export session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Import session from JSON
     */
    static async importSession(importPath, newSessionName) {
        // Validate import path
        if (!importPath || importPath.includes('..') || !importPath.match(/^[\w\/\-\.]+$/)) {
            throw new ValidationError('Invalid import path');
        }
        if (!existsSync(importPath)) {
            throw new ValidationError('Import file does not exist');
        }
        try {
            // Read and parse import file
            const importData = readFileSync(importPath, 'utf8');
            const sessionData = JSON.parse(importData);
            // Validate session data
            if (!sessionData.layout) {
                throw new ValidationError('Invalid session export: missing layout data');
            }
            const sessionName = newSessionName || sessionData.name || 'imported-session';
            // Validate session name
            const nameValidation = Validator.validateSessionName(sessionName);
            if (!nameValidation.valid) {
                throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
            }
            // Create temporary layout file
            const tempLayoutPath = `/tmp/zellij-import-${Date.now()}.kdl`;
            // Convert JSON layout back to KDL format (simplified)
            // Note: This is a basic conversion - full KDL conversion would be more complex
            const layoutKdl = this.convertJsonToKdl(sessionData.layout);
            writeFileSync(tempLayoutPath, layoutKdl);
            // Create session with layout
            await execAsync(`zellij --session ${sessionName} --layout ${tempLayoutPath}`);
            // Clear cache
            cache.delete('sessions_list');
            return {
                content: [{
                        type: 'text',
                        text: `Session imported successfully: ${sessionName}\nLayout applied from: ${importPath}`
                    }]
            };
        }
        catch (error) {
            throw new ValidationError(`Failed to import session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clone an existing session
     */
    static async cloneSession(sourceSessionName, newSessionName) {
        // Validate session names
        const sourceValidation = Validator.validateSessionName(sourceSessionName);
        if (!sourceValidation.valid) {
            throw new ValidationError(`Invalid source session name: ${sourceValidation.errors.join(', ')}`);
        }
        const targetValidation = Validator.validateSessionName(newSessionName);
        if (!targetValidation.valid) {
            throw new ValidationError(`Invalid target session name: ${targetValidation.errors.join(', ')}`);
        }
        try {
            // Export source session to temporary location
            const tempExportPath = `/tmp/zellij-clone-${Date.now()}.json`;
            await this.exportSession(sourceSessionName, tempExportPath);
            // Import to create new session
            await this.importSession(tempExportPath, newSessionName);
            // Clean up temp file
            try {
                const fs = await import('fs');
                fs.unlinkSync(tempExportPath);
            }
            catch (e) {
                // Ignore cleanup errors
            }
            return {
                content: [{
                        type: 'text',
                        text: `Session cloned successfully: ${sourceSessionName} → ${newSessionName}`
                    }]
            };
        }
        catch (error) {
            throw new ValidationError(`Failed to clone session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Rename a session
     */
    static async renameSession(oldName, newName) {
        // Validate session names
        const oldValidation = Validator.validateSessionName(oldName);
        if (!oldValidation.valid) {
            throw new ValidationError(`Invalid old session name: ${oldValidation.errors.join(', ')}`);
        }
        const newValidation = Validator.validateSessionName(newName);
        if (!newValidation.valid) {
            throw new ValidationError(`Invalid new session name: ${newValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij action rename-session ${newName} --session ${oldName}`);
        // Clear cache
        cache.delete('sessions_list');
        cache.delete(`session_info_${oldName}`);
        return {
            content: [{
                    type: 'text',
                    text: `Session renamed: ${oldName} → ${newName}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Switch to a session
     */
    static async switchSession(sessionName) {
        // Validate session name
        const nameValidation = Validator.validateSessionName(sessionName);
        if (!nameValidation.valid) {
            throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij attach ${sessionName}`);
        return {
            content: [{
                    type: 'text',
                    text: `Switched to session: ${sessionName}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Convert JSON layout to basic KDL format (simplified)
     */
    static convertJsonToKdl(layout) {
        // This is a very basic conversion - a full implementation would be much more complex
        let kdl = 'layout {\n';
        if (layout.tabs && Array.isArray(layout.tabs)) {
            for (const tab of layout.tabs) {
                kdl += '  tab {\n';
                if (tab.name) {
                    kdl += `    name "${tab.name}"\n`;
                }
                if (tab.panes && Array.isArray(tab.panes)) {
                    for (const pane of tab.panes) {
                        kdl += '    pane\n';
                    }
                }
                kdl += '  }\n';
            }
        }
        else {
            // Default single tab layout
            kdl += '  tab {\n    pane\n  }\n';
        }
        kdl += '}\n';
        return kdl;
    }
    /**
     * Kill all sessions
     */
    static async killAllSessions() {
        const result = await execAsync('zellij kill-all-sessions');
        // Clear all session-related cache
        cache.clear();
        return {
            content: [{
                    type: 'text',
                    text: `All sessions killed${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Delete all sessions
     */
    static async deleteAllSessions() {
        const result = await execAsync('zellij delete-all-sessions');
        // Clear all session-related cache
        cache.clear();
        return {
            content: [{
                    type: 'text',
                    text: `All sessions deleted${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
}
//# sourceMappingURL=sessions.js.map