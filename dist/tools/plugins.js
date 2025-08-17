import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { cache } from '../utils/cache.js';
import { ValidationError } from '../types/zellij.js';
export class PluginTools {
    /**
     * Launch a plugin with full options
     */
    static async launchPlugin(options) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(options.url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        let command = `plugin "${options.url}"`;
        // Add configuration if provided
        if (options.configuration) {
            try {
                const configJson = JSON.stringify(options.configuration);
                command += ` --configuration '${configJson}'`;
            }
            catch (e) {
                throw new ValidationError('Invalid plugin configuration: must be valid JSON');
            }
        }
        // Add layout options
        if (options.floating) {
            command += ' --floating';
        }
        if (options.inPlace) {
            command += ' --in-place';
        }
        if (options.skipCache) {
            command += ' --skip-plugin-cache';
        }
        // Floating window options
        if (options.width) {
            const widthValidation = Validator.validateString(options.width, 'width', 20);
            if (!widthValidation.valid) {
                throw new ValidationError(`Invalid width: ${widthValidation.errors.join(', ')}`);
            }
            command += ` --width ${options.width}`;
        }
        if (options.height) {
            const heightValidation = Validator.validateString(options.height, 'height', 20);
            if (!heightValidation.valid) {
                throw new ValidationError(`Invalid height: ${heightValidation.errors.join(', ')}`);
            }
            command += ` --height ${options.height}`;
        }
        if (options.x) {
            const xValidation = Validator.validateString(options.x, 'x position', 20);
            if (!xValidation.valid) {
                throw new ValidationError(`Invalid x position: ${xValidation.errors.join(', ')}`);
            }
            command += ` --x ${options.x}`;
        }
        if (options.y) {
            const yValidation = Validator.validateString(options.y, 'y position', 20);
            if (!yValidation.valid) {
                throw new ValidationError(`Invalid y position: ${yValidation.errors.join(', ')}`);
            }
            command += ` --y ${options.y}`;
        }
        if (options.pinned) {
            command += ' --pinned true';
        }
        // Clear plugin cache for this URL
        cache.delete(`plugins_list`);
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: `Plugin launched successfully: ${options.url}${options.floating ? ' (floating)' : ''}${options.inPlace ? ' (in-place)' : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Launch plugin with action command (more options)
     */
    static async actionLaunchPlugin(url, options = {}) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        let command = `action launch-plugin "${url}"`;
        if (options.configuration) {
            try {
                const configJson = JSON.stringify(options.configuration);
                command += ` --configuration '${configJson}'`;
            }
            catch (e) {
                throw new ValidationError('Invalid plugin configuration: must be valid JSON');
            }
        }
        if (options.floating) {
            command += ' --floating';
        }
        if (options.inPlace) {
            command += ' --in-place';
        }
        if (options.skipCache) {
            command += ' --skip-plugin-cache';
        }
        // Clear plugin cache
        cache.delete(`plugins_list`);
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: `Plugin launched via action: ${url}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Launch or focus plugin (smart activation)
     */
    static async launchOrFocusPlugin(url, configuration) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        let command = `action launch-or-focus-plugin "${url}"`;
        if (configuration) {
            try {
                const configJson = JSON.stringify(configuration);
                command += ` --configuration '${configJson}'`;
            }
            catch (e) {
                throw new ValidationError('Invalid plugin configuration: must be valid JSON');
            }
        }
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: `Plugin launched or focused: ${url}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * Start or reload plugin
     */
    static async startOrReloadPlugin(url, configuration) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        let command = `action start-or-reload-plugin "${url}"`;
        if (configuration) {
            try {
                const configJson = JSON.stringify(configuration);
                command += ` --configuration '${configJson}'`;
            }
            catch (e) {
                throw new ValidationError('Invalid plugin configuration: must be valid JSON');
            }
        }
        // Clear plugin cache
        cache.delete(`plugins_list`);
        const result = await execAsync(`zellij ${command}`);
        return {
            content: [{
                    type: 'text',
                    text: `Plugin started or reloaded: ${url}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
                }]
        };
    }
    /**
     * List plugin aliases
     */
    static async listAliases() {
        // Check cache first
        const cacheKey = 'plugin_aliases';
        const cached = cache.get(cacheKey);
        if (cached) {
            return {
                content: [{
                        type: 'text',
                        text: cached
                    }]
            };
        }
        const result = await execAsync('zellij list-aliases');
        const output = result.stdout || 'No plugin aliases found.';
        // Cache for 30 seconds
        cache.set(cacheKey, output, 30000);
        return {
            content: [{
                    type: 'text',
                    text: output
                }]
        };
    }
    /**
     * Get plugin status/info (simulated - Zellij doesn't have direct plugin status)
     */
    static async getPluginInfo(url) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        // This is a simulated response since Zellij doesn't provide direct plugin info
        // In a real implementation, this might involve inspecting running processes
        return {
            content: [{
                    type: 'text',
                    text: `Plugin Info for: ${url}\nStatus: Unknown (Zellij doesn't provide direct plugin status)\nRecommendation: Use launch-or-focus-plugin to check if plugin is running`
                }]
        };
    }
    /**
     * Kill/stop plugin (simulated - Zellij handles plugin lifecycle internally)
     */
    static async killPlugin(url) {
        // Validate plugin URL
        const urlValidation = Validator.validatePluginUrl(url);
        if (!urlValidation.valid) {
            throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
        }
        // Clear cache since plugin state might change
        cache.delete(`plugins_list`);
        return {
            content: [{
                    type: 'text',
                    text: `Plugin termination requested: ${url}\nNote: Zellij manages plugin lifecycle internally. Plugins typically terminate when their pane is closed or session ends.`
                }]
        };
    }
    /**
     * List running plugins (simulated - limited info available)
     */
    static async listRunningPlugins() {
        // Check cache first
        const cacheKey = 'running_plugins';
        const cached = cache.get(cacheKey);
        if (cached) {
            return {
                content: [{
                        type: 'text',
                        text: cached
                    }]
            };
        }
        // This would typically require parsing session info or using advanced Zellij commands
        // For now, we'll provide a helpful response
        const output = `Running Plugins Information:

Note: Zellij doesn't provide a direct way to list running plugins.
To see active plugins, you can:

1. Use 'zellij action dump-layout' to see layout structure
2. Check for plugin panes in your current session
3. Use plugin aliases to launch or focus known plugins

Recommendations:
- Use launch-or-focus-plugin to safely activate plugins
- Check session layout for plugin panes
- Monitor pane titles for plugin indicators`;
        // Cache for 10 seconds
        cache.set(cacheKey, output, 10000);
        return {
            content: [{
                    type: 'text',
                    text: output
                }]
        };
    }
}
//# sourceMappingURL=plugins.js.map