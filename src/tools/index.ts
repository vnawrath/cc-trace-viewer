/**
 * Tool registry barrel export.
 * Imports and registers all tool definitions.
 */

import { toolRegistry } from '../utils/toolRegistry';
import { ReadTool } from './ReadTool';
import { WriteTool } from './WriteTool';
import { EditTool } from './EditTool';
import { TodoWriteTool } from './TodoWriteTool';
import { BashTool } from './BashTool';
import { GrepTool } from './GrepTool';
import { GlobTool } from './GlobTool';
import { TaskTool } from './TaskTool';
import { WebFetchTool } from './WebFetchTool';
import { WebSearchTool } from './WebSearchTool';
import { ExitPlanModeTool } from './ExitPlanModeTool';
import { NotebookEditTool } from './NotebookEditTool';
import { BashOutputTool } from './BashOutputTool';
import { KillShellTool } from './KillShellTool';
import { SlashCommandTool } from './SlashCommandTool';

// Register all tools
toolRegistry.register('Read', new ReadTool());
toolRegistry.register('Write', new WriteTool());
toolRegistry.register('Edit', new EditTool());
toolRegistry.register('TodoWrite', new TodoWriteTool());
toolRegistry.register('Bash', new BashTool());
toolRegistry.register('Grep', new GrepTool());
toolRegistry.register('Glob', new GlobTool());
toolRegistry.register('Task', new TaskTool());
toolRegistry.register('WebFetch', new WebFetchTool());
toolRegistry.register('WebSearch', new WebSearchTool());
toolRegistry.register('ExitPlanMode', new ExitPlanModeTool());
toolRegistry.register('NotebookEdit', new NotebookEditTool());
toolRegistry.register('BashOutput', new BashOutputTool());
toolRegistry.register('KillShell', new KillShellTool());
toolRegistry.register('SlashCommand', new SlashCommandTool());

// Export the registry for convenience
export { toolRegistry };
export * from './ReadTool';
export * from './WriteTool';
export * from './EditTool';
export * from './TodoWriteTool';
export * from './BashTool';
export * from './GrepTool';
export * from './GlobTool';
export * from './TaskTool';
export * from './WebFetchTool';
export * from './WebSearchTool';
export * from './ExitPlanModeTool';
export * from './NotebookEditTool';
export * from './BashOutputTool';
export * from './KillShellTool';
export * from './SlashCommandTool';
