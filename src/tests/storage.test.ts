import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../storage/BrowserStorage';
import { PortableStorageManager } from '../storage/PortableStorage';
import { Kernel } from '../simulation/kernel/Kernel';

describe('Phase 7 — Storage Abstraction & Portable USB Mode', () => {
  it('saves, lists, and loads checkpoints through StorageProvider', async () => {
    const memoryStore = new MemoryStorage();
    const manager = new PortableStorageManager(memoryStore);

    const checkpoint = {
      id: 'test-chk-1',
      name: 'Initial Clean State',
      timestamp: 1700000000000,
      version: '1.0.0',
      vfsSnapshot: {
        files: [{ path: '/home/nova/test.txt', content: 'Sample text', permissions: 644 }],
      },
      kernelConfig: {
        schedulerAlgorithm: 'RR',
        pageReplacementAlgorithm: 'LRU',
        cores: 4,
      },
      installedPackages: ['htop'],
      userPreferences: {},
    };

    expect(await manager.save(checkpoint)).toBe(true);

    const list = await manager.list();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('test-chk-1');

    const loaded = await manager.load('test-chk-1');
    expect(loaded?.name).toBe('Initial Clean State');
  });

  it('captures live kernel state and restores successfully', async () => {
    const memoryStore = new MemoryStorage();
    const manager = new PortableStorageManager(memoryStore);
    const kernel = new Kernel();

    // Modify a scheduler setting and create a file
    kernel.scheduler.setAlgorithm('SJF');
    kernel.vfs.writeFile('/home/nova/my_script.sh', 'echo "test"', 1000, 1000, 755);

    // Capture checkpoint
    const snapshot = manager.captureCheckpoint(kernel, 'SJF Snapshot');
    expect(snapshot.kernelConfig.schedulerAlgorithm).toBe('SJF');

    // Switch algorithm to MLFQ
    kernel.scheduler.setAlgorithm('MLFQ');
    expect(kernel.scheduler.getAlgorithm()).toBe('MLFQ');

    // Restore checkpoint
    const success = manager.restoreCheckpoint(kernel, snapshot);
    expect(success).toBe(true);
    expect(kernel.scheduler.getAlgorithm()).toBe('SJF');
  });

  it('mounts virtual USB partition on /mnt/usb', () => {
    const kernel = new Kernel();
    const manager = new PortableStorageManager(new MemoryStorage());

    expect(manager.isMounted()).toBe(false);
    manager.mountUsb(kernel);
    expect(manager.isMounted()).toBe(true);

    const autorun = kernel.vfs.readFile('/mnt/usb/autorun.inf');
    expect(autorun).toContain('NOVA_PORTABLE_32GB');

    manager.unmountUsb(kernel);
    expect(manager.isMounted()).toBe(false);
  });
});
