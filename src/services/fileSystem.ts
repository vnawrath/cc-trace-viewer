export class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async selectDirectory(): Promise<FileSystemDirectoryHandle> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser. Please use Chrome or Edge.');
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });

      this.directoryHandle = handle;
      return handle;
    } catch (error) {
      if ((error as Error & { name: string }).name === 'AbortError') {
        throw new Error('Directory selection was cancelled');
      }
      throw new Error(`Failed to select directory: ${(error as Error).message}`);
    }
  }

  /**
   * Check permission status for a directory handle
   */
  async checkPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
    try {
      const permission = await handle.queryPermission({ mode: 'read' });
      return permission;
    } catch (_error) {
      // If queryPermission fails, the handle might be stale
      return 'prompt';
    }
  }

  /**
   * Request permission for a directory handle
   * This may show a permission prompt to the user
   */
  async requestPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
    try {
      const permission = await handle.requestPermission({ mode: 'read' });
      return permission;
    } catch (error) {
      throw new Error(`Failed to request permission: ${(error as Error).message}`);
    }
  }

  /**
   * Verify that a handle is still valid by attempting to access it
   */
  async verifyHandleValid(handle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      // Try to iterate the directory (without consuming the iterator)
      const iterator = handle.entries();
      await iterator.next();
      return true;
    } catch (_error) {
      return false;
    }
  }

  getCurrentDirectory(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }

  setCurrentDirectory(handle: FileSystemDirectoryHandle): void {
    this.directoryHandle = handle;
  }

  async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      throw new Error(`Failed to read file ${fileHandle.name}: ${(error as Error).message}`);
    }
  }

  async readFileAsStream(fileHandle: FileSystemFileHandle): Promise<ReadableStream<string>> {
    try {
      const file = await fileHandle.getFile();

      return new ReadableStream({
        async start(controller) {
          const streamReader = file.stream().pipeThrough(new TextDecoderStream()).getReader();

          try {
            while (true) {
              const { done, value } = await streamReader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          } finally {
            streamReader.releaseLock();
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to read file as stream ${fileHandle.name}: ${(error as Error).message}`);
    }
  }

  async findJsonlFiles(directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> {
    const jsonlFiles: FileSystemFileHandle[] = [];

    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file' && name.endsWith('.jsonl')) {
          jsonlFiles.push(handle as FileSystemFileHandle);
        }
      }
    } catch (error) {
      throw new Error(`Failed to list files in directory: ${(error as Error).message}`);
    }

    return jsonlFiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  async verifyClaudeTraceDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<boolean> {
    const jsonlFiles = await this.findJsonlFiles(directoryHandle);

    if (jsonlFiles.length === 0) {
      return false;
    }

    const logFilePattern = /^log-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.jsonl$/;
    return jsonlFiles.some(file => logFilePattern.test(file.name));
  }

  extractSessionIdFromFilename(filename: string): string | null {
    const match = filename.match(/^log-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\.jsonl$/);
    return match ? match[1] : null;
  }

  async getDirectoryInfo(directoryHandle: FileSystemDirectoryHandle): Promise<{
    name: string;
    jsonlFileCount: number;
    isClaudeTraceDirectory: boolean;
  }> {
    const jsonlFiles = await this.findJsonlFiles(directoryHandle);
    const isClaudeTraceDirectory = await this.verifyClaudeTraceDirectory(directoryHandle);

    return {
      name: directoryHandle.name,
      jsonlFileCount: jsonlFiles.length,
      isClaudeTraceDirectory
    };
  }

  async checkBrowserSupport(): Promise<{
    supported: boolean;
    reason?: string;
  }> {
    if (!('showDirectoryPicker' in window)) {
      return {
        supported: false,
        reason: 'File System Access API is not supported. Please use Chrome, Edge, or another Chromium-based browser.'
      };
    }

    return { supported: true };
  }
}

export const fileSystemService = new FileSystemService();

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }
}