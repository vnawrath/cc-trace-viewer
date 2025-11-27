/**
 * Storage Service for persisting FileSystemDirectoryHandle using IndexedDB
 * 
 * The File System Access API allows handles to be stored in IndexedDB,
 * enabling persistence across page reloads. Permissions are also persisted
 * by the browser, though we need to check/request them when restoring.
 */

const DB_NAME = 'cc-trace-viewer-db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const DIRECTORY_HANDLE_KEY = 'claude-trace-directory-handle';

export class StorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  /**
   * Save directory handle to IndexedDB
   */
  async saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, DIRECTORY_HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save directory handle'));
    });
  }

  /**
   * Load directory handle from IndexedDB
   */
  async loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DIRECTORY_HANDLE_KEY);

      request.onsuccess = () => {
        const handle = request.result as FileSystemDirectoryHandle | undefined;
        resolve(handle || null);
      };

      request.onerror = () => reject(new Error('Failed to load directory handle'));
    });
  }

  /**
   * Clear saved directory handle
   */
  async clearDirectoryHandle(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(DIRECTORY_HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear directory handle'));
    });
  }

  /**
   * Check if a directory handle is saved
   */
  async hasDirectoryHandle(): Promise<boolean> {
    const handle = await this.loadDirectoryHandle();
    return handle !== null;
  }
}

export const storageService = new StorageService();

