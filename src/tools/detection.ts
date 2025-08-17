import { execAsync } from '../utils/command.js';
import { Validator } from '../utils/validator.js';
import { cache } from '../utils/cache.js';
import { ToolResponse, ValidationError } from '../types/zellij.js';
import { writeFileSync, readFileSync, existsSync, unlinkSync, watchFile, unwatchFile } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class DetectionTools {
  private static watchers = new Map<string, any>();
  private static processes = new Map<string, ChildProcess>();

  /**
   * Watch a pipe for specific patterns or EOF with timeout
   */
  static async watchPipe(
    pipePath: string, 
    patterns?: string[], 
    timeoutMs: number = 30000
  ): Promise<ToolResponse> {
    // Validate pipe path
    if (!pipePath || pipePath.includes('..') || !pipePath.match(/^[/\w\-\.]+$/)) {
      throw new ValidationError('Invalid pipe path');
    }

    // Validate timeout
    if (timeoutMs < 100 || timeoutMs > 300000) {
      throw new ValidationError('Timeout must be between 100ms and 300000ms (5 minutes)');
    }

    // Validate patterns
    const validatedPatterns: string[] = [];
    if (patterns) {
      for (const pattern of patterns) {
        const patternValidation = Validator.validateString(pattern, 'pattern', 256);
        if (!patternValidation.valid) {
          throw new ValidationError(`Invalid pattern: ${patternValidation.errors.join(', ')}`);
        }
        validatedPatterns.push(patternValidation.sanitized!);
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          content: [{
            type: 'text',
            text: `Pipe watch timeout after ${timeoutMs}ms. No matching patterns found.`
          }]
        });
      }, timeoutMs);

      let buffer = '';
      let found = false;

      const cleanup = () => {
        clearTimeout(timeout);
        if (this.watchers.has(pipePath)) {
          unwatchFile(pipePath);
          this.watchers.delete(pipePath);
        }
      };

      try {
        // Check if pipe exists
        if (!existsSync(pipePath)) {
          cleanup();
          reject(new ValidationError(`Pipe does not exist: ${pipePath}`));
          return;
        }

        const stream = createReadStream(pipePath);
        
        stream.on('data', (chunk: string | Buffer) => {
          buffer += chunk.toString();
          
          // Check for patterns
          if (validatedPatterns.length > 0) {
            for (const pattern of validatedPatterns) {
              if (buffer.includes(pattern)) {
                found = true;
                cleanup();
                resolve({
                  content: [{
                    type: 'text',
                    text: `Pattern found: "${pattern}" in pipe ${pipePath}`
                  }]
                });
                return;
              }
            }
          }
        });

        stream.on('end', () => {
          cleanup();
          resolve({
            content: [{
              type: 'text',
              text: found 
                ? `EOF reached on pipe ${pipePath} with pattern match`
                : `EOF reached on pipe ${pipePath}. No patterns specified or found.`
            }]
          });
        });

        stream.on('error', (error) => {
          cleanup();
          reject(new ValidationError(`Error reading pipe: ${error.message}`));
        });

      } catch (error) {
        cleanup();
        reject(new ValidationError(`Failed to watch pipe: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }

  /**
   * Create a named pipe for bidirectional communication
   */
  static async createNamedPipe(pipeName: string, mode: string = '0666'): Promise<ToolResponse> {
    // Validate pipe name
    const nameValidation = Validator.validateString(pipeName, 'pipe name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid pipe name: ${nameValidation.errors.join(', ')}`);
    }

    // Validate mode
    if (!mode.match(/^0[0-7]{3}$/)) {
      throw new ValidationError('Mode must be in octal format (e.g., "0666")');
    }

    const pipePath = `/tmp/zellij-pipe-${nameValidation.sanitized}`;
    
    try {
      const result = await execAsync(`mkfifo -m ${mode} "${pipePath}"`);
      
      return {
        content: [{
          type: 'text',
          text: `Named pipe created: ${pipePath} with mode ${mode}${result.stdout ? `\nOutput: ${result.stdout}` : ''}`
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to create named pipe: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pipe command output with automatic timeout completion
   */
  static async pipeWithTimeout(
    command: string,
    targetPipe: string,
    timeoutMs: number = 30000
  ): Promise<ToolResponse> {
    // Validate command
    const cmdValidation = Validator.validateCommand(command);
    if (!cmdValidation.valid) {
      throw new ValidationError(`Invalid command: ${cmdValidation.errors.join(', ')}`);
    }

    // Validate pipe path
    if (!targetPipe || targetPipe.includes('..') || !targetPipe.match(/^[/\w\-\.]+$/)) {
      throw new ValidationError('Invalid target pipe path');
    }

    // Validate timeout
    if (timeoutMs < 1000 || timeoutMs > 600000) {
      throw new ValidationError('Timeout must be between 1000ms and 600000ms (10 minutes)');
    }

    return new Promise((resolve, reject) => {
      const processId = `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let completed = false;

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          // Kill process if still running
          if (this.processes.has(processId)) {
            const proc = this.processes.get(processId)!;
            proc.kill('SIGTERM');
            this.processes.delete(processId);
          }
          resolve({
            content: [{
              type: 'text',
              text: `Command piped with timeout completion after ${timeoutMs}ms: ${cmdValidation.sanitized}`
            }]
          });
        }
      }, timeoutMs);

      try {
        // Execute command and pipe to target
        const proc = spawn('bash', ['-c', `${cmdValidation.sanitized} > "${targetPipe}"`], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        this.processes.set(processId, proc);

        proc.on('exit', (code) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            this.processes.delete(processId);
            
            resolve({
              content: [{
                type: 'text',
                text: `Command completed with exit code ${code}: ${cmdValidation.sanitized}`
              }]
            });
          }
        });

        proc.on('error', (error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            this.processes.delete(processId);
            reject(new ValidationError(`Command error: ${error.message}`));
          }
        });

      } catch (error) {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          reject(new ValidationError(`Failed to execute piped command: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
    });
  }

  /**
   * Poll process status by PID
   */
  static async pollProcess(pid: string | number, intervalMs: number = 1000): Promise<ToolResponse> {
    // Validate PID
    const pidNum = typeof pid === 'string' ? parseInt(pid) : pid;
    if (isNaN(pidNum) || pidNum <= 0 || pidNum > 4194304) {
      throw new ValidationError('Invalid PID: must be a positive integer');
    }

    // Validate interval
    if (intervalMs < 100 || intervalMs > 10000) {
      throw new ValidationError('Interval must be between 100ms and 10000ms');
    }

    try {
      // Check if process exists
      const result = await execAsync(`ps -p ${pidNum} -o pid,ppid,state,comm --no-headers`);
      
      if (result.stdout.trim()) {
        const [pid, ppid, state, comm] = result.stdout.trim().split(/\s+/);
        
        return {
          content: [{
            type: 'text',
            text: `Process ${pidNum} status:\nPID: ${pid}\nPPID: ${ppid}\nState: ${state}\nCommand: ${comm}`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `Process ${pidNum} not found or has exited`
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Process ${pidNum} not found or error checking status: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Watch file for changes with inotify-like functionality
   */
  static async watchFile(
    filePath: string, 
    patterns?: string[], 
    timeoutMs: number = 30000
  ): Promise<ToolResponse> {
    // Validate file path
    if (!filePath || filePath.includes('..') || !filePath.match(/^[/\w\-\.]+$/)) {
      throw new ValidationError('Invalid file path');
    }

    // Validate timeout
    if (timeoutMs < 100 || timeoutMs > 300000) {
      throw new ValidationError('Timeout must be between 100ms and 300000ms (5 minutes)');
    }

    // Validate patterns
    const validatedPatterns: string[] = [];
    if (patterns) {
      for (const pattern of patterns) {
        const patternValidation = Validator.validateString(pattern, 'pattern', 256);
        if (!patternValidation.valid) {
          throw new ValidationError(`Invalid pattern: ${patternValidation.errors.join(', ')}`);
        }
        validatedPatterns.push(patternValidation.sanitized!);
      }
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          content: [{
            type: 'text',
            text: `File watch timeout after ${timeoutMs}ms: ${filePath}`
          }]
        });
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        if (this.watchers.has(filePath)) {
          unwatchFile(filePath);
          this.watchers.delete(filePath);
        }
      };

      const checkFile = () => {
        try {
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            
            // Check for patterns if specified
            if (validatedPatterns.length > 0) {
              for (const pattern of validatedPatterns) {
                if (content.includes(pattern)) {
                  cleanup();
                  resolve({
                    content: [{
                      type: 'text',
                      text: `Pattern "${pattern}" found in file: ${filePath}`
                    }]
                  });
                  return;
                }
              }
            } else {
              // Just report file existence/creation
              cleanup();
              resolve({
                content: [{
                  type: 'text',
                  text: `File detected: ${filePath}`
                }]
              });
            }
          }
        } catch (error) {
          // File might not exist yet or be readable, continue watching
        }
      };

      // Check immediately
      checkFile();

      // Watch for file changes
      watchFile(filePath, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          checkFile();
        }
      });

      this.watchers.set(filePath, true);
    });
  }

  /**
   * Create LLM completion detector wrapper
   */
  static async createLLMWrapper(
    wrapperName: string,
    llmCommand: string,
    detectMarker: string = '<<<LLM_COMPLETE>>>',
    timeoutMs: number = 60000
  ): Promise<ToolResponse> {
    // Validate wrapper name
    const nameValidation = Validator.validateString(wrapperName, 'wrapper name', 32);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid wrapper name: ${nameValidation.errors.join(', ')}`);
    }

    // Validate LLM command
    const cmdValidation = Validator.validateCommand(llmCommand);
    if (!cmdValidation.valid) {
      throw new ValidationError(`Invalid LLM command: ${cmdValidation.errors.join(', ')}`);
    }

    // Validate marker
    const markerValidation = Validator.validateString(detectMarker, 'detection marker', 64);
    if (!markerValidation.valid) {
      throw new ValidationError(`Invalid marker: ${markerValidation.errors.join(', ')}`);
    }

    const wrapperPath = `/tmp/llm-wrapper-${nameValidation.sanitized}.sh`;
    const statusPath = `/tmp/llm-status-${nameValidation.sanitized}`;

    const wrapperScript = `#!/bin/bash
# LLM Completion Detection Wrapper
# Generated by Zellij MCP Server

set -euo pipefail

WRAPPER_NAME="${nameValidation.sanitized}"
STATUS_FILE="${statusPath}"
OUTPUT_FILE="/tmp/llm-output-$WRAPPER_NAME-$$"
MARKER="${markerValidation.sanitized}"
TIMEOUT_MS="${timeoutMs}"
LLM_PID=""

# Cleanup function
cleanup() {
    if [[ -n "$LLM_PID" ]] && kill -0 "$LLM_PID" 2>/dev/null; then
        kill "$LLM_PID" 2>/dev/null || true
        wait "$LLM_PID" 2>/dev/null || true
    fi
    [[ -f "$OUTPUT_FILE" ]] && rm -f "$OUTPUT_FILE"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Initialize status
echo "running" > "$STATUS_FILE"
echo "$(date -Iseconds): Starting LLM query" >> "$STATUS_FILE"

# Start LLM process
{
    timeout $((TIMEOUT_MS / 1000))s ${cmdValidation.sanitized} "$@" || {
        EXIT_CODE=$?
        if [[ $EXIT_CODE -eq 124 ]]; then
            echo "timeout" >> "$STATUS_FILE"
            echo "$(date -Iseconds): LLM query timed out" >> "$STATUS_FILE"
        else
            echo "error:$EXIT_CODE" >> "$STATUS_FILE"
            echo "$(date -Iseconds): LLM query failed with code $EXIT_CODE" >> "$STATUS_FILE"
        fi
        exit $EXIT_CODE
    }
    echo "$MARKER:$?"
} | tee "$OUTPUT_FILE" &

LLM_PID=$!

# Wait for completion
wait "$LLM_PID"
LLM_EXIT_CODE=$?

# Update status
if [[ $LLM_EXIT_CODE -eq 0 ]]; then
    echo "complete:$LLM_EXIT_CODE" > "$STATUS_FILE"
    echo "$(date -Iseconds): LLM query completed successfully" >> "$STATUS_FILE"
else
    echo "error:$LLM_EXIT_CODE" > "$STATUS_FILE"
    echo "$(date -Iseconds): LLM query failed with code $LLM_EXIT_CODE" >> "$STATUS_FILE"
fi

# Output final result
cat "$OUTPUT_FILE"

exit $LLM_EXIT_CODE
`;

    try {
      writeFileSync(wrapperPath, wrapperScript, { mode: 0o755 });
      
      return {
        content: [{
          type: 'text',
          text: `LLM wrapper created: ${wrapperPath}
Status file: ${statusPath}
Detection marker: ${markerValidation.sanitized}
Timeout: ${timeoutMs}ms

Usage: ${wrapperPath} [your-llm-args...]

The wrapper provides:
- Multi-signal completion detection (exit code + marker + status file)
- Automatic timeout handling
- Process monitoring and cleanup
- Timestamped status logging`
        }]
      };
    } catch (error) {
      throw new ValidationError(`Failed to create wrapper script: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up detection resources
   */
  static async cleanupDetection(): Promise<ToolResponse> {
    let cleaned = 0;
    
    // Stop all watchers
    for (const [path] of this.watchers) {
      unwatchFile(path);
      cleaned++;
    }
    this.watchers.clear();

    // Kill remaining processes
    for (const [id, proc] of this.processes) {
      try {
        proc.kill('SIGTERM');
        cleaned++;
      } catch (error) {
        // Process might already be dead
      }
    }
    this.processes.clear();

    // Clean up temporary files
    try {
      await execAsync('find /tmp -name "llm-wrapper-*" -o -name "llm-status-*" -o -name "llm-output-*" -o -name "zellij-pipe-*" -mtime +1 -delete 2>/dev/null || true');
    } catch (error) {
      // Ignore cleanup errors
    }

    return {
      content: [{
        type: 'text',
        text: `Detection cleanup completed. Stopped ${cleaned} watchers/processes and cleaned temporary files.`
      }]
    };
  }
}