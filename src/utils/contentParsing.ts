/**
 * Utilities for parsing and formatting tool content.
 * Shared parsing functions used by custom tool renderers.
 */

// Re-export stripSystemReminders from messageFormatting for convenience
export { stripSystemReminders } from './messageFormatting';

/**
 * Represents a line with line number and text content
 */
export interface ParsedLine {
  lineNum: number;
  text: string;
}

/**
 * Parse content with line-numbered format: "  123→text content"
 * This is the format returned by the Read tool and Edit tool.
 *
 * @param content - The content string to parse
 * @returns Array of parsed lines with line numbers and text
 */
export function parseLineNumberedContent(content: string): ParsedLine[] {
  if (!content) return [];

  const lines = content.split('\n');
  const result: ParsedLine[] = [];

  for (const line of lines) {
    // Match format: spaces + digits + → + text
    // Example: "     1→# Title"
    const match = line.match(/^\s+(\d+)→(.*)$/);
    if (match) {
      result.push({
        lineNum: parseInt(match[1], 10),
        text: match[2]
      });
    }
  }

  return result;
}

/**
 * Extract all system-reminder tags from content
 * System reminders have format: <system-reminder>...</system-reminder>
 *
 * @param content - The content string to extract from
 * @returns Array of system reminder contents (without tags)
 */
export function extractSystemReminders(content: string): string[] {
  if (!content) return [];

  const regex = /<system-reminder>(.*?)<\/system-reminder>/gs;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

/**
 * Count lines in content, handling both line-numbered and plain text formats.
 * For line-numbered content, counts the numbered lines.
 * For plain text, counts non-empty lines.
 *
 * @param content - The content string to count
 * @returns Number of lines
 */
export function countLines(content: string): number {
  if (!content) return 0;

  // Try to parse as line-numbered content first
  const parsed = parseLineNumberedContent(content);
  if (parsed.length > 0) {
    return parsed.length;
  }

  // Fallback: count non-empty lines in plain text
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  return lines.length;
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - Number of bytes
 * @returns Formatted string like "1.5 KB" or "2.3 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncate text to a maximum number of lines
 *
 * @param text - The text to truncate
 * @param maxLines - Maximum number of lines to keep
 * @returns Object with truncated text and whether it was truncated
 */
export function truncateToLines(text: string, maxLines: number): { text: string; truncated: boolean; totalLines: number } {
  const lines = text.split('\n');
  const totalLines = lines.length;

  if (totalLines <= maxLines) {
    return { text, truncated: false, totalLines };
  }

  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
    totalLines
  };
}

/**
 * Extract filename from a file path
 *
 * @param filePath - Full file path
 * @returns Just the filename
 */
export function extractFilename(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

/**
 * Detect if a Read operation was partial (using offset/limit)
 *
 * @param input - Tool input parameters
 * @returns true if offset or limit was used
 */
export function isPartialRead(input: Record<string, any>): boolean {
  return 'offset' in input || 'limit' in input;
}

/**
 * Get the range of lines displayed in a partial read
 *
 * @param input - Tool input parameters with offset/limit
 * @param totalLines - Total lines in result
 * @returns Object describing the range
 */
export function getReadRange(input: Record<string, any>, totalLines: number): { start: number; end: number } {
  const offset = input.offset ? parseInt(String(input.offset), 10) : 1;

  return {
    start: offset,
    end: offset + totalLines - 1
  };
}
