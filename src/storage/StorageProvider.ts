// ============================================================================
// NOVA OS — PORTABLE STORAGE ABSTRACTION & CHECKPOINTS
// Provider interface for ephemeral memory, browser localStorage, and portable USB mode
// ============================================================================

export interface SystemCheckpoint {
  id: string;
  name: string;
  timestamp: number;
  version: string;
  vfsSnapshot: {
    files: { path: string; content: string; permissions: number }[];
  };
  kernelConfig: {
    schedulerAlgorithm: string;
    pageReplacementAlgorithm: string;
    cores: number;
  };
  installedPackages: string[];
  userPreferences: Record<string, any>;
  notes?: string;
}

export interface StorageProvider {
  readonly type: 'MEMORY' | 'BROWSER' | 'PORTABLE_USB';
  saveCheckpoint(checkpoint: SystemCheckpoint): Promise<boolean>;
  loadCheckpoint(id: string): Promise<SystemCheckpoint | null>;
  listCheckpoints(): Promise<SystemCheckpoint[]>;
  deleteCheckpoint(id: string): Promise<boolean>;
  exportBundle(): Promise<string>;
  importBundle(jsonString: string): Promise<boolean>;
}
