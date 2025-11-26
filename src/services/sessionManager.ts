import type { SessionData, SessionMetadata } from '../types/trace';
import { fileSystemService } from './fileSystem';
import { traceParserService } from './traceParser';

export interface SessionSummary {
  sessionId: string;
  filename: string;
  metadata: SessionMetadata;
  isLoaded: boolean;
}

export class SessionManagerService {
  private sessionCache = new Map<string, SessionData>();
  private sessionSummaryCache = new Map<string, SessionSummary>();
  private currentDirectory: FileSystemDirectoryHandle | null = null;

  setCurrentDirectory(handle: FileSystemDirectoryHandle): void {
    this.currentDirectory = handle;
    // Clear caches when directory changes
    this.sessionCache.clear();
    this.sessionSummaryCache.clear();
  }

  getCurrentDirectory(): FileSystemDirectoryHandle | null {
    return this.currentDirectory;
  }

  async discoverSessions(): Promise<SessionSummary[]> {
    if (!this.currentDirectory) {
      throw new Error('No directory selected');
    }

    const jsonlFiles = await fileSystemService.findJsonlFiles(this.currentDirectory);
    const sessionSummaries: SessionSummary[] = [];
    let processed = 0;

    for (const fileHandle of jsonlFiles) {
      try {
        processed++;

        const sessionId = this.extractSessionIdFromFilename(fileHandle.name);

        if (!sessionId) {
          console.warn(`Unable to extract session ID from filename: ${fileHandle.name}`);
          continue;
        }

        // Check if we already have this session summary cached
        const cached = this.sessionSummaryCache.get(sessionId);
        if (cached) {
          sessionSummaries.push(cached);
          continue;
        }

        // Extract metadata without loading full content (peek at first few lines)
        const metadata = await this.extractSessionMetadata(fileHandle);

        const summary: SessionSummary = {
          sessionId,
          filename: fileHandle.name,
          metadata,
          isLoaded: this.sessionCache.has(sessionId)
        };

        this.sessionSummaryCache.set(sessionId, summary);
        sessionSummaries.push(summary);
      } catch (error) {
        console.error(`Error processing session file ${fileHandle.name}:`, error);
        // Continue processing other files instead of failing completely
      }
    }

    // Sort by start time (most recent first)
    return sessionSummaries.sort((a, b) => b.metadata.startTime - a.metadata.startTime);
  }

  async getSessionData(sessionId: string): Promise<SessionData> {
    // Check cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      return cached;
    }

    // Load from file
    const sessionData = await this.loadSessionData(sessionId);

    // Cache the result
    this.sessionCache.set(sessionId, sessionData);

    // Update summary cache to mark as loaded
    const summary = this.sessionSummaryCache.get(sessionId);
    if (summary) {
      summary.isLoaded = true;
    }

    return sessionData;
  }

  private async loadSessionData(sessionId: string): Promise<SessionData> {
    if (!this.currentDirectory) {
      throw new Error('No directory selected');
    }

    const summary = this.sessionSummaryCache.get(sessionId);
    if (!summary) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const jsonlFiles = await fileSystemService.findJsonlFiles(this.currentDirectory);
    const fileHandle = jsonlFiles.find(f => f.name === summary.filename);

    if (!fileHandle) {
      throw new Error(`Session file ${summary.filename} not found`);
    }

    const content = await fileSystemService.readFile(fileHandle);
    return traceParserService.parseSessionFile(content, summary.filename);
  }

  private async extractSessionMetadata(fileHandle: FileSystemFileHandle): Promise<SessionMetadata> {
    try {
      // Read the full file content
      const fullContent = await fileSystemService.readFile(fileHandle);

      // Parse JSONL content with robust error handling
      const fullEntries = traceParserService.parseJsonlContent(fullContent);

      if (fullEntries.length === 0) {
        console.warn(`No valid entries found in ${fileHandle.name}`);
        // Return empty metadata but with the filename for debugging
        return {
          userId: `no-entries-${fileHandle.name}`,
          requestCount: 0,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheCreationTokens: 0,
          totalCacheReadTokens: 0,
          totalCacheCreation5mTokens: 0,
          totalCacheCreation1hTokens: 0,
          duration: 0,
          startTime: Date.now(),
          endTime: Date.now(),
          modelsUsed: new Set(),
          toolsAvailable: new Set(),
          toolsUsed: new Set(),
          hasErrors: false
        };
      }

      return traceParserService.calculateSessionMetadata(fullEntries);
    } catch (error) {
      console.error(`Error extracting metadata from ${fileHandle.name}:`, error);
      // Return empty metadata as fallback
      return {
        userId: `error-${fileHandle.name}`,
        requestCount: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheCreation5mTokens: 0,
        totalCacheCreation1hTokens: 0,
        duration: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        modelsUsed: new Set(),
        toolsAvailable: new Set(),
        toolsUsed: new Set(),
        hasErrors: true
      };
    }
  }

  private extractSessionIdFromFilename(filename: string): string | null {
    // Try to extract session ID from the filename pattern log-YYYY-MM-DD-HH-mm-ss.jsonl
    const match = filename.match(/^log-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\.jsonl$/);
    return match ? match[1] : null;
  }

  getCachedSession(sessionId: string): SessionData | null {
    return this.sessionCache.get(sessionId) || null;
  }

  getCachedSessionSummary(sessionId: string): SessionSummary | null {
    return this.sessionSummaryCache.get(sessionId) || null;
  }

  clearCache(): void {
    this.sessionCache.clear();
    this.sessionSummaryCache.clear();
  }

  getCacheStats(): {
    loadedSessions: number;
    discoveredSessions: number;
  } {
    return {
      loadedSessions: this.sessionCache.size,
      discoveredSessions: this.sessionSummaryCache.size
    };
  }
}

export const sessionManagerService = new SessionManagerService();