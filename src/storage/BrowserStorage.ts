// ============================================================================
// NOVA OS — BROWSER & IN-MEMORY STORAGE PROVIDERS
// ============================================================================

import type { StorageProvider, SystemCheckpoint } from './StorageProvider';

export class MemoryStorage implements StorageProvider {
  public readonly type = 'MEMORY';
  private checkpoints: Map<string, SystemCheckpoint> = new Map();

  public async saveCheckpoint(checkpoint: SystemCheckpoint): Promise<boolean> {
    this.checkpoints.set(checkpoint.id, checkpoint);
    return true;
  }

  public async loadCheckpoint(id: string): Promise<SystemCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  public async listCheckpoints(): Promise<SystemCheckpoint[]> {
    return Array.from(this.checkpoints.values());
  }

  public async deleteCheckpoint(id: string): Promise<boolean> {
    return this.checkpoints.delete(id);
  }

  public async exportBundle(): Promise<string> {
    return JSON.stringify(Array.from(this.checkpoints.values()), null, 2);
  }

  public async importBundle(jsonString: string): Promise<boolean> {
    try {
      const data: SystemCheckpoint[] = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        for (const item of data) {
          this.checkpoints.set(item.id, item);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export class BrowserStorage implements StorageProvider {
  public readonly type = 'BROWSER';
  private readonly storageKey = 'nova_os_checkpoints_v1';

  private getStorageMap(): Record<string, SystemCheckpoint> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveStorageMap(map: Record<string, SystemCheckpoint>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(map));
    } catch (e) {
      console.warn('Storage quota exceeded or unavailable', e);
    }
  }

  public async saveCheckpoint(checkpoint: SystemCheckpoint): Promise<boolean> {
    const map = this.getStorageMap();
    map[checkpoint.id] = checkpoint;
    this.saveStorageMap(map);
    return true;
  }

  public async loadCheckpoint(id: string): Promise<SystemCheckpoint | null> {
    const map = this.getStorageMap();
    return map[id] || null;
  }

  public async listCheckpoints(): Promise<SystemCheckpoint[]> {
    const map = this.getStorageMap();
    return Object.values(map);
  }

  public async deleteCheckpoint(id: string): Promise<boolean> {
    const map = this.getStorageMap();
    if (map[id]) {
      delete map[id];
      this.saveStorageMap(map);
      return true;
    }
    return false;
  }

  public async exportBundle(): Promise<string> {
    const map = this.getStorageMap();
    return JSON.stringify(Object.values(map), null, 2);
  }

  public async importBundle(jsonString: string): Promise<boolean> {
    try {
      const items: SystemCheckpoint[] = JSON.parse(jsonString);
      if (Array.isArray(items)) {
        const map = this.getStorageMap();
        for (const it of items) {
          map[it.id] = it;
        }
        this.saveStorageMap(map);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
