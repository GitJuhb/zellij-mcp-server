import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { ValidationError } from '../types/zellij.js';
export class PaneTools {
    /**
     * Advanced pane creation with full options
     */
    static async newPane(direction, command, cwd) {
        let actionCommand = 'new-pane';
        // Validate and add direction
        if (direction) {
            const dirValidation = Validator.validateSplitDirection(direction);
            if (!dirValidation.valid) {
                throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}`);
            }
            actionCommand += ` --direction ${dirValidation.sanitized}`;
        }
        // Validate and add working directory
        if (cwd) {
            const cwdValidation = Validator.validateString(cwd, 'working directory', 512);
            if (!cwdValidation.valid) {
                throw new ValidationError(`Invalid working directory: ${cwdValidation.errors.join(', ')}`);
            }
            actionCommand += ` --cwd "${cwd}"`;
        }
        // Validate and add command
        if (command) {
            const cmdValidation = Validator.validateCommand(command);
            if (!cmdValidation.valid) {
                throw new ValidationError(`Invalid command: ${cmdValidation.errors.join(', ')}`);
            }
            actionCommand += ` -- ${command}`;
        }
        const result = await execAsync(`zellij action ${actionCommand}`);
        return {
            content: [{
                    type: 'text',
                    text: `New pane created${direction ? ` (${direction})` : ''}${command ? ` running: ${command}` : ''}${cwd ? ` in: ${cwd}` : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Swap pane positions
     */
    static async swapPanes(direction) {
        // Validate direction
        const dirValidation = Validator.validateDirection(direction);
        if (!dirValidation.valid) {
            throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij action move-pane ${dirValidation.sanitized}`);
        return {
            content: [{
                    type: 'text',
                    text: `Pane moved: ${dirValidation.sanitized}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Stack panes by IDs
     */
    static async stackPanes(paneIds) {
        if (!Array.isArray(paneIds) || paneIds.length === 0) {
            throw new ValidationError('Pane IDs array is required and cannot be empty');
        }
        // Validate pane IDs
        const validatedIds = [];
        for (const id of paneIds) {
            if (!/^(terminal_|plugin_)?\d+$/.test(id)) {
                throw new ValidationError(`Invalid pane ID format: ${id}. Expected format: 'terminal_1', 'plugin_1', or '1'`);
            }
            validatedIds.push(id);
        }
        const idsString = validatedIds.join(' ');
        const result = await execAsync(`zellij action stack-panes ${idsString}`);
        return {
            content: [{
                    type: 'text',
                    text: `Panes stacked: ${idsString}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Toggle floating pane mode
     */
    static async toggleFloating() {
        const result = await execAsync('zellij action toggle-floating-panes');
        return {
            content: [{
                    type: 'text',
                    text: `Floating panes toggled${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Toggle fullscreen mode
     */
    static async toggleFullscreen() {
        const result = await execAsync('zellij action toggle-fullscreen');
        return {
            content: [{
                    type: 'text',
                    text: `Fullscreen toggled${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Toggle pane embed/floating
     */
    static async togglePaneEmbedFloat() {
        const result = await execAsync('zellij action toggle-pane-embed-or-floating');
        return {
            content: [{
                    type: 'text',
                    text: `Pane embed/floating toggled${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Pin floating pane
     */
    static async pinPane() {
        const result = await execAsync('zellij action toggle-pane-pinned');
        return {
            content: [{
                    type: 'text',
                    text: `Pane pin toggled${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Toggle pane frames
     */
    static async toggleFrames() {
        const result = await execAsync('zellij action toggle-pane-frames');
        return {
            content: [{
                    type: 'text',
                    text: `Pane frames toggled${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Clear pane buffer
     */
    static async clearPane() {
        const result = await execAsync('zellij action clear');
        return {
            content: [{
                    type: 'text',
                    text: `Pane cleared${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Dump pane screen content to file
     */
    static async dumpScreen(outputPath) {
        let command = 'action dump-screen';
        if (outputPath) {
            // Validate output path
            if (outputPath.includes('..') || !outputPath.match(/^[\w\/\-\.]+$/)) {
                throw new ValidationError('Invalid output path');
            }
            command += ` ${outputPath}`;
        }
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: outputPath
                        ? `Screen dumped to: ${outputPath}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                        : `Screen content:\n\n${result.stdout}`
                }]
        };
    }
    /**
     * Edit pane scrollback in editor
     */
    static async editScrollback() {
        const result = await execAsync('zellij action edit-scrollback');
        return {
            content: [{
                    type: 'text',
                    text: `Scrollback opened in editor${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Rename current pane
     */
    static async renamePane(name) {
        // Validate pane name
        const nameValidation = Validator.validateString(name, 'pane name', 64);
        if (!nameValidation.valid) {
            throw new ValidationError(`Invalid pane name: ${nameValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij action rename-pane "${nameValidation.sanitized}"`);
        return {
            content: [{
                    type: 'text',
                    text: `Pane renamed to: ${nameValidation.sanitized}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Undo pane rename
     */
    static async undoRenamePane() {
        const result = await execAsync('zellij action undo-rename-pane');
        return {
            content: [{
                    type: 'text',
                    text: `Pane name reset${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Enhanced move focus with validation
     */
    static async moveFocus(direction) {
        let actionCommand;
        // Validate direction and map to correct command
        const dirValidation = Validator.validateDirection(direction);
        if (!dirValidation.valid) {
            throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}`);
        }
        switch (dirValidation.sanitized) {
            case 'next':
                actionCommand = 'focus-next-pane';
                break;
            case 'previous':
                actionCommand = 'focus-previous-pane';
                break;
            default:
                actionCommand = `move-focus ${dirValidation.sanitized}`;
        }
        const result = await execAsync(`zellij action ${actionCommand}`);
        return {
            content: [{
                    type: 'text',
                    text: `Focus moved: ${dirValidation.sanitized}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Move focus or tab (edge behavior)
     */
    static async moveFocusOrTab(direction) {
        // Validate direction
        const validDirections = ['left', 'right', 'up', 'down'];
        const dirValidation = Validator.validateDirection(direction);
        if (!dirValidation.valid || !validDirections.includes(dirValidation.sanitized)) {
            throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}. Must be one of: ${validDirections.join(', ')}`);
        }
        const result = await execAsync(`zellij action move-focus-or-tab ${dirValidation.sanitized}`);
        return {
            content: [{
                    type: 'text',
                    text: `Focus or tab moved: ${dirValidation.sanitized}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Scroll in pane
     */
    static async scroll(direction, amount = 'line') {
        if (!['up', 'down'].includes(direction)) {
            throw new ValidationError('Direction must be "up" or "down"');
        }
        if (!['line', 'half-page', 'page'].includes(amount)) {
            throw new ValidationError('Amount must be "line", "half-page", or "page"');
        }
        let actionCommand;
        switch (amount) {
            case 'half-page':
                actionCommand = direction === 'up' ? 'half-page-scroll-up' : 'half-page-scroll-down';
                break;
            case 'page':
                actionCommand = direction === 'up' ? 'page-scroll-up' : 'page-scroll-down';
                break;
            default: // line
                actionCommand = direction === 'up' ? 'scroll-up' : 'scroll-down';
        }
        const result = await execAsync(`zellij action ${actionCommand}`);
        return {
            content: [{
                    type: 'text',
                    text: `Scrolled ${direction} by ${amount}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Scroll to top or bottom
     */
    static async scrollToEdge(edge) {
        if (!['top', 'bottom'].includes(edge)) {
            throw new ValidationError('Edge must be "top" or "bottom"');
        }
        const actionCommand = edge === 'top' ? 'scroll-to-top' : 'scroll-to-bottom';
        const result = await execAsync(`zellij action ${actionCommand}`);
        return {
            content: [{
                    type: 'text',
                    text: `Scrolled to ${edge}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Execute command in current pane
     */
    static async execInPane(command) {
        // Validate command
        const cmdValidation = Validator.validateCommand(command);
        if (!cmdValidation.valid) {
            throw new ValidationError(`Invalid command: ${cmdValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij action write-chars "${cmdValidation.sanitized}"`);
        // Also send Enter to execute
        await execAsync('zellij action write-chars "\\n"');
        return {
            content: [{
                    type: 'text',
                    text: `Command executed in pane: ${cmdValidation.sanitized}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Write text to pane (enhanced with validation)
     */
    static async writeToPane(text, submit = false) {
        // Validate text
        const textValidation = Validator.validateText(text);
        if (!textValidation.valid) {
            throw new ValidationError(`Invalid text: ${textValidation.errors.join(', ')}`);
        }
        const result = await execAsync(`zellij action write-chars "${textValidation.sanitized}"`);
        if (submit) {
            // Send Enter to submit
            await execAsync('zellij action write-chars "\\n"');
        }
        return {
            content: [{
                    type: 'text',
                    text: `Text written to pane: ${textValidation.sanitized}${submit ? ' (submitted)' : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Get pane information (simulated - Zellij doesn't provide direct pane info)
     */
    static async getPaneInfo() {
        try {
            // Use dump-layout to get current pane structure
            const result = await execAsync('zellij action dump-layout');
            return {
                content: [{
                        type: 'text',
                        text: `Current Pane Layout Information:\n\n${result.stdout}\n\nNote: This shows the current layout structure. Individual pane details are not directly available from Zellij CLI.`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Unable to retrieve pane information. Error: ${error instanceof Error ? error.message : String(error)}\n\nNote: Zellij doesn't provide direct pane querying capabilities via CLI.`
                    }]
            };
        }
    }
    /**
     * Change floating pane coordinates
     */
    static async changeFloatingCoordinates(x, y, width, height) {
        // Validate coordinates
        if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || y < 0) {
            throw new ValidationError('X and Y coordinates must be non-negative numbers');
        }
        if (width !== undefined && (typeof width !== 'number' || width <= 0)) {
            throw new ValidationError('Width must be a positive number');
        }
        if (height !== undefined && (typeof height !== 'number' || height <= 0)) {
            throw new ValidationError('Height must be a positive number');
        }
        let command = `action change-floating-pane-coordinates ${x} ${y}`;
        if (width !== undefined) {
            command += ` ${width}`;
        }
        if (height !== undefined && width !== undefined) {
            command += ` ${height}`;
        }
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: `Floating pane coordinates changed: (${x}, ${y})${width ? `, width: ${width}` : ''}${height ? `, height: ${height}` : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
}
//# sourceMappingURL=panes.js.map