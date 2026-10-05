// ============================================================================
// NOVA OS — PORTABLE USB STORAGE & SNAPSHOT RESTORATION
// Simulates USB thumb drive mounting (/mnt/usb) and JSON bundle serialization
// ============================================================================

import type { StorageProvider, SystemCheckpoint } from './StorageProvider';
import { BrowserStorage } from './BrowserStorage';
import type { Kernel } from '../simulation/kernel/Kernel';

export class PortableStorageManager {
  private provider: StorageProvider;
  private isUsbMounted: boolean = false;
  private usbVolumeLabel: string = 'NOVA_PORTABLE_32GB';

  constructor(provider?: StorageProvider) {
    this.provider = provider || new BrowserStorage();
  }

  public setProvider(provider: StorageProvider): void {
    this.provider = provider;
  }

  public getProvider(): StorageProvider {
    return this.provider;
  }

  public isMounted(): boolean {
    return this.isUsbMounted;
  }

  public getVolumeLabel(): string {
    return this.usbVolumeLabel;
  }

  public mountUsb(kernel: Kernel): boolean {
    this.isUsbMounted = true;
    kernel.vfs.mkdir('/mnt', 755, 0, 0);
    kernel.vfs.mkdir('/mnt/usb', 755, 0, 0);
    kernel.vfs.writeFile(
      '/mnt/usb/autorun.inf',
      `[AutoRun]\nlabel=${this.usbVolumeLabel}\nopen=nova-boot.sh\nicon=nova.ico\n`,
      0,
      0,
      644
    );
    kernel.eventBus.emit(
      'DISK_COMPLETE',
      'disk',
      'USBController',
      `USB Storage mounted: ${this.usbVolumeLabel} on /mnt/usb`,
      kernel.clock.getTime(),
      { metadata: { mountPoint: '/mnt/usb', label: this.usbVolumeLabel } }
    );
    return true;
  }

  public unmountUsb(kernel: Kernel): void {
    this.isUsbMounted = false;
    kernel.eventBus.emit(
      'DISK_COMPLETE',
      'disk',
      'USBController',
      `USB Storage unmounted from /mnt/usb`,
      kernel.clock.getTime(),
      { metadata: { mountPoint: '/mnt/usb' } }
    );
  }

  /**
   * Captures the entire running system state into a portable checkpoint
   */
  public captureCheckpoint(kernel: Kernel, name: string, notes?: string): SystemCheckpoint {
    const userFiles: { path: string; content: string; permissions: number }[] = [];

    // Capture files in /home/nova
    const homeNode = kernel.vfs.findNode('/home/nova');
    if (homeNode) {
      for (const [filename] of homeNode.children) {
        const fullPath = `/home/nova/${filename}`;
        const content = kernel.vfs.readFile(fullPath);
        if (content !== null) {
          userFiles.push({
            path: fullPath,
            content,
            permissions: 644,
          });
        }
      }
    }

    const checkpoint: SystemCheckpoint = {
      id: `chk-${Date.now()}`,
      name,
      timestamp: Date.now(),
      version: '1.0.0-portable',
      vfsSnapshot: {
        files: userFiles,
      },
      kernelConfig: {
        schedulerAlgorithm: kernel.scheduler.getAlgorithm(),
        pageReplacementAlgorithm: kernel.memoryManager.getReplacementAlgorithm(),
        cores: kernel.cpu.getCores().length,
      },
      installedPackages: ['htop', 'vim', 'curl', 'git', 'python3', 'gcc'],
      userPreferences: {
        theme: 'dark-obsidian',
        accentColor: '#38BDF8',
      },
      notes,
    };

    return checkpoint;
  }

  /**
   * Restores a checkpoint back into the live Kernel
   */
  public restoreCheckpoint(kernel: Kernel, checkpoint: SystemCheckpoint): boolean {
    try {
      // 1. Restore configuration
      if (checkpoint.kernelConfig) {
        kernel.scheduler.setAlgorithm(checkpoint.kernelConfig.schedulerAlgorithm as any);
        kernel.memoryManager.setReplacementAlgorithm(checkpoint.kernelConfig.pageReplacementAlgorithm as any);
      }

      // 2. Restore user files
      if (checkpoint.vfsSnapshot?.files) {
        for (const file of checkpoint.vfsSnapshot.files) {
          kernel.vfs.writeFile(file.path, file.content, 1000, 1000, file.permissions || 644);
        }
      }

      // 3. Emit kernel event
      kernel.eventBus.emit(
        'SYSTEM_BOOT',
        'kernel',
        'PortableStorage',
        `System state restored from checkpoint: ${checkpoint.name}`,
        kernel.clock.getTime(),
        { metadata: { checkpointId: checkpoint.id, name: checkpoint.name } }
      );

      return true;
    } catch (e) {
      console.error('Failed to restore checkpoint', e);
      return false;
    }
  }

  public async save(checkpoint: SystemCheckpoint): Promise<boolean> {
    return this.provider.saveCheckpoint(checkpoint);
  }

  public async list(): Promise<SystemCheckpoint[]> {
    return this.provider.listCheckpoints();
  }

  public async load(id: string): Promise<SystemCheckpoint | null> {
    return this.provider.loadCheckpoint(id);
  }

  public async delete(id: string): Promise<boolean> {
    return this.provider.deleteCheckpoint(id);
  }

  public async exportFile(): Promise<string> {
    return this.provider.exportBundle();
  }

  public async importFile(jsonString: string): Promise<boolean> {
    return this.provider.importBundle(jsonString);
  }
}

export const portableStorage = new PortableStorageManager();
