import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

/**
 * Base class for tool definitions. Provides default formatting behavior
 * that can be overridden by specific tool implementations.
 */
export class ToolDefinition {
  /**
   * Format input parameters for display.
   * Default implementation extracts the first available parameter from common keys.
   *
   * @param input - Tool input parameters
   * @returns Formatted string representation of input parameters
   */
  formatInput(input: Record<string, unknown>): string {
    // Common parameter keys to check in order of preference
    const commonKeys = [
      'file_path',
      'path',
      'command',
      'pattern',
      'url',
      'query',
      'description',
      'prompt'
    ];

    // Try to extract first available parameter
    for (const key of commonKeys) {
      if (input[key] !== undefined && input[key] !== null) {
        const value = String(input[key]);
        return value;
      }
    }

    // Fallback: return first parameter value found
    const keys = Object.keys(input);
    if (keys.length > 0) {
      const firstKey = keys[0];
      return String(input[firstKey]);
    }

    return '';
  }

  /**
   * Format result summary for display.
   * Default implementation returns null (no result summary).
   *
   * @param input - Tool input parameters
   * @param result - Tool result block
   * @returns Formatted result summary or null if no summary should be shown
   */
  formatResult(_input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    return null;
  }

  /**
   * Get display name for the tool.
   * Default implementation returns the tool name as-is.
   *
   * @param toolName - The tool name
   * @returns Display name for the tool
   */
  getDisplayName(toolName: string): string {
    return toolName;
  }

  /**
   * Optional custom renderer for input parameters in the modal.
   *
   * @param input - Tool input parameters
   * @returns React node or null to use default JSON rendering
   */
  renderCustomInput?(input: Record<string, unknown>): React.ReactNode | null;

  /**
   * Optional custom renderer for result content in the modal.
   *
   * @param result - Tool result block
   * @returns React node or null to use default text rendering
   */
  renderCustomResult?(result: ToolResultBlock): React.ReactNode | null;
}

/**
 * Registry for tool definitions. Manages tool registration and provides
 * formatting methods for tool calls and results.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private baseDefinition: ToolDefinition = new ToolDefinition();

  /**
   * Register a tool definition.
   *
   * @param name - Tool name
   * @param definition - Tool definition instance
   */
  register(name: string, definition: ToolDefinition): void {
    this.tools.set(name, definition);
  }

  /**
   * Get tool definition by name. Returns base definition if not found.
   *
   * @param name - Tool name
   * @returns Tool definition instance
   */
  get(name: string): ToolDefinition {
    return this.tools.get(name) || this.baseDefinition;
  }

  /**
   * Format a tool call for display.
   * Format: ToolName(formatted_input)
   *
   * @param toolUse - Tool use block
   * @returns Formatted tool call string
   */
  formatToolCall(toolUse: ToolUseBlock): string {
    const definition = this.get(toolUse.name);
    const formattedInput = definition.formatInput(toolUse.input);

    if (formattedInput) {
      return `${toolUse.name}(${formattedInput})`;
    }

    return toolUse.name;
  }

  /**
   * Format a tool result for display.
   * Format: ToolName(formatted_input, [result_summary])
   * Result summary is optional - only shown if defined by the tool.
   *
   * @param toolUse - Tool use block
   * @param result - Tool result block
   * @returns Formatted tool result string
   */
  formatToolResult(toolUse: ToolUseBlock, result: ToolResultBlock): string {
    const definition = this.get(toolUse.name);
    const formattedInput = definition.formatInput(toolUse.input);
    const resultSummary = definition.formatResult(toolUse.input, result);

    if (resultSummary) {
      if (formattedInput) {
        return `${toolUse.name}(${formattedInput}, [${resultSummary}])`;
      }
      return `${toolUse.name}([${resultSummary}])`;
    }

    // No result summary - just return the tool call format
    return this.formatToolCall(toolUse);
  }

  /**
   * Check if a tool has a custom input renderer.
   *
   * @param toolName - Tool name
   * @returns True if custom renderer is defined
   */
  hasCustomInputRenderer(toolName: string): boolean {
    const definition = this.get(toolName);
    return definition.renderCustomInput !== undefined;
  }

  /**
   * Check if a tool has a custom result renderer.
   *
   * @param toolName - Tool name
   * @returns True if custom renderer is defined
   */
  hasCustomResultRenderer(toolName: string): boolean {
    const definition = this.get(toolName);
    return definition.renderCustomResult !== undefined;
  }

  /**
   * Render custom input for a tool.
   *
   * @param toolName - Tool name
   * @param input - Tool input parameters
   * @returns React node or null
   */
  renderCustomInput(toolName: string, input: Record<string, unknown>): React.ReactNode | null {
    const definition = this.get(toolName);
    if (definition.renderCustomInput) {
      return definition.renderCustomInput(input);
    }
    return null;
  }

  /**
   * Render custom result for a tool.
   *
   * @param toolName - Tool name
   * @param result - Tool result block
   * @returns React node or null
   */
  renderCustomResult(toolName: string, result: ToolResultBlock): React.ReactNode | null {
    const definition = this.get(toolName);
    if (definition.renderCustomResult) {
      return definition.renderCustomResult(result);
    }
    return null;
  }
}

/**
 * Singleton instance of the tool registry.
 */
export const toolRegistry = new ToolRegistry();
