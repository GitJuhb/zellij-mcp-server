import { ValidationError, SecurityError, ValidationResult } from '../types/zellij.js';

export class Validator {
  // Session name validation
  static validateSessionName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Session name is required and must be a string');
    } else {
      // Check for dangerous characters
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        errors.push('Session name can only contain alphanumeric characters, underscores, and hyphens');
      }
      
      if (name.length > 64) {
        errors.push('Session name must be 64 characters or less');
      }
      
      if (name.length < 1) {
        errors.push('Session name cannot be empty');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: name?.trim()
    };
  }
  
  // Command validation to prevent injection
  static validateCommand(command: string): ValidationResult {
    const errors: string[] = [];
    
    if (!command || typeof command !== 'string') {
      errors.push('Command is required and must be a string');
    } else {
      // Check for dangerous patterns
      const dangerousPatterns = [
        /[;&|`$(){}[\]]/,  // Command separators and expansions
        /\.\./,            // Directory traversal
        /rm\s+-rf/,        // Dangerous rm commands
        /sudo/,            // Privilege escalation
        /curl.*\|.*sh/,    // Pipe to shell
        /wget.*\|.*sh/,    // Pipe to shell
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
          errors.push(`Command contains potentially dangerous pattern: ${pattern.source}`);
        }
      }
      
      if (command.length > 1000) {
        errors.push('Command is too long (max 1000 characters)');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: command?.trim()
    };
  }
  
  // Plugin URL validation
  static validatePluginUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (!url || typeof url !== 'string') {
      errors.push('Plugin URL is required and must be a string');
    } else {
      // Allow file:, http:, https:, and zellij: protocols
      const validProtocols = /^(file:|https?:|zellij:)/;
      
      if (!validProtocols.test(url)) {
        errors.push('Plugin URL must use file:, http:, https:, or zellij: protocol');
      }
      
      // Prevent local file system access outside of reasonable paths
      if (url.startsWith('file:')) {
        if (url.includes('..')) {
          errors.push('Plugin file path cannot contain directory traversal (..)');
        }
        
        if (!url.match(/file:\/\/(\/tmp\/|\/home\/|\/usr\/share\/|\.\/)/)) {
          errors.push('Plugin file path must be in allowed directories (/tmp, /home, /usr/share, or relative)');
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: url?.trim()
    };
  }
  
  // Direction validation
  static validateDirection(direction: string): ValidationResult {
    const errors: string[] = [];
    const validDirections = ['left', 'right', 'up', 'down', 'next', 'previous'];
    
    if (!direction || typeof direction !== 'string') {
      errors.push('Direction is required and must be a string');
    } else if (!validDirections.includes(direction.toLowerCase())) {
      errors.push(`Direction must be one of: ${validDirections.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: direction?.toLowerCase()
    };
  }
  
  // Split direction validation
  static validateSplitDirection(direction: string): ValidationResult {
    const errors: string[] = [];
    const validDirections = ['right', 'down'];
    
    if (!direction || typeof direction !== 'string') {
      errors.push('Split direction is required and must be a string');
    } else if (!validDirections.includes(direction.toLowerCase())) {
      errors.push(`Split direction must be one of: ${validDirections.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: direction?.toLowerCase()
    };
  }
  
  // Resize amount validation
  static validateResizeAmount(amount: string): ValidationResult {
    const errors: string[] = [];
    const validAmounts = ['increase', 'decrease'];
    
    if (!amount || typeof amount !== 'string') {
      errors.push('Resize amount is required and must be a string');
    } else if (!validAmounts.includes(amount.toLowerCase())) {
      errors.push(`Resize amount must be one of: ${validAmounts.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: amount?.toLowerCase()
    };
  }
  
  // Text content validation (for writing to panes)
  static validateText(text: string): ValidationResult {
    const errors: string[] = [];
    
    if (!text || typeof text !== 'string') {
      errors.push('Text is required and must be a string');
    } else {
      if (text.length > 10000) {
        errors.push('Text is too long (max 10000 characters)');
      }
      
      // Check for potentially dangerous escape sequences
      if (/\x1b\[[0-9;]*[mGKH]/.test(text)) {
        errors.push('Text contains ANSI escape sequences which may be dangerous');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: text
    };
  }
  
  // Generic string validation
  static validateString(value: string, fieldName: string, maxLength = 256): ValidationResult {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'string') {
      errors.push(`${fieldName} is required and must be a string`);
    } else {
      if (value.length > maxLength) {
        errors.push(`${fieldName} is too long (max ${maxLength} characters)`);
      }
      
      if (value.trim().length === 0) {
        errors.push(`${fieldName} cannot be empty`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: value?.trim()
    };
  }
  
  // Rate limiting helper
  private static commandCounts = new Map<string, { count: number; resetTime: number }>();
  
  static checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const existing = this.commandCounts.get(identifier);
    
    if (!existing || now > existing.resetTime) {
      this.commandCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (existing.count >= maxRequests) {
      return false;
    }
    
    existing.count++;
    return true;
  }
}