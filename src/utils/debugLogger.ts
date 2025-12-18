/**
 * Debug logging utility for conversation grouping
 *
 * Usage:
 * import { debugLogger } from '../utils/debugLogger';
 * debugLogger.log('conversationGrouper', 'Grouping conversations', { count: requests.length });
 *
 * To enable/disable logging, modify the ENABLED flag below or set localStorage.DEBUG_TRACE_VIEWER
 */

// Enable/disable debug logging
const ENABLED = true;

// Color coding for different modules
const MODULE_COLORS = {
  conversationGrouper: '#9333ea', // purple
  requestAnalyzer: '#2563eb',     // blue
  requestCard: '#16a34a',          // green
  useRequestDetail: '#ea580c',    // orange
  general: '#6b7280'               // gray
} as const;

type ModuleName = keyof typeof MODULE_COLORS;

class DebugLogger {
  private enabled: boolean;

  constructor() {
    // Check localStorage for debug flag
    if (typeof window !== 'undefined') {
      const localStorageFlag = localStorage.getItem('DEBUG_TRACE_VIEWER');
      this.enabled = localStorageFlag === 'true' || ENABLED;
    } else {
      this.enabled = ENABLED;
    }
  }

  /**
   * Log a debug message with optional data
   */
  log(module: ModuleName, message: string, data?: unknown) {
    if (!this.enabled) return;

    const color = MODULE_COLORS[module] || MODULE_COLORS.general;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    console.log(
      `%c[${timestamp}] [${module}]%c ${message}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit; font-weight: normal'
    );

    if (data !== undefined) {
      console.log(`%c  └─ Data:`, `color: ${color}`, data);
    }
  }

  /**
   * Log a group start (collapsible in console)
   */
  group(module: ModuleName, title: string) {
    if (!this.enabled) return;

    const color = MODULE_COLORS[module] || MODULE_COLORS.general;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    console.group(
      `%c[${timestamp}] [${module}] ${title}`,
      `color: ${color}; font-weight: bold`
    );
  }

  /**
   * End a log group
   */
  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }

  /**
   * Log a warning
   */
  warn(module: ModuleName, message: string, data?: unknown) {
    if (!this.enabled) return;

    const color = MODULE_COLORS[module] || MODULE_COLORS.general;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    console.warn(
      `%c[${timestamp}] [${module}] ⚠️ ${message}`,
      `color: ${color}; font-weight: bold`
    );

    if (data !== undefined) {
      console.warn(`  └─ Data:`, data);
    }
  }

  /**
   * Log an error
   */
  error(module: ModuleName, message: string, error?: unknown) {
    if (!this.enabled) return;

    const color = MODULE_COLORS[module] || MODULE_COLORS.general;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    console.error(
      `%c[${timestamp}] [${module}] ❌ ${message}`,
      `color: ${color}; font-weight: bold`
    );

    if (error !== undefined) {
      console.error(`  └─ Error:`, error);
    }
  }

  /**
   * Log a table for better data visualization
   */
  table(module: ModuleName, message: string, data: unknown[]) {
    if (!this.enabled) return;

    const color = MODULE_COLORS[module] || MODULE_COLORS.general;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    console.log(
      `%c[${timestamp}] [${module}] ${message}`,
      `color: ${color}; font-weight: bold`
    );
    console.table(data);
  }

  /**
   * Enable debug logging
   */
  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('DEBUG_TRACE_VIEWER', 'true');
    }
    console.log('%c[Debug Logger] Enabled', 'color: #10b981; font-weight: bold');
  }

  /**
   * Disable debug logging
   */
  disable() {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('DEBUG_TRACE_VIEWER', 'false');
    }
    console.log('%c[Debug Logger] Disabled', 'color: #ef4444; font-weight: bold');
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Make it available globally for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugLogger = debugLogger;
}
