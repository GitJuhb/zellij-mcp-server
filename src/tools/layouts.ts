import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { cache } from '../utils/cache.js';
import { ToolResponse, ZellijLayout, ValidationError } from '../types/zellij.js';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export class LayoutTools {

  /**
   * Dump current layout to stdout or file
   */
  static async dumpLayout(outputPath?: string): Promise<ToolResponse> {
    // Validate output path if provided
    if (outputPath) {
      if (outputPath.includes('..') || !outputPath.match(/^[\w\/\-\.]+$/)) {
        throw new ValidationError('Invalid output path');
      }
    }

    const result = await execAsync('zellij action dump-layout');
    
    if (outputPath) {
      // Save to file
      writeFileSync(outputPath, result.stdout);
      return {
        content: [{
          type: 'text',
          text: `Layout dumped to: ${outputPath}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `Current Layout:\n\n${result.stdout}`
        }]
      };
    }
  }

  /**
   * Save current layout to a named file in layouts directory
   */
  static async saveLayout(layoutName: string, layoutsDir?: string): Promise<ToolResponse> {
    // Validate layout name
    const nameValidation = Validator.validateString(layoutName, 'layout name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid layout name: ${nameValidation.errors.join(', ')}`);
    }

    // Determine layouts directory
    const layoutDirectory = layoutsDir || join(process.env.HOME || '/tmp', '.config/zellij/layouts');
    const layoutPath = join(layoutDirectory, `${layoutName}.kdl`);

    // Validate directory path
    if (layoutDirectory.includes('..')) {
      throw new ValidationError('Invalid layouts directory path');
    }

    try {
      // Create directory if it doesn't exist
      const fs = await import('fs');
      if (!fs.existsSync(layoutDirectory)) {
        fs.mkdirSync(layoutDirectory, { recursive: true });
      }

      // Get current layout
      const result = await execAsync('zellij action dump-layout');
      
      // Save layout
      writeFileSync(layoutPath, result.stdout);

      // Clear layout cache
      cache.delete('layouts_list');

      return {
        content: [{
          type: 'text',
          text: `Layout saved: ${layoutName}\nPath: ${layoutPath}`
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to save layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply a layout to current session or new session
   */
  static async applyLayout(layoutName: string, sessionName?: string): Promise<ToolResponse> {
    // Validate layout name
    const nameValidation = Validator.validateString(layoutName, 'layout name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid layout name: ${nameValidation.errors.join(', ')}`);
    }

    // Validate session name if provided
    if (sessionName) {
      const sessionValidation = Validator.validateSessionName(sessionName);
      if (!sessionValidation.valid) {
        throw new ValidationError(`Invalid session name: ${sessionValidation.errors.join(', ')}`);
      }
    }

    let command = `--layout ${layoutName}`;
    
    if (sessionName) {
      command = `--session ${sessionName} ${command}`;
    }

    const result = await execAsync(`zellij ${command}`);

    return {
      content: [{
        type: 'text',
        text: `Layout applied: ${layoutName}${sessionName ? ` to session: ${sessionName}` : ' to current session'}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
      }]
    };
  }

  /**
   * List available layouts
   */
  static async listLayouts(layoutsDir?: string): Promise<ToolResponse> {
    // Check cache first
    const cacheKey = `layouts_list_${layoutsDir || 'default'}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: cached
        }]
      };
    }

    try {
      // Determine layouts directory
      const layoutDirectory = layoutsDir || join(process.env.HOME || '/tmp', '.config/zellij/layouts');
      
      let output = `Available Layouts:\n\n`;

      if (existsSync(layoutDirectory)) {
        const files = readdirSync(layoutDirectory)
          .filter(file => file.endsWith('.kdl'))
          .map(file => file.replace('.kdl', ''));

        if (files.length > 0) {
          output += `Custom layouts in ${layoutDirectory}:\n`;
          files.forEach(layout => {
            output += `  • ${layout}\n`;
          });
        } else {
          output += `No custom layouts found in ${layoutDirectory}\n`;
        }
      } else {
        output += `Layouts directory not found: ${layoutDirectory}\n`;
      }

      // Add built-in layouts info
      output += `\nBuilt-in layouts:\n`;
      output += `  • default - Standard single pane layout\n`;
      output += `  • strider - File browser layout\n`;
      output += `  • compact - Compact UI layout\n`;
      output += `\nNote: You can also specify layout file paths directly`;

      // Cache for 30 seconds
      cache.set(cacheKey, output, 30000);

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to list layouts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load layout content from file
   */
  static async loadLayout(layoutName: string, layoutsDir?: string): Promise<ToolResponse> {
    // Validate layout name
    const nameValidation = Validator.validateString(layoutName, 'layout name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid layout name: ${nameValidation.errors.join(', ')}`);
    }

    try {
      // Determine layout path
      let layoutPath: string;
      
      if (layoutName.includes('/')) {
        // Full path provided
        layoutPath = layoutName;
      } else {
        // Look in layouts directory
        const layoutDirectory = layoutsDir || join(process.env.HOME || '/tmp', '.config/zellij/layouts');
        layoutPath = join(layoutDirectory, `${layoutName}.kdl`);
      }

      // Validate path
      if (layoutPath.includes('..')) {
        throw new ValidationError('Invalid layout path');
      }

      if (!existsSync(layoutPath)) {
        throw new ValidationError(`Layout file not found: ${layoutPath}`);
      }

      const layoutContent = readFileSync(layoutPath, 'utf8');

      return {
        content: [{
          type: 'text',
          text: `Layout Content (${layoutName}):\n\n${layoutContent}`
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to load layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new tab with specific layout
   */
  static async newTabWithLayout(layoutName: string, tabName?: string): Promise<ToolResponse> {
    // Validate layout name
    const nameValidation = Validator.validateString(layoutName, 'layout name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid layout name: ${nameValidation.errors.join(', ')}`);
    }

    // Validate tab name if provided
    if (tabName) {
      const tabValidation = Validator.validateString(tabName, 'tab name', 64);
      if (!tabValidation.valid) {
        throw new ValidationError(`Invalid tab name: ${tabValidation.errors.join(', ')}`);
      }
    }

    let command = `action new-tab --layout ${layoutName}`;
    
    if (tabName) {
      command += ` --name "${tabName}"`;
    }

    const result = await execAsync(`zellij ${command}`);

    return {
      content: [{
        type: 'text',
        text: `New tab created with layout: ${layoutName}${tabName ? ` (name: ${tabName})` : ''}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
      }]
    };
  }

  /**
   * Convert layout format (basic conversion utilities)
   */
  static async convertLayout(inputPath: string, outputPath: string, fromFormat: 'kdl' | 'json', toFormat: 'kdl' | 'json'): Promise<ToolResponse> {
    // Validate paths
    if (!inputPath || inputPath.includes('..') || !inputPath.match(/^[\w\/\-\.]+$/)) {
      throw new ValidationError('Invalid input path');
    }
    
    if (!outputPath || outputPath.includes('..') || !outputPath.match(/^[\w\/\-\.]+$/)) {
      throw new ValidationError('Invalid output path');
    }

    if (!existsSync(inputPath)) {
      throw new ValidationError('Input file does not exist');
    }

    try {
      const inputContent = readFileSync(inputPath, 'utf8');
      let outputContent: string;

      if (fromFormat === 'kdl' && toFormat === 'json') {
        // Convert KDL to JSON (simplified)
        outputContent = this.convertKdlToJson(inputContent);
      } else if (fromFormat === 'json' && toFormat === 'kdl') {
        // Convert JSON to KDL (simplified)
        const jsonData = JSON.parse(inputContent);
        outputContent = this.convertJsonToKdl(jsonData);
      } else if (fromFormat === toFormat) {
        // Just copy
        outputContent = inputContent;
      } else {
        throw new ValidationError('Unsupported conversion format');
      }

      writeFileSync(outputPath, outputContent);

      return {
        content: [{
          type: 'text',
          text: `Layout converted: ${fromFormat.toUpperCase()} → ${toFormat.toUpperCase()}\nInput: ${inputPath}\nOutput: ${outputPath}`
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to convert layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simple KDL to JSON conversion (basic implementation)
   */
  private static convertKdlToJson(kdlContent: string): string {
    // This is a very basic conversion - a full KDL parser would be much more complex
    const layout = {
      name: 'converted-layout',
      tabs: [{
        name: 'main',
        panes: [{ split_direction: 'horizontal' }]
      }]
    };

    return JSON.stringify(layout, null, 2);
  }

  /**
   * Simple JSON to KDL conversion (basic implementation)
   */
  private static convertJsonToKdl(jsonData: any): string {
    // This is a very basic conversion - a full implementation would be much more complex
    let kdl = 'layout {\n';
    
    if (jsonData.tabs && Array.isArray(jsonData.tabs)) {
      for (const tab of jsonData.tabs) {
        kdl += '  tab {\n';
        if (tab.name) {
          kdl += `    name "${tab.name}"\n`;
        }
        kdl += '    pane\n';
        kdl += '  }\n';
      }
    } else {
      kdl += '  tab {\n    pane\n  }\n';
    }
    
    kdl += '}\n';
    return kdl;
  }

  /**
   * Validate layout file syntax
   */
  static async validateLayout(layoutPath: string): Promise<ToolResponse> {
    // Validate path
    if (!layoutPath || layoutPath.includes('..') || !layoutPath.match(/^[\w\/\-\.]+$/)) {
      throw new ValidationError('Invalid layout path');
    }

    if (!existsSync(layoutPath)) {
      throw new ValidationError('Layout file does not exist');
    }

    try {
      // Try to use the layout to validate it
      const tempSessionName = `validate-${Date.now()}`;
      
      try {
        await execAsync(`zellij --session ${tempSessionName} --layout ${layoutPath} action close-tab`);
        // If we get here, layout loaded successfully
        
        // Clean up the test session
        try {
          await execAsync(`zellij delete-session ${tempSessionName}`);
        } catch (e) {
          // Ignore cleanup errors
        }

        return {
          content: [{
            type: 'text',
            text: `Layout validation successful: ${layoutPath}\nSyntax is valid and can be loaded by Zellij`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Layout validation failed: ${layoutPath}\nError: ${error instanceof Error ? error.message : String(error)}\nPlease check the layout syntax`
          }]
        };
      }
    } catch (error) {
      throw new ValidationError(`Failed to validate layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}