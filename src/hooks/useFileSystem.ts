import { useState, useEffect, useCallback } from 'react';
import { fileSystemService } from '../services/fileSystem';
import { useDirectory } from '../contexts/DirectoryContext';
import type { SessionData, ParsedSession } from '../types/trace';
import { traceParserService } from '../services/traceParser';

interface UseFileSystemState {
  directoryInfo: {
    name: string;
    jsonlFileCount: number;
    isClaudeTraceDirectory: boolean;
  } | null;
  sessions: ParsedSession[];
  isLoading: boolean;
  error: string | null;
  browserSupport: {
    supported: boolean;
    reason?: string;
  };
}

interface UseFileSystemActions {
  selectDirectory: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  loadSessionData: (sessionId: string) => Promise<SessionData | null>;
}

export function useFileSystem(): UseFileSystemState & UseFileSystemActions {
  // Get directory from context
  const { directoryHandle, selectDirectory: selectDir } = useDirectory();

  const [state, setState] = useState<UseFileSystemState>({
    directoryInfo: null,
    sessions: [],
    isLoading: false,
    error: null,
    browserSupport: { supported: true },
  });

  const checkBrowserSupport = useCallback(async () => {
    const support = await fileSystemService.checkBrowserSupport();
    setState(prev => ({ ...prev, browserSupport: support }));
  }, []);

  const discoverSessions = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      const jsonlFiles = await fileSystemService.findJsonlFiles(handle);
      const sessions: ParsedSession[] = [];

      for (const fileHandle of jsonlFiles) {
        const sessionId = fileSystemService.extractSessionIdFromFilename(fileHandle.name);
        if (sessionId) {
          const content = await fileSystemService.readFile(fileHandle);
          const entries = traceParserService.parseJsonlContent(content);

          if (entries.length > 0) {
            const metadata = traceParserService.calculateSessionMetadata(entries);

            sessions.push({
              sessionId,
              metadata,
              filePath: fileHandle.name
            });
          }
        }
      }

      sessions.sort((a, b) => b.metadata.startTime - a.metadata.startTime);

      setState(prev => ({
        ...prev,
        sessions
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to discover sessions: ${(error as Error).message}`
      }));
    }
  }, []);

  const selectDirectory = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const handle = await fileSystemService.selectDirectory();
      const info = await fileSystemService.getDirectoryInfo(handle);

      if (!info.isClaudeTraceDirectory) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Selected directory does not appear to be a .claude-trace directory. Please select a directory containing Claude trace JSONL files.'
        }));
        return;
      }

      // Use context to set the directory
      await selectDir(handle);

      setState(prev => ({
        ...prev,
        directoryInfo: info,
        isLoading: false
      }));

      await discoverSessions(handle);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }));
    }
  }, [discoverSessions, selectDir]);


  const refreshSessions = useCallback(async () => {
    if (!directoryHandle) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await discoverSessions(directoryHandle);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to refresh sessions: ${(error as Error).message}`
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [directoryHandle, discoverSessions]);

  const loadSessionData = useCallback(async (sessionId: string): Promise<SessionData | null> => {
    if (!directoryHandle) {
      throw new Error('No directory selected');
    }

    const session = state.sessions.find(s => s.sessionId === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const jsonlFiles = await fileSystemService.findJsonlFiles(directoryHandle);
      const fileHandle = jsonlFiles.find(f => f.name === session.filePath);

      if (!fileHandle) {
        throw new Error(`File ${session.filePath} not found`);
      }

      const content = await fileSystemService.readFile(fileHandle);
      return await traceParserService.parseSessionFile(content, session.filePath);
    } catch (error) {
      throw new Error(`Failed to load session data: ${(error as Error).message}`);
    }
  }, [directoryHandle, state.sessions]);


  useEffect(() => {
    checkBrowserSupport();
  }, [checkBrowserSupport]);

  return {
    ...state,
    selectDirectory,
    refreshSessions,
    loadSessionData,
  };
}