// ============================================================================
// NOVA OS — DESKTOP ECOSYSTEM & WINDOW STORE TEST SUITE
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useOsStore } from '../store/osStore';

describe('Desktop Ecosystem Store & Process Integration', () => {
  beforeEach(() => {
    // Reset store windows and state
    const state = useOsStore.getState();
    for (const win of [...state.windows]) {
      state.closeWindow(win.id);
    }
  });

  it('opens application window and spawns simulated process with PID', () => {
    const store = useOsStore.getState();
    const winId = store.openWindow('browser');
    expect(winId).toBeDefined();

    const win = useOsStore.getState().windows.find((w) => w.id === winId);
    expect(win).toBeDefined();
    expect(win?.appId).toBe('browser');
    expect(win?.associatedPid).toBeDefined();

    // Verify PCB exists in process manager
    const proc = store.kernel.processManager.getProcess(win!.associatedPid!);
    expect(proc).toBeDefined();
    expect(proc?.getName()).toBe('nova-browser');
  });

  it('dispatches openFile to correct application with customData path', () => {
    const store = useOsStore.getState();
    
    // Open markdown document
    const docWinId = store.openFile('/home/nova/Documents/NOVA_OS_Guide.md');
    expect(docWinId).not.toBeNull();

    const docWin = useOsStore.getState().windows.find((w) => w.id === docWinId);
    expect(docWin?.appId).toBe('document-viewer');
    expect(docWin?.customData?.path).toBe('/home/nova/Documents/NOVA_OS_Guide.md');

    // Open image document
    const imgWinId = store.openFile('/home/nova/Pictures/nova_logo.svg');
    expect(imgWinId).not.toBeNull();

    const imgWin = useOsStore.getState().windows.find((w) => w.id === imgWinId);
    expect(imgWin?.appId).toBe('image-viewer');
    expect(imgWin?.customData?.path).toBe('/home/nova/Pictures/nova_logo.svg');
  });

  it('updates wallpaper state dynamically', () => {
    const store = useOsStore.getState();
    expect(store.wallpaper).toBe('dark-obsidian');

    store.setWallpaper('cyber-matrix');
    expect(useOsStore.getState().wallpaper).toBe('cyber-matrix');

    store.setWallpaper('deep-space');
    expect(useOsStore.getState().wallpaper).toBe('deep-space');
  });

  it('terminates associated process when application window is closed', () => {
    const store = useOsStore.getState();
    const winId = store.openWindow('media-player');
    const win = useOsStore.getState().windows.find((w) => w.id === winId);
    const pid = win!.associatedPid!;

    expect(store.kernel.processManager.getProcess(pid)?.getState()).not.toBe('TERMINATED');

    store.closeWindow(winId);

    // Process should be terminated
    const proc = store.kernel.processManager.getProcess(pid);
    expect(proc?.getState()).toBe('TERMINATED');
  });
});
