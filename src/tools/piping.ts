import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { ToolResponse, PipeOptions, ValidationError } from '../types/zellij.js';

export class PipingTools {
  
  /**
   * Send data to one or more plugins via pipe
   */
  static async pipe(payload: string, options: PipeOptions = {}): Promise<ToolResponse> {
    // Validate payload
    const textValidation = Validator.validateText(payload);
    if (!textValidation.valid) {
      throw new ValidationError(`Invalid payload: ${textValidation.errors.join(', ')}`);
    }

    // Validate plugin URL if provided
    if (options.plugin) {
      const urlValidation = Validator.validatePluginUrl(options.plugin);
      if (!urlValidation.valid) {
        throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
      }
    }

    // Validate pipe name if provided
    if (options.name) {
      const nameValidation = Validator.validateString(options.name, 'pipe name', 64);
      if (!nameValidation.valid) {
        throw new ValidationError(`Invalid pipe name: ${nameValidation.errors.join(', ')}`);
      }
    }

    // Build command
    let command = 'pipe';
    
    if (options.name) {
      command += ` --name "${options.name}"`;
    }
    
    if (options.plugin) {
      command += ` --plugin "${options.plugin}"`;
    }
    
    if (options.args) {
      const argsValidation = Validator.validateString(options.args, 'pipe args', 256);
      if (!argsValidation.valid) {
        throw new ValidationError(`Invalid pipe args: ${argsValidation.errors.join(', ')}`);
      }
      command += ` --args "${options.args}"`;
    }
    
    if (options.configuration) {
      try {
        const configJson = JSON.stringify(options.configuration);
        command += ` --plugin-configuration '${configJson}'`;
      } catch (e) {
        throw new ValidationError('Invalid plugin configuration: must be valid JSON');
      }
    }

    command += ` -- "${payload}"`;

    const result = await execAsync(`zellij ${command}`);
    
    return {
      content: [{
        type: 'text',
        text: `Piped data successfully${options.name ? ` to pipe: ${options.name}` : ''}${options.plugin ? ` (plugin: ${options.plugin})` : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
      }]
    };
  }

  /**
   * Send data to a specific plugin
   */
  static async pipeToPlugin(payload: string, pluginUrl: string, pipeName?: string, configuration?: Record<string, any>): Promise<ToolResponse> {
    return this.pipe(payload, {
      plugin: pluginUrl,
      name: pipeName,
      configuration
    });
  }

  /**
   * Broadcast data to all listening plugins
   */
  static async pipeBroadcast(payload: string, pipeName: string): Promise<ToolResponse> {
    return this.pipe(payload, { name: pipeName });
  }

  /**
   * Send data with advanced action pipe options
   */
  static async actionPipe(payload: string, options: PipeOptions = {}): Promise<ToolResponse> {
    // Validate payload
    const textValidation = Validator.validateText(payload);
    if (!textValidation.valid) {
      throw new ValidationError(`Invalid payload: ${textValidation.errors.join(', ')}`);
    }

    // Validate plugin URL if provided
    if (options.plugin) {
      const urlValidation = Validator.validatePluginUrl(options.plugin);
      if (!urlValidation.valid) {
        throw new ValidationError(`Invalid plugin URL: ${urlValidation.errors.join(', ')}`);
      }
    }

    // Build action pipe command
    let command = 'action pipe';
    
    if (options.name) {
      const nameValidation = Validator.validateString(options.name, 'pipe name', 64);
      if (!nameValidation.valid) {
        throw new ValidationError(`Invalid pipe name: ${nameValidation.errors.join(', ')}`);
      }
      command += ` --name "${options.name}"`;
    }
    
    if (options.plugin) {
      command += ` --plugin "${options.plugin}"`;
    }
    
    if (options.args) {
      const argsValidation = Validator.validateString(options.args, 'pipe args', 256);
      if (!argsValidation.valid) {
        throw new ValidationError(`Invalid pipe args: ${argsValidation.errors.join(', ')}`);
      }
      command += ` --args "${options.args}"`;
    }
    
    if (options.configuration) {
      try {
        const configJson = JSON.stringify(options.configuration);
        command += ` --plugin-configuration '${configJson}'`;
      } catch (e) {
        throw new ValidationError('Invalid plugin configuration: must be valid JSON');
      }
    }
    
    if (options.forceLaunch) {
      command += ' --force-launch-plugin';
    }
    
    if (options.skipCache) {
      command += ' --skip-plugin-cache';
    }
    
    if (options.floating !== undefined) {
      command += ` --floating-plugin ${options.floating}`;
    }
    
    if (options.inPlace !== undefined) {
      command += ` --in-place-plugin ${options.inPlace}`;
    }
    
    if (options.cwd) {
      const cwdValidation = Validator.validateString(options.cwd, 'working directory', 512);
      if (!cwdValidation.valid) {
        throw new ValidationError(`Invalid working directory: ${cwdValidation.errors.join(', ')}`);
      }
      command += ` --plugin-cwd "${options.cwd}"`;
    }
    
    if (options.title) {
      const titleValidation = Validator.validateString(options.title, 'plugin title', 128);
      if (!titleValidation.valid) {
        throw new ValidationError(`Invalid plugin title: ${titleValidation.errors.join(', ')}`);
      }
      command += ` --plugin-title "${options.title}"`;
    }

    command += ` -- "${payload}"`;

    const result = await execAsync(`zellij ${command}`);
    
    return {
      content: [{
        type: 'text',
        text: `Action pipe executed successfully${options.name ? ` for pipe: ${options.name}` : ''}${options.plugin ? ` (plugin: ${options.plugin})` : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
      }]
    };
  }

  /**
   * Pipe with response capture (using STDIN/STDOUT)
   */
  static async pipeWithResponse(payload: string, options: PipeOptions = {}): Promise<ToolResponse> {
    // This would typically involve piping data and capturing the response
    // For now, we'll use the regular pipe and return any stdout
    const result = await this.pipe(payload, options);
    
    // Add note that this captures response
    const responseText = result.content[0].text + '\n(Response captured from plugin output)';
    
    return {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
  }

  /**
   * Pipe data from a file
   */
  static async pipeFromFile(filePath: string, options: PipeOptions = {}): Promise<ToolResponse> {
    // Validate file path
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path is required');
    }
    
    // Prevent directory traversal and ensure reasonable path
    if (filePath.includes('..') || !filePath.match(/^[\/\w\-\.]+$/)) {
      throw new ValidationError('Invalid file path');
    }

    let command = `cat "${filePath}" | zellij pipe`;
    
    if (options.name) {
      command += ` --name "${options.name}"`;
    }
    
    if (options.plugin) {
      command += ` --plugin "${options.plugin}"`;
    }

    const result = await execAsync(command);
    
    return {
      content: [{
        type: 'text',
        text: `Piped file content from ${filePath} successfully${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
      }]
    };
  }
}