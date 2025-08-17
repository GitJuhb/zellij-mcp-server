import { exec } from 'child_process';
import { promisify } from 'util';
import { ZellijError } from '../types/zellij.js';
const execPromise = promisify(exec);
export async function execAsync(command, options) {
    try {
        const result = await execPromise(command, {
            timeout: options?.timeout || 30000, // 30 second default timeout
            cwd: options?.cwd,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });
        if (result.stderr) {
            console.warn('Command stderr:', result.stderr);
        }
        return {
            stdout: result.stdout.trim(),
            stderr: result.stderr.trim()
        };
    }
    catch (error) {
        throw new ZellijError(`Command execution failed: ${error.message}`, error.code);
    }
}
//# sourceMappingURL=command.js.map