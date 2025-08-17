# Zellij MCP Server

A comprehensive Model Context Protocol (MCP) server for managing Zellij terminal workspace sessions. This server provides extensive tools for session management, pane operations, tab controls, plugin integration, layout management, and advanced LLM completion detection.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Zellij](https://img.shields.io/badge/Zellij-Required-orange.svg)

## Features

### 🏗️ Session Management
Complete session lifecycle management with advanced operations:
- **Basic Operations**: List, create, attach, kill, delete sessions
- **Advanced Operations**: Clone, rename, switch, export/import session configurations
- **Session Information**: Detailed session info and health monitoring

### 🔧 Pane Management
Comprehensive pane control with advanced positioning:
- **Basic Operations**: Create, close, focus, resize, swap panes
- **Advanced Features**: Stack panes, floating pane controls, fullscreen toggle
- **Content Operations**: Clear, dump screen, edit scrollback, scroll controls
- **Positioning**: Precise floating coordinate control

### 📑 Tab Management
Full tab lifecycle with navigation and organization:
- **Tab Operations**: Create, close, rename, move tabs
- **Navigation**: Go to tab by index/name, next/previous navigation
- **Advanced Features**: Query tab names, synchronized input across panes

### 🔌 Plugin Management
Comprehensive plugin ecosystem integration:
- **Plugin Lifecycle**: Launch, focus, start/reload plugins
- **Advanced Options**: Floating, in-place, skip cache configurations
- **Plugin Information**: List aliases, running plugins, plugin info
- **Configuration**: Full plugin configuration support

### 📐 Layout Management
Complete layout system with validation:
- **Layout Operations**: Dump, save, apply, load layouts
- **Advanced Features**: New tab with layout, layout validation
- **Layout Discovery**: List available layouts with custom directory support

### 🔄 Piping System
Advanced inter-plugin communication:
- **Basic Piping**: Send data to plugins, broadcast to all plugins
- **Advanced Piping**: Response capture, file-based piping
- **Action Piping**: Force launch, skip cache, floating options
- **Plugin Targeting**: Specific plugin URL targeting

### 🤖 LLM Completion Detection
Specialized tools for LLM workflow integration:
- **Process Monitoring**: Watch pipes, poll processes, file watching
- **Timeout Management**: Automatic timeout completion
- **Wrapper Scripts**: LLM completion detector wrappers
- **Resource Cleanup**: Automated cleanup of detection resources

### 🛡️ Security & Performance
Enterprise-grade security and performance features:
- **Input Validation**: Comprehensive input sanitization and validation
- **Rate Limiting**: Configurable rate limiting per tool
- **Caching**: Intelligent caching with statistics
- **Health Monitoring**: System health checks and diagnostics

## Installation

### Prerequisites
- Node.js 18 or higher
- Zellij installed and available in PATH
- Active terminal environment

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/zellij-mcp-server.git
cd zellij-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Make the script executable
chmod +x dist/index.js
```

## Usage

### With Claude Desktop
Add this to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "zellij": {
      "command": "node",
      "args": ["/path/to/zellij-mcp-server/dist/index.js"]
    }
  }
}
```

### Direct Usage
```bash
# Start the MCP server
npm start

# Development mode with watching
npm run dev
```

## Tool Categories

### Session Management Tools

| Tool | Description |
|------|-------------|
| `zellij_list_sessions` | List all active Zellij sessions with caching |
| `zellij_new_session` | Create a new session with optional layout |
| `zellij_attach_session` | Attach to an existing session |
| `zellij_kill_session` | Kill a specific session |
| `zellij_delete_session` | Delete a specific session |
| `zellij_get_session_info` | Get detailed session information |
| `zellij_export_session` | Export session configuration to JSON |
| `zellij_import_session` | Import session from JSON export |
| `zellij_clone_session` | Clone an existing session |
| `zellij_rename_session` | Rename a session |
| `zellij_switch_session` | Switch to a different session |

### Pane Management Tools

| Tool | Description |
|------|-------------|
| `zellij_new_pane` | Create a new pane with advanced options |
| `zellij_close_pane` | Close the currently focused pane |
| `zellij_focus_pane` | Focus pane in specific direction |
| `zellij_resize_pane` | Resize the focused pane |
| `zellij_swap_panes` | Move/swap pane in specified direction |
| `zellij_stack_panes` | Stack multiple panes by their IDs |
| `zellij_toggle_floating` | Toggle floating panes visibility |
| `zellij_toggle_fullscreen` | Toggle fullscreen mode for focused pane |
| `zellij_pin_pane` | Pin/unpin floating pane |
| `zellij_clear_pane` | Clear the focused pane buffer |
| `zellij_dump_screen` | Dump pane screen content to file |
| `zellij_edit_scrollback` | Edit pane scrollback in default editor |
| `zellij_rename_pane` | Rename the focused pane |
| `zellij_scroll` | Scroll in focused pane |
| `zellij_exec_in_pane` | Execute command in current pane |
| `zellij_write_to_pane` | Write text to current pane |
| `zellij_get_pane_info` | Get current pane layout information |

### Tab Management Tools

| Tool | Description |
|------|-------------|
| `zellij_new_tab` | Create a new tab |
| `zellij_close_tab` | Close the current tab |
| `zellij_rename_tab` | Rename the current tab |
| `zellij_go_to_tab` | Go to tab by index |
| `zellij_go_to_tab_name` | Go to tab by name |
| `zellij_move_tab` | Move tab left or right |
| `zellij_query_tab_names` | Get all tab names in current session |
| `zellij_toggle_sync_tab` | Toggle synchronized input across panes |
| `zellij_go_to_next_tab` | Switch to next tab |
| `zellij_go_to_previous_tab` | Switch to previous tab |

### Plugin Management Tools

| Tool | Description |
|------|-------------|
| `zellij_launch_plugin` | Launch a plugin with full configuration |
| `zellij_action_launch_plugin` | Launch plugin using action command |
| `zellij_launch_or_focus_plugin` | Smart plugin activation |
| `zellij_start_or_reload_plugin` | Start or reload a plugin |
| `zellij_list_aliases` | List available plugin aliases |
| `zellij_get_plugin_info` | Get information about a plugin |
| `zellij_list_running_plugins` | List currently running plugins |

### Layout Management Tools

| Tool | Description |
|------|-------------|
| `zellij_dump_layout` | Dump current layout to stdout or file |
| `zellij_save_layout` | Save current layout to layouts directory |
| `zellij_apply_layout` | Apply a layout to current or new session |
| `zellij_list_layouts` | List available layouts |
| `zellij_load_layout` | Load and display layout content |
| `zellij_new_tab_with_layout` | Create new tab with specific layout |
| `zellij_validate_layout` | Validate layout file syntax |

### Piping System Tools

| Tool | Description |
|------|-------------|
| `zellij_pipe` | Send data to plugins via pipe with advanced options |
| `zellij_pipe_to_plugin` | Send data to a specific plugin |
| `zellij_pipe_broadcast` | Broadcast data to all listening plugins |
| `zellij_action_pipe` | Advanced piping with action-level options |
| `zellij_pipe_with_response` | Send data and capture plugin response |
| `zellij_pipe_from_file` | Pipe file content to plugins |

### LLM Detection Tools

| Tool | Description |
|------|-------------|
| `zellij_watch_pipe` | Watch a pipe for specific patterns with timeout |
| `zellij_create_named_pipe` | Create a named pipe for bidirectional communication |
| `zellij_pipe_with_timeout` | Pipe command output with automatic timeout |
| `zellij_poll_process` | Poll process status by PID |
| `zellij_watch_file` | Watch file for changes with pattern matching |
| `zellij_create_llm_wrapper` | Create LLM completion detector wrapper script |
| `zellij_cleanup_detection` | Clean up detection resources |

### System Tools

| Tool | Description |
|------|-------------|
| `zellij_run_command` | Run command in new pane |
| `zellij_edit_file` | Edit file in new Zellij pane |
| `zellij_switch_mode` | Switch input mode for all connected clients |
| `zellij_kill_all_sessions` | Kill all active sessions |
| `zellij_delete_all_sessions` | Delete all sessions |
| `zellij_clear_cache` | Clear MCP server cache |
| `zellij_get_cache_stats` | Get cache statistics |
| `zellij_health_check` | Perform system health check |

## Example Usage

### Creating a Development Session
```json
{
  "name": "zellij_new_session",
  "arguments": {
    "session_name": "development",
    "layout": "dev-layout"
  }
}
```

### Running Commands in Panes
```json
{
  "name": "zellij_run_command",
  "arguments": {
    "command": "npm run dev",
    "direction": "right"
  }
}
```

### Plugin Management
```json
{
  "name": "zellij_launch_plugin",
  "arguments": {
    "plugin_url": "file:~/.config/zellij/plugins/filepicker.wasm",
    "floating": true,
    "width": "50%",
    "height": "50%"
  }
}
```

### Layout Operations
```json
{
  "name": "zellij_save_layout",
  "arguments": {
    "layout_name": "my-dev-setup"
  }
}
```

### LLM Integration

#### Creating LLM Wrapper Scripts
The `zellij_create_llm_wrapper` tool generates intelligent wrapper scripts that provide robust completion detection for any LLM command:

```json
{
  "name": "zellij_create_llm_wrapper",
  "arguments": {
    "wrapper_name": "claude-wrapper",
    "llm_command": "claude chat",
    "detect_marker": "<<<COMPLETE>>>",
    "timeout_ms": 60000
  }
}
```

**What the wrapper provides:**
- **Multi-signal detection**: Exit codes, completion markers, and status files
- **Automatic timeout handling**: Configurable timeout with graceful cleanup
- **Process monitoring**: Real-time status tracking and logging
- **Signal handling**: Proper cleanup on interruption (SIGINT, SIGTERM)
- **Timestamped logging**: Detailed execution logs for debugging

**Generated files:**
- `/tmp/llm-wrapper-{name}.sh` - The executable wrapper script
- `/tmp/llm-status-{name}` - Real-time status file with timestamps
- `/tmp/llm-output-{name}-{pid}` - Captured output (temporary)

**Usage example:**
```bash
# After creating the wrapper, use it like:
/tmp/llm-wrapper-claude-wrapper.sh "Explain quantum computing"

# Monitor status in real-time:
tail -f /tmp/llm-status-claude-wrapper

# The wrapper handles timeouts, signals, and cleanup automatically
```

**Status tracking:**
- `running` - LLM query is in progress
- `complete:0` - Successfully completed
- `timeout` - Query timed out
- `error:N` - Failed with exit code N

## Architecture

### Security Features
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Per-tool rate limiting (50 requests per minute)
- **Path Traversal Protection**: File path validation prevents directory traversal
- **Command Injection Prevention**: Command sanitization and validation

### Performance Features
- **Intelligent Caching**: Session lists and other data are cached
- **Async Operations**: All operations are asynchronous
- **Error Handling**: Comprehensive error handling with specific error types
- **Resource Cleanup**: Automatic cleanup of temporary resources

### Error Handling
The server includes comprehensive error handling with specific error types:
- `ValidationError`: Input validation failures
- `SecurityError`: Security-related errors (rate limiting, etc.)
- `ZellijError`: Zellij-specific command failures

## Development

### Project Structure
```
src/
├── index.ts              # Main MCP server implementation
├── tools/               # Tool modules
│   ├── detection.ts     # LLM completion detection tools
│   ├── layouts.ts       # Layout management tools
│   ├── panes.ts         # Pane management tools
│   ├── piping.ts        # Piping system tools
│   ├── plugins.ts       # Plugin management tools
│   └── sessions.ts      # Session management tools
├── types/
│   └── zellij.ts        # TypeScript type definitions
└── utils/
    ├── cache.ts         # Caching utilities
    ├── command.ts       # Command execution utilities
    └── validator.ts     # Input validation utilities
```

### Building
```bash
# Development build with watching
npm run dev

# Production build
npm run build

# Start the built server
npm start
```

### Testing
Run `./test-workflow.sh` to validate the detection system functionality.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Zellij](https://zellij.dev/) - The amazing terminal workspace manager
- [Model Context Protocol](https://github.com/anthropics/mcp) - The protocol this server implements
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - Integration with Claude AI

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/zellij-mcp-server).