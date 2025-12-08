/**
 * Tool registry barrel export.
 * Imports and registers all tool definitions.
 */

import { toolRegistry } from '../utils/toolRegistry';
import { ReadTool } from './ReadTool';
import { WriteTool } from './WriteTool';
import { EditTool } from './EditTool';
import { TodoWriteTool } from './TodoWriteTool';

// Register all tools
toolRegistry.register('Read', new ReadTool());
toolRegistry.register('Write', new WriteTool());
toolRegistry.register('Edit', new EditTool());
toolRegistry.register('TodoWrite', new TodoWriteTool());

// Export the registry for convenience
export { toolRegistry };
export * from './ReadTool';
export * from './WriteTool';
export * from './EditTool';
export * from './TodoWriteTool';
