#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import our tool modules
import { PipingTools } from './tools/piping.js';
import { PluginTools } from './tools/plugins.js';
import { SessionTools } from './tools/sessions.js';
import { LayoutTools } from './tools/layouts.js';
import { PaneTools } from './tools/panes.js';
import { DetectionTools } from './tools/detection.js';

// Import utilities
import { Validator } from './utils/validator.js';
import { cache } from './utils/cache.js';
import { ValidationError, ZellijError, SecurityError } from './types/zellij.js';

class ZellijMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'zellij-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
    process.on('uncaughtException', (error) => {
      console.error('[Uncaught Exception]', error);
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('[Unhandled Rejection]', reason);
      process.exit(1);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Session Management Tools
        {
          name: 'zellij_list_sessions',
          description: 'List all active Zellij sessions with caching',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_attach_session',
          description: 'Attach to a specific Zellij session',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of the session to attach to' },
            },
            required: ['session_name'],
          },
        },
        {
          name: 'zellij_new_session',
          description: 'Create a new Zellij session with optional layout',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name for the new session' },
              layout: { type: 'string', description: 'Optional layout file or predefined layout name' },
            },
            required: ['session_name'],
          },
        },
        {
          name: 'zellij_kill_session',
          description: 'Kill a specific Zellij session',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of the session to kill' },
            },
            required: ['session_name'],
          },
        },
        {
          name: 'zellij_delete_session',
          description: 'Delete a specific Zellij session',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of the session to delete' },
            },
            required: ['session_name'],
          },
        },
        // Enhanced Session Tools
        {
          name: 'zellij_get_session_info',
          description: 'Get detailed information about a session',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of the session' },
            },
            required: ['session_name'],
          },
        },
        {
          name: 'zellij_export_session',
          description: 'Export session configuration to JSON',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of the session to export' },
              output_path: { type: 'string', description: 'Optional output file path' },
            },
            required: ['session_name'],
          },
        },
        {
          name: 'zellij_import_session',
          description: 'Import session from JSON export',
          inputSchema: {
            type: 'object',
            properties: {
              import_path: { type: 'string', description: 'Path to JSON export file' },
              new_session_name: { type: 'string', description: 'Optional new session name' },
            },
            required: ['import_path'],
          },
        },
        {
          name: 'zellij_clone_session',
          description: 'Clone an existing session',
          inputSchema: {
            type: 'object',
            properties: {
              source_session: { type: 'string', description: 'Name of source session' },
              new_session_name: { type: 'string', description: 'Name for cloned session' },
            },
            required: ['source_session', 'new_session_name'],
          },
        },
        {
          name: 'zellij_rename_session',
          description: 'Rename a session',
          inputSchema: {
            type: 'object',
            properties: {
              old_name: { type: 'string', description: 'Current session name' },
              new_name: { type: 'string', description: 'New session name' },
            },
            required: ['old_name', 'new_name'],
          },
        },
        {
          name: 'zellij_switch_session',
          description: 'Switch to a different session',
          inputSchema: {
            type: 'object',
            properties: {
              session_name: { type: 'string', description: 'Name of session to switch to' },
            },
            required: ['session_name'],
          },
        },

        // Piping Tools
        {
          name: 'zellij_pipe',
          description: 'Send data to plugins via pipe with advanced options',
          inputSchema: {
            type: 'object',
            properties: {
              payload: { type: 'string', description: 'Data to send through pipe' },
              pipe_name: { type: 'string', description: 'Name of the pipe' },
              plugin_url: { type: 'string', description: 'Optional specific plugin URL' },
              args: { type: 'string', description: 'Optional pipe arguments' },
              configuration: { type: 'object', description: 'Optional plugin configuration' },
            },
            required: ['payload'],
          },
        },
        {
          name: 'zellij_pipe_to_plugin',
          description: 'Send data to a specific plugin',
          inputSchema: {
            type: 'object',
            properties: {
              payload: { type: 'string', description: 'Data to send' },
              plugin_url: { type: 'string', description: 'Plugin URL' },
              pipe_name: { type: 'string', description: 'Optional pipe name' },
              configuration: { type: 'object', description: 'Optional plugin configuration' },
            },
            required: ['payload', 'plugin_url'],
          },
        },
        {
          name: 'zellij_pipe_broadcast',
          description: 'Broadcast data to all listening plugins',
          inputSchema: {
            type: 'object',
            properties: {
              payload: { type: 'string', description: 'Data to broadcast' },
              pipe_name: { type: 'string', description: 'Pipe name for broadcast' },
            },
            required: ['payload', 'pipe_name'],
          },
        },
        {
          name: 'zellij_action_pipe',
          description: 'Advanced piping with action-level options',
          inputSchema: {
            type: 'object',
            properties: {
              payload: { type: 'string', description: 'Data to send' },
              pipe_name: { type: 'string', description: 'Pipe name' },
              plugin_url: { type: 'string', description: 'Optional plugin URL' },
              force_launch: { type: 'boolean', description: 'Force launch plugin if not running' },
              skip_cache: { type: 'boolean', description: 'Skip plugin cache' },
              floating: { type: 'boolean', description: 'Launch as floating plugin' },
              in_place: { type: 'boolean', description: 'Launch in-place' },
              cwd: { type: 'string', description: 'Working directory for plugin' },
              title: { type: 'string', description: 'Plugin pane title' },
            },
            required: ['payload'],
          },
        },
        {
          name: 'zellij_pipe_with_response',
          description: 'Send data and capture plugin response',
          inputSchema: {
            type: 'object',
            properties: {
              payload: { type: 'string', description: 'Data to send' },
              pipe_name: { type: 'string', description: 'Pipe name' },
              plugin_url: { type: 'string', description: 'Optional plugin URL' },
            },
            required: ['payload'],
          },
        },
        {
          name: 'zellij_pipe_from_file',
          description: 'Pipe file content to plugins',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'Path to file to pipe' },
              pipe_name: { type: 'string', description: 'Pipe name' },
              plugin_url: { type: 'string', description: 'Optional plugin URL' },
            },
            required: ['file_path'],
          },
        },

        // Plugin Management Tools
        {
          name: 'zellij_launch_plugin',
          description: 'Launch a plugin with full configuration options',
          inputSchema: {
            type: 'object',
            properties: {
              plugin_url: { type: 'string', description: 'Plugin URL (file:, http:, https:, or zellij:)' },
              configuration: { type: 'object', description: 'Plugin configuration' },
              floating: { type: 'boolean', description: 'Launch as floating pane' },
              in_place: { type: 'boolean', description: 'Launch in-place (suspend current pane)' },
              skip_cache: { type: 'boolean', description: 'Skip plugin cache' },
              width: { type: 'string', description: 'Floating pane width (e.g. "50%", "100")' },
              height: { type: 'string', description: 'Floating pane height' },
              x: { type: 'string', description: 'Floating pane X position' },
              y: { type: 'string', description: 'Floating pane Y position' },
              pinned: { type: 'boolean', description: 'Pin floating pane on top' },
            },
            required: ['plugin_url'],
          },
        },
        {
          name: 'zellij_action_launch_plugin',
          description: 'Launch plugin using action command',
          inputSchema: {
            type: 'object',
            properties: {
              plugin_url: { type: 'string', description: 'Plugin URL' },
              configuration: { type: 'object', description: 'Plugin configuration' },
              floating: { type: 'boolean', description: 'Launch as floating' },
              in_place: { type: 'boolean', description: 'Launch in-place' },
              skip_cache: { type: 'boolean', description: 'Skip plugin cache' },
            },
            required: ['plugin_url'],
          },
        },
        {
          name: 'zellij_launch_or_focus_plugin',
          description: 'Smart plugin activation - launch or focus if already running',
          inputSchema: {
            type: 'object',
            properties: {
              plugin_url: { type: 'string', description: 'Plugin URL' },
              configuration: { type: 'object', description: 'Plugin configuration' },
            },
            required: ['plugin_url'],
          },
        },
        {
          name: 'zellij_start_or_reload_plugin',
          description: 'Start or reload a plugin',
          inputSchema: {
            type: 'object',
            properties: {
              plugin_url: { type: 'string', description: 'Plugin URL' },
              configuration: { type: 'object', description: 'Plugin configuration' },
            },
            required: ['plugin_url'],
          },
        },
        {
          name: 'zellij_list_aliases',
          description: 'List available plugin aliases',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_get_plugin_info',
          description: 'Get information about a plugin',
          inputSchema: {
            type: 'object',
            properties: {
              plugin_url: { type: 'string', description: 'Plugin URL' },
            },
            required: ['plugin_url'],
          },
        },
        {
          name: 'zellij_list_running_plugins',
          description: 'List currently running plugins',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },

        // Layout Management Tools
        {
          name: 'zellij_dump_layout',
          description: 'Dump current layout to stdout or file',
          inputSchema: {
            type: 'object',
            properties: {
              output_path: { type: 'string', description: 'Optional output file path' },
            },
          },
        },
        {
          name: 'zellij_save_layout',
          description: 'Save current layout to layouts directory',
          inputSchema: {
            type: 'object',
            properties: {
              layout_name: { type: 'string', description: 'Name for the saved layout' },
              layouts_dir: { type: 'string', description: 'Optional custom layouts directory' },
            },
            required: ['layout_name'],
          },
        },
        {
          name: 'zellij_apply_layout',
          description: 'Apply a layout to current or new session',
          inputSchema: {
            type: 'object',
            properties: {
              layout_name: { type: 'string', description: 'Name of layout to apply' },
              session_name: { type: 'string', description: 'Optional session name' },
            },
            required: ['layout_name'],
          },
        },
        {
          name: 'zellij_list_layouts',
          description: 'List available layouts',
          inputSchema: {
            type: 'object',
            properties: {
              layouts_dir: { type: 'string', description: 'Optional custom layouts directory' },
            },
          },
        },
        {
          name: 'zellij_load_layout',
          description: 'Load and display layout content',
          inputSchema: {
            type: 'object',
            properties: {
              layout_name: { type: 'string', description: 'Name of layout to load' },
              layouts_dir: { type: 'string', description: 'Optional custom layouts directory' },
            },
            required: ['layout_name'],
          },
        },
        {
          name: 'zellij_new_tab_with_layout',
          description: 'Create new tab with specific layout',
          inputSchema: {
            type: 'object',
            properties: {
              layout_name: { type: 'string', description: 'Layout to apply to new tab' },
              tab_name: { type: 'string', description: 'Optional name for new tab' },
            },
            required: ['layout_name'],
          },
        },
        {
          name: 'zellij_validate_layout',
          description: 'Validate layout file syntax',
          inputSchema: {
            type: 'object',
            properties: {
              layout_path: { type: 'string', description: 'Path to layout file to validate' },
            },
            required: ['layout_path'],
          },
        },

        // Advanced Pane Operations
        {
          name: 'zellij_new_pane',
          description: 'Create a new pane with advanced options',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['right', 'down'], description: 'Direction to split' },
              command: { type: 'string', description: 'Optional command to run in new pane' },
              cwd: { type: 'string', description: 'Working directory for new pane' },
            },
          },
        },
        {
          name: 'zellij_close_pane',
          description: 'Close the currently focused pane',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_swap_panes',
          description: 'Move/swap pane in specified direction',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['left', 'right', 'up', 'down'], description: 'Direction to move pane' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'zellij_stack_panes',
          description: 'Stack multiple panes by their IDs',
          inputSchema: {
            type: 'object',
            properties: {
              pane_ids: { type: 'array', items: { type: 'string' }, description: 'Array of pane IDs to stack' },
            },
            required: ['pane_ids'],
          },
        },
        {
          name: 'zellij_toggle_floating',
          description: 'Toggle floating panes visibility',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_toggle_fullscreen',
          description: 'Toggle fullscreen mode for focused pane',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_toggle_pane_embed_float',
          description: 'Toggle between embedded and floating for focused pane',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_pin_pane',
          description: 'Pin/unpin floating pane',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_toggle_frames',
          description: 'Toggle pane frames visibility',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_clear_pane',
          description: 'Clear the focused pane buffer',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_dump_screen',
          description: 'Dump pane screen content to file or stdout',
          inputSchema: {
            type: 'object',
            properties: {
              output_path: { type: 'string', description: 'Optional output file path' },
            },
          },
        },
        {
          name: 'zellij_edit_scrollback',
          description: 'Edit pane scrollback in default editor',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_rename_pane',
          description: 'Rename the focused pane',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'New name for the pane' },
            },
            required: ['name'],
          },
        },
        {
          name: 'zellij_undo_rename_pane',
          description: 'Remove pane name (reset to default)',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_focus_pane',
          description: 'Focus pane in specific direction',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['left', 'right', 'up', 'down', 'next', 'previous'], description: 'Direction to focus' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'zellij_move_focus_or_tab',
          description: 'Move focus to pane or tab (at screen edge)',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['left', 'right', 'up', 'down'], description: 'Direction to move' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'zellij_resize_pane',
          description: 'Resize the focused pane',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['left', 'right', 'up', 'down'], description: 'Direction to resize' },
              amount: { type: 'string', enum: ['increase', 'decrease'], description: 'Whether to increase or decrease' },
            },
            required: ['direction', 'amount'],
          },
        },
        {
          name: 'zellij_scroll',
          description: 'Scroll in focused pane',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction' },
              amount: { type: 'string', enum: ['line', 'half-page', 'page'], description: 'Scroll amount' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'zellij_scroll_to_edge',
          description: 'Scroll to top or bottom of pane',
          inputSchema: {
            type: 'object',
            properties: {
              edge: { type: 'string', enum: ['top', 'bottom'], description: 'Edge to scroll to' },
            },
            required: ['edge'],
          },
        },
        {
          name: 'zellij_exec_in_pane',
          description: 'Execute command in current pane',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' },
            },
            required: ['command'],
          },
        },
        {
          name: 'zellij_write_to_pane',
          description: 'Write text to current pane',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to write' },
              submit: { type: 'boolean', description: 'Whether to submit (press Enter)' },
            },
            required: ['text'],
          },
        },
        {
          name: 'zellij_get_pane_info',
          description: 'Get current pane layout information',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_change_floating_coordinates',
          description: 'Change floating pane position and size',
          inputSchema: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X coordinate' },
              y: { type: 'number', description: 'Y coordinate' },
              width: { type: 'number', description: 'Optional width' },
              height: { type: 'number', description: 'Optional height' },
            },
            required: ['x', 'y'],
          },
        },

        // Tab Management (Enhanced)
        {
          name: 'zellij_new_tab',
          description: 'Create a new tab',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Optional tab name' },
              layout: { type: 'string', description: 'Optional layout for tab' },
            },
          },
        },
        {
          name: 'zellij_close_tab',
          description: 'Close the current tab',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_rename_tab',
          description: 'Rename the current tab',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'New tab name' },
            },
            required: ['name'],
          },
        },
        {
          name: 'zellij_undo_rename_tab',
          description: 'Reset tab name to default',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_go_to_tab',
          description: 'Go to tab by index',
          inputSchema: {
            type: 'object',
            properties: {
              index: { type: 'number', description: 'Tab index (0-based)' },
            },
            required: ['index'],
          },
        },
        {
          name: 'zellij_go_to_tab_name',
          description: 'Go to tab by name',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Tab name' },
            },
            required: ['name'],
          },
        },
        {
          name: 'zellij_move_tab',
          description: 'Move tab left or right',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['left', 'right'], description: 'Direction to move tab' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'zellij_query_tab_names',
          description: 'Get all tab names in current session',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_toggle_sync_tab',
          description: 'Toggle synchronized input across all panes in tab',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_go_to_next_tab',
          description: 'Switch to next tab',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_go_to_previous_tab',
          description: 'Switch to previous tab',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },

        // System and Utility Tools
        {
          name: 'zellij_run_command',
          description: 'Run command in new pane',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to run' },
              direction: { type: 'string', enum: ['right', 'down'], description: 'Optional split direction' },
            },
            required: ['command'],
          },
        },
        {
          name: 'zellij_edit_file',
          description: 'Edit file in new Zellij pane',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'Path to file to edit' },
            },
            required: ['file_path'],
          },
        },
        {
          name: 'zellij_switch_mode',
          description: 'Switch input mode for all connected clients',
          inputSchema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['locked', 'pane', 'tab', 'resize', 'move', 'search', 'session'], description: 'Input mode' },
            },
            required: ['mode'],
          },
        },
        {
          name: 'zellij_kill_all_sessions',
          description: 'Kill all active sessions',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_delete_all_sessions',
          description: 'Delete all sessions',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },

        // Cache and System Management
        {
          name: 'zellij_clear_cache',
          description: 'Clear MCP server cache',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_get_cache_stats',
          description: 'Get cache statistics',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'zellij_health_check',
          description: 'Perform system health check',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        
        // LLM Completion Detection Tools
        {
          name: 'zellij_watch_pipe',
          description: 'Watch a pipe for specific patterns or EOF with timeout',
          inputSchema: {
            type: 'object',
            properties: {
              pipe_path: { type: 'string', description: 'Path to the pipe to watch' },
              patterns: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Optional array of patterns to watch for' 
              },
              timeout_ms: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
            },
            required: ['pipe_path'],
          },
        },
        {
          name: 'zellij_create_named_pipe',
          description: 'Create a named pipe for bidirectional communication',
          inputSchema: {
            type: 'object',
            properties: {
              pipe_name: { type: 'string', description: 'Name for the pipe (will be prefixed with /tmp/zellij-pipe-)' },
              mode: { type: 'string', description: 'Pipe permissions in octal format (default: "0666")' },
            },
            required: ['pipe_name'],
          },
        },
        {
          name: 'zellij_pipe_with_timeout',
          description: 'Pipe command output with automatic timeout completion',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute and pipe' },
              target_pipe: { type: 'string', description: 'Target pipe path to write to' },
              timeout_ms: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
            },
            required: ['command', 'target_pipe'],
          },
        },
        {
          name: 'zellij_poll_process',
          description: 'Poll process status by PID',
          inputSchema: {
            type: 'object',
            properties: {
              pid: { type: ['string', 'number'], description: 'Process ID to poll' },
              interval_ms: { type: 'number', description: 'Polling interval in milliseconds (default: 1000)' },
            },
            required: ['pid'],
          },
        },
        {
          name: 'zellij_watch_file',
          description: 'Watch file for changes with pattern matching',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'Path to the file to watch' },
              patterns: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Optional array of patterns to watch for' 
              },
              timeout_ms: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
            },
            required: ['file_path'],
          },
        },
        {
          name: 'zellij_create_llm_wrapper',
          description: 'Create LLM completion detector wrapper script',
          inputSchema: {
            type: 'object',
            properties: {
              wrapper_name: { type: 'string', description: 'Name for the wrapper script' },
              llm_command: { type: 'string', description: 'LLM command to wrap' },
              detect_marker: { type: 'string', description: 'Completion detection marker (default: "<<<LLM_COMPLETE>>>")' },
              timeout_ms: { type: 'number', description: 'Timeout in milliseconds (default: 60000)' },
            },
            required: ['wrapper_name', 'llm_command'],
          },
        },
        {
          name: 'zellij_cleanup_detection',
          description: 'Clean up detection resources (watchers, processes, temp files)',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Rate limiting check
        if (!Validator.checkRateLimit(`tool_${name}`, 50, 60000)) {
          throw new SecurityError('Rate limit exceeded. Please wait before making more requests.');
        }

        switch (name) {
          // Session Management
          case 'zellij_list_sessions':
            return await SessionTools.listSessions();
          case 'zellij_attach_session':
            return await this.attachSession(args?.session_name as string);
          case 'zellij_new_session':
            return await this.newSession(args?.session_name as string, args?.layout as string);
          case 'zellij_kill_session':
            return await this.killSession(args?.session_name as string);
          case 'zellij_delete_session':
            return await this.deleteSession(args?.session_name as string);
          case 'zellij_get_session_info':
            return await SessionTools.getSessionInfo(args?.session_name as string);
          case 'zellij_export_session':
            return await SessionTools.exportSession(args?.session_name as string, args?.output_path as string);
          case 'zellij_import_session':
            return await SessionTools.importSession(args?.import_path as string, args?.new_session_name as string);
          case 'zellij_clone_session':
            return await SessionTools.cloneSession(args?.source_session as string, args?.new_session_name as string);
          case 'zellij_rename_session':
            return await SessionTools.renameSession(args?.old_name as string, args?.new_name as string);
          case 'zellij_switch_session':
            return await SessionTools.switchSession(args?.session_name as string);

          // Piping Tools
          case 'zellij_pipe':
            return await PipingTools.pipe(args?.payload as string, {
              name: args?.pipe_name as string,
              plugin: args?.plugin_url as string,
              args: args?.args as string,
              configuration: args?.configuration as Record<string, any>,
            });
          case 'zellij_pipe_to_plugin':
            return await PipingTools.pipeToPlugin(
              args?.payload as string,
              args?.plugin_url as string,
              args?.pipe_name as string,
              args?.configuration as Record<string, any>
            );
          case 'zellij_pipe_broadcast':
            return await PipingTools.pipeBroadcast(args?.payload as string, args?.pipe_name as string);
          case 'zellij_action_pipe':
            return await PipingTools.actionPipe(args?.payload as string, {
              name: args?.pipe_name as string,
              plugin: args?.plugin_url as string,
              forceLaunch: args?.force_launch as boolean,
              skipCache: args?.skip_cache as boolean,
              floating: args?.floating as boolean,
              inPlace: args?.in_place as boolean,
              cwd: args?.cwd as string,
              title: args?.title as string,
            });
          case 'zellij_pipe_with_response':
            return await PipingTools.pipeWithResponse(args?.payload as string, {
              name: args?.pipe_name as string,
              plugin: args?.plugin_url as string,
            });
          case 'zellij_pipe_from_file':
            return await PipingTools.pipeFromFile(args?.file_path as string, {
              name: args?.pipe_name as string,
              plugin: args?.plugin_url as string,
            });

          // Plugin Management
          case 'zellij_launch_plugin':
            return await PluginTools.launchPlugin({
              url: args?.plugin_url as string,
              configuration: args?.configuration as Record<string, any>,
              floating: args?.floating as boolean,
              inPlace: args?.in_place as boolean,
              skipCache: args?.skip_cache as boolean,
              width: args?.width as string,
              height: args?.height as string,
              x: args?.x as string,
              y: args?.y as string,
              pinned: args?.pinned as boolean,
            });
          case 'zellij_action_launch_plugin':
            return await PluginTools.actionLaunchPlugin(args?.plugin_url as string, {
              configuration: args?.configuration as Record<string, any>,
              floating: args?.floating as boolean,
              inPlace: args?.in_place as boolean,
              skipCache: args?.skip_cache as boolean,
            });
          case 'zellij_launch_or_focus_plugin':
            return await PluginTools.launchOrFocusPlugin(args?.plugin_url as string, args?.configuration as Record<string, any>);
          case 'zellij_start_or_reload_plugin':
            return await PluginTools.startOrReloadPlugin(args?.plugin_url as string, args?.configuration as Record<string, any>);
          case 'zellij_list_aliases':
            return await PluginTools.listAliases();
          case 'zellij_get_plugin_info':
            return await PluginTools.getPluginInfo(args?.plugin_url as string);
          case 'zellij_list_running_plugins':
            return await PluginTools.listRunningPlugins();

          // Layout Management
          case 'zellij_dump_layout':
            return await LayoutTools.dumpLayout(args?.output_path as string);
          case 'zellij_save_layout':
            return await LayoutTools.saveLayout(args?.layout_name as string, args?.layouts_dir as string);
          case 'zellij_apply_layout':
            return await LayoutTools.applyLayout(args?.layout_name as string, args?.session_name as string);
          case 'zellij_list_layouts':
            return await LayoutTools.listLayouts(args?.layouts_dir as string);
          case 'zellij_load_layout':
            return await LayoutTools.loadLayout(args?.layout_name as string, args?.layouts_dir as string);
          case 'zellij_new_tab_with_layout':
            return await LayoutTools.newTabWithLayout(args?.layout_name as string, args?.tab_name as string);
          case 'zellij_validate_layout':
            return await LayoutTools.validateLayout(args?.layout_path as string);

          // Advanced Pane Operations
          case 'zellij_new_pane':
            return await PaneTools.newPane(args?.direction as string, args?.command as string, args?.cwd as string);
          case 'zellij_close_pane':
            return await this.closePaneOrTab('close-pane');
          case 'zellij_swap_panes':
            return await PaneTools.swapPanes(args?.direction as string);
          case 'zellij_stack_panes':
            return await PaneTools.stackPanes(args?.pane_ids as string[]);
          case 'zellij_toggle_floating':
            return await PaneTools.toggleFloating();
          case 'zellij_toggle_fullscreen':
            return await PaneTools.toggleFullscreen();
          case 'zellij_toggle_pane_embed_float':
            return await PaneTools.togglePaneEmbedFloat();
          case 'zellij_pin_pane':
            return await PaneTools.pinPane();
          case 'zellij_toggle_frames':
            return await PaneTools.toggleFrames();
          case 'zellij_clear_pane':
            return await PaneTools.clearPane();
          case 'zellij_dump_screen':
            return await PaneTools.dumpScreen(args?.output_path as string);
          case 'zellij_edit_scrollback':
            return await PaneTools.editScrollback();
          case 'zellij_rename_pane':
            return await PaneTools.renamePane(args?.name as string);
          case 'zellij_undo_rename_pane':
            return await PaneTools.undoRenamePane();
          case 'zellij_focus_pane':
            return await PaneTools.moveFocus(args?.direction as string);
          case 'zellij_move_focus_or_tab':
            return await PaneTools.moveFocusOrTab(args?.direction as string);
          case 'zellij_resize_pane':
            return await this.resizePane(args?.direction as string, args?.amount as string);
          case 'zellij_scroll':
            return await PaneTools.scroll(args?.direction as 'up' | 'down', args?.amount as 'line' | 'half-page' | 'page');
          case 'zellij_scroll_to_edge':
            return await PaneTools.scrollToEdge(args?.edge as 'top' | 'bottom');
          case 'zellij_exec_in_pane':
            return await PaneTools.execInPane(args?.command as string);
          case 'zellij_write_to_pane':
            return await PaneTools.writeToPane(args?.text as string, args?.submit as boolean);
          case 'zellij_get_pane_info':
            return await PaneTools.getPaneInfo();
          case 'zellij_change_floating_coordinates':
            return await PaneTools.changeFloatingCoordinates(
              args?.x as number,
              args?.y as number,
              args?.width as number,
              args?.height as number
            );

          // Tab Management
          case 'zellij_new_tab':
            return await this.newTab(args?.name as string, args?.layout as string);
          case 'zellij_close_tab':
            return await this.closePaneOrTab('close-tab');
          case 'zellij_rename_tab':
            return await this.renameTab(args?.name as string);
          case 'zellij_undo_rename_tab':
            return await this.undoRenameTab();
          case 'zellij_go_to_tab':
            return await this.goToTab(args?.index as number);
          case 'zellij_go_to_tab_name':
            return await this.goToTabName(args?.name as string);
          case 'zellij_move_tab':
            return await this.moveTab(args?.direction as string);
          case 'zellij_query_tab_names':
            return await this.queryTabNames();
          case 'zellij_toggle_sync_tab':
            return await this.toggleSyncTab();
          case 'zellij_go_to_next_tab':
            return await this.goToNextTab();
          case 'zellij_go_to_previous_tab':
            return await this.goToPreviousTab();

          // System Tools
          case 'zellij_run_command':
            return await this.runCommand(args?.command as string, args?.direction as string);
          case 'zellij_edit_file':
            return await this.editFile(args?.file_path as string);
          case 'zellij_switch_mode':
            return await this.switchMode(args?.mode as string);
          case 'zellij_kill_all_sessions':
            return await SessionTools.killAllSessions();
          case 'zellij_delete_all_sessions':
            return await SessionTools.deleteAllSessions();

          // Cache Management
          case 'zellij_clear_cache':
            return await this.clearCache();
          case 'zellij_get_cache_stats':
            return await this.getCacheStats();
          case 'zellij_health_check':
            return await this.healthCheck();

          // LLM Completion Detection Tools
          case 'zellij_watch_pipe':
            return await DetectionTools.watchPipe(
              args?.pipe_path as string,
              args?.patterns as string[],
              args?.timeout_ms as number
            );
          case 'zellij_create_named_pipe':
            return await DetectionTools.createNamedPipe(
              args?.pipe_name as string,
              args?.mode as string
            );
          case 'zellij_pipe_with_timeout':
            return await DetectionTools.pipeWithTimeout(
              args?.command as string,
              args?.target_pipe as string,
              args?.timeout_ms as number
            );
          case 'zellij_poll_process':
            return await DetectionTools.pollProcess(
              args?.pid as string | number,
              args?.interval_ms as number
            );
          case 'zellij_watch_file':
            return await DetectionTools.watchFile(
              args?.file_path as string,
              args?.patterns as string[],
              args?.timeout_ms as number
            );
          case 'zellij_create_llm_wrapper':
            return await DetectionTools.createLLMWrapper(
              args?.wrapper_name as string,
              args?.llm_command as string,
              args?.detect_marker as string,
              args?.timeout_ms as number
            );
          case 'zellij_cleanup_detection':
            return await DetectionTools.cleanupDetection();

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new McpError(ErrorCode.InvalidParams, error.message);
        }
        if (error instanceof SecurityError) {
          throw new McpError(ErrorCode.InvalidRequest, error.message);
        }
        if (error instanceof ZellijError) {
          throw new McpError(ErrorCode.InternalError, error.message);
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // Legacy method implementations for backward compatibility
  private async execZellij(command: string): Promise<string> {
    const { execAsync } = await import('./utils/command.js');
    try {
      const result = await execAsync(`zellij ${command}`);
      return result.stdout;
    } catch (error) {
      throw new ZellijError(`Zellij command failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Implementation methods (keeping existing ones for compatibility)
  private async attachSession(sessionName: string) {
    const nameValidation = Validator.validateSessionName(sessionName);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`attach ${nameValidation.sanitized}`);
    return { content: [{ type: 'text', text: `Attached to session: ${nameValidation.sanitized}` }] };
  }

  private async newSession(sessionName: string, layout?: string) {
    const nameValidation = Validator.validateSessionName(sessionName);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
    }

    let command = `--session ${nameValidation.sanitized}`;
    if (layout) {
      const layoutValidation = Validator.validateString(layout, 'layout', 128);
      if (!layoutValidation.valid) {
        throw new ValidationError(`Invalid layout: ${layoutValidation.errors.join(', ')}`);
      }
      command += ` --layout ${layoutValidation.sanitized}`;
    }
    
    const result = await this.execZellij(command);
    cache.delete('sessions_list');
    return { 
      content: [{ 
        type: 'text', 
        text: `Created new session: ${nameValidation.sanitized}${layout ? ` with layout: ${layout}` : ''}` 
      }] 
    };
  }

  private async killSession(sessionName: string) {
    const nameValidation = Validator.validateSessionName(sessionName);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`kill-session ${nameValidation.sanitized}`);
    cache.delete('sessions_list');
    return { content: [{ type: 'text', text: `Killed session: ${nameValidation.sanitized}` }] };
  }

  private async deleteSession(sessionName: string) {
    const nameValidation = Validator.validateSessionName(sessionName);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid session name: ${nameValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`delete-session ${nameValidation.sanitized}`);
    cache.delete('sessions_list');
    return { content: [{ type: 'text', text: `Deleted session: ${nameValidation.sanitized}` }] };
  }

  private async closePaneOrTab(action: string) {
    const result = await this.execZellij(`action ${action}`);
    return { content: [{ type: 'text', text: `Closed ${action === 'close-pane' ? 'pane' : 'tab'}` }] };
  }

  private async newTab(name?: string, layout?: string) {
    let actionCommand = 'new-tab';
    if (name) {
      const nameValidation = Validator.validateString(name, 'tab name', 64);
      if (!nameValidation.valid) {
        throw new ValidationError(`Invalid tab name: ${nameValidation.errors.join(', ')}`);
      }
      actionCommand += ` --name "${nameValidation.sanitized}"`;
    }
    if (layout) {
      const layoutValidation = Validator.validateString(layout, 'layout', 128);
      if (!layoutValidation.valid) {
        throw new ValidationError(`Invalid layout: ${layoutValidation.errors.join(', ')}`);
      }
      actionCommand += ` --layout ${layoutValidation.sanitized}`;
    }
    
    const result = await this.execZellij(`action ${actionCommand}`);
    return { 
      content: [{ 
        type: 'text', 
        text: `Created new tab${name ? `: ${name}` : ''}${layout ? ` with layout: ${layout}` : ''}` 
      }] 
    };
  }

  private async renameTab(name: string) {
    const nameValidation = Validator.validateString(name, 'tab name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid tab name: ${nameValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`action rename-tab "${nameValidation.sanitized}"`);
    return { content: [{ type: 'text', text: `Renamed tab to: ${nameValidation.sanitized}` }] };
  }

  private async undoRenameTab() {
    const result = await this.execZellij('action undo-rename-tab');
    return { content: [{ type: 'text', text: 'Tab name reset to default' }] };
  }

  private async goToTab(index: number) {
    if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new ValidationError('Tab index must be a non-negative integer');
    }
    
    const result = await this.execZellij(`action go-to-tab ${index}`);
    return { content: [{ type: 'text', text: `Switched to tab: ${index}` }] };
  }

  private async goToTabName(name: string) {
    const nameValidation = Validator.validateString(name, 'tab name', 64);
    if (!nameValidation.valid) {
      throw new ValidationError(`Invalid tab name: ${nameValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`action go-to-tab-name "${nameValidation.sanitized}"`);
    return { content: [{ type: 'text', text: `Switched to tab: ${nameValidation.sanitized}` }] };
  }

  private async moveTab(direction: string) {
    const validDirections = ['left', 'right'];
    if (!validDirections.includes(direction)) {
      throw new ValidationError(`Direction must be one of: ${validDirections.join(', ')}`);
    }
    
    const result = await this.execZellij(`action move-tab ${direction}`);
    return { content: [{ type: 'text', text: `Moved tab ${direction}` }] };
  }

  private async queryTabNames() {
    const result = await this.execZellij('action query-tab-names');
    return { content: [{ type: 'text', text: result || 'Tab names retrieved' }] };
  }

  private async toggleSyncTab() {
    const result = await this.execZellij('action toggle-active-sync-tab');
    return { content: [{ type: 'text', text: 'Tab sync toggled' }] };
  }

  private async goToNextTab() {
    const result = await this.execZellij('action go-to-next-tab');
    return { content: [{ type: 'text', text: 'Switched to next tab' }] };
  }

  private async goToPreviousTab() {
    const result = await this.execZellij('action go-to-previous-tab');
    return { content: [{ type: 'text', text: 'Switched to previous tab' }] };
  }

  private async resizePane(direction: string, amount: string) {
    const dirValidation = Validator.validateDirection(direction);
    if (!dirValidation.valid) {
      throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}`);
    }
    
    const amountValidation = Validator.validateResizeAmount(amount);
    if (!amountValidation.valid) {
      throw new ValidationError(`Invalid amount: ${amountValidation.errors.join(', ')}`);
    }
    
    const result = await this.execZellij(`action resize ${amountValidation.sanitized} ${dirValidation.sanitized}`);
    return { content: [{ type: 'text', text: `Resized pane: ${amountValidation.sanitized} ${dirValidation.sanitized}` }] };
  }

  private async runCommand(command: string, direction?: string) {
    const cmdValidation = Validator.validateCommand(command);
    if (!cmdValidation.valid) {
      throw new ValidationError(`Invalid command: ${cmdValidation.errors.join(', ')}`);
    }
    
    let fullCommand = `run`;
    if (direction) {
      const dirValidation = Validator.validateSplitDirection(direction);
      if (!dirValidation.valid) {
        throw new ValidationError(`Invalid direction: ${dirValidation.errors.join(', ')}`);
      }
      fullCommand += ` --direction ${dirValidation.sanitized}`;
    }
    fullCommand += ` -- ${cmdValidation.sanitized}`;
    
    const result = await this.execZellij(fullCommand);
    return { content: [{ type: 'text', text: `Running command in new pane: ${cmdValidation.sanitized}` }] };
  }

  private async editFile(filePath: string) {
    const pathValidation = Validator.validateString(filePath, 'file path', 512);
    if (!pathValidation.valid) {
      throw new ValidationError(`Invalid file path: ${pathValidation.errors.join(', ')}`);
    }
    
    if (filePath.includes('..')) {
      throw new ValidationError('File path cannot contain directory traversal (..)');
    }
    
    const result = await this.execZellij(`edit "${pathValidation.sanitized}"`);
    return { content: [{ type: 'text', text: `Editing file: ${pathValidation.sanitized}` }] };
  }

  private async switchMode(mode: string) {
    const validModes = ['locked', 'pane', 'tab', 'resize', 'move', 'search', 'session'];
    if (!validModes.includes(mode)) {
      throw new ValidationError(`Mode must be one of: ${validModes.join(', ')}`);
    }
    
    const result = await this.execZellij(`action switch-mode ${mode}`);
    return { content: [{ type: 'text', text: `Switched to mode: ${mode}` }] };
  }

  private async clearCache() {
    cache.clear();
    return { content: [{ type: 'text', text: 'MCP server cache cleared' }] };
  }

  private async getCacheStats() {
    const stats = cache.getStats();
    return { 
      content: [{ 
        type: 'text', 
        text: `Cache Statistics:\nSize: ${stats.size} entries\nKeys: ${stats.keys.join(', ') || 'none'}` 
      }] 
    };
  }

  private async healthCheck() {
    try {
      // Test basic Zellij connectivity
      await this.execZellij('--version');
      
      const stats = cache.getStats();
      const report = `Health Check Report:
✓ Zellij CLI accessible
✓ MCP Server running
✓ Cache system operational (${stats.size} entries)
✓ Validation system active
✓ Rate limiting enabled

All systems operational.`;
      
      return { content: [{ type: 'text', text: report }] };
    } catch (error) {
      const report = `Health Check Report:
✗ Zellij CLI error: ${error instanceof Error ? error.message : String(error)}
✓ MCP Server running
✓ Cache system operational
✓ Validation system active

Warning: Some functionality may be impaired.`;
      
      return { content: [{ type: 'text', text: report }] };
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Zellij MCP Server v2.0.0 running on stdio');
    console.error(`Features: ${Object.keys(this).length} tools, caching, validation, security`);
  }
}

const server = new ZellijMCPServer();
server.start().catch(console.error);