// ============================================================================
// NOVA OS — GLOBAL OS ZUSTAND STORE
// Reactive bridge between the deterministic Kernel simulation and desktop UI
// ============================================================================

import { create } from 'zustand';
import { Kernel } from '../simulation/kernel/Kernel';
import type {
  WindowState,
  AppId,
  ClockSpeed,
  SchedulerAlgorithm,
  PageReplacementAlgorithm,
  DiskSchedulingAlgorithm,
  KernelEvent,
} from '../simulation/types';

export type OperatingMode = 'NORMAL' | 'LEARNING' | 'DEBUG';

interface OsStoreState {
  // Kernel Instance (Singleton)
  kernel: Kernel;

  // OS Runtime & UI Mode
  bootState: 'OFF' | 'BOOTING' | 'RUNNING' | 'SHUTDOWN';
  bootSteps: { message: string; status: 'PENDING' | 'OK' | 'FAIL' }[];
  operatingMode: OperatingMode;
  simulationTime: number;
  formattedTime: string;
  isRunning: boolean;
  speed: ClockSpeed;

  // Window Manager
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;

  // Selected Inspect Process (for Debug / PCB inspection)
  inspectedPid: number | null;

  // UI Event Stream
  recentEvents: KernelEvent[];
  lastExplanation: string | null;

  // Notification Toast
  notification: { message: string; type: 'info' | 'warn' | 'error' } | null;

  // Actions
  bootSystem: () => Promise<void>;
  shutdownSystem: () => void;
  restartSystem: () => void;
  setOperatingMode: (mode: OperatingMode) => void;
  toggleSimulation: () => void;
  stepTick: (ticks?: number) => void;
  setSpeed: (speed: ClockSpeed) => void;

  // Window Management Actions
  openWindow: (appId: AppId, title?: string, customData?: any) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;

  // Subsystem Control
  setSchedulerAlgorithm: (algo: SchedulerAlgorithm) => void;
  setMemoryReplacement: (algo: PageReplacementAlgorithm) => void;
  setDiskAlgorithm: (algo: DiskSchedulingAlgorithm) => void;
  setInspectedPid: (pid: number | null) => void;
  showNotification: (message: string, type?: 'info' | 'warn' | 'error') => void;
  clearNotification: () => void;

  // Force reactive sync from simulation tick
  syncTickState: () => void;
}

const DEFAULT_WINDOWS_CONFIG: Record<
  AppId,
  { title: string; icon: string; width: number; height: number }
> = {
  terminal: { title: 'Terminal', icon: 'Terminal', width: 680, height: 460 },
  'system-monitor': { title: 'System Monitor', icon: 'Activity', width: 780, height: 520 },
  'process-manager': { title: 'Process Manager', icon: 'Cpu', width: 800, height: 520 },
  'memory-analyzer': { title: 'Memory Analyzer', icon: 'Layers', width: 820, height: 540 },
  'scheduler-visualizer': { title: 'Scheduler Visualizer', icon: 'GitCommit', width: 840, height: 540 },
  'file-manager': { title: 'File Manager', icon: 'Folder', width: 720, height: 480 },
  'disk-analyzer': { title: 'Disk Platter Analyzer', icon: 'HardDrive', width: 760, height: 500 },
  'network-monitor': { title: 'Network Monitor', icon: 'Wifi', width: 720, height: 480 },
  'text-editor': { title: 'Text Editor', icon: 'FileText', width: 640, height: 440 },
  calculator: { title: 'Calculator', icon: 'Hash', width: 320, height: 420 },
  settings: { title: 'Settings', icon: 'Settings', width: 640, height: 480 },
  'package-manager': { title: 'Package Manager', icon: 'Box', width: 680, height: 460 },
  'deadlock-lab': { title: "Deadlock & Banker's Lab", icon: 'AlertTriangle', width: 820, height: 540 },
  'event-timeline': { title: 'Event Timeline', icon: 'Clock', width: 740, height: 480 },
  'os-scenarios': { title: 'OS Demonstration Lab', icon: 'PlayCircle', width: 760, height: 500 },
};

export const useOsStore = create<OsStoreState>((set, get) => {
  const kernel = new Kernel();

  return {
    kernel,
    bootState: 'OFF',
    bootSteps: [],
    operatingMode: 'NORMAL',
    simulationTime: 0,
    formattedTime: '00:00.000',
    isRunning: false,
    speed: 1.0,

    windows: [],
    activeWindowId: null,
    nextZIndex: 10,
    inspectedPid: null,

    recentEvents: [],
    lastExplanation: null,
    notification: null,

    bootSystem: async () => {
      const k = get().kernel;
      set({ bootState: 'BOOTING', bootSteps: [] });

      await k.boot((steps) => {
        set({ bootSteps: [...steps] });
      });

      // Subscribe to clock ticks to update store time
      k.clock.subscribe((time) => {
        get().syncTickState();
      });

      // Subscribe to event bus for recent events
      k.eventBus.subscribe('ALL', (event) => {
        set((state) => ({
          recentEvents: [event, ...state.recentEvents].slice(0, 80),
          lastExplanation: event.explanation || state.lastExplanation,
        }));
      });

      set({
        bootState: 'RUNNING',
        isRunning: k.clock.getIsRunning(),
        simulationTime: k.clock.getTime(),
        formattedTime: k.clock.getFormattedTime(),
      });

      // Open Terminal and System Monitor by default upon boot
      get().openWindow('terminal');
      get().openWindow('system-monitor');
    },

    shutdownSystem: () => {
      get().kernel.shutdown();
      set({ bootState: 'SHUTDOWN', isRunning: false, windows: [] });
    },

    restartSystem: () => {
      get().kernel.restart();
      set({ bootState: 'BOOTING', windows: [] });
      get().bootSystem();
    },

    setOperatingMode: (mode) => {
      set({ operatingMode: mode });
    },

    toggleSimulation: () => {
      const k = get().kernel;
      const isRunning = k.clock.toggle();
      set({ isRunning });
    },

    stepTick: (ticks = 1) => {
      const k = get().kernel;
      k.clock.stepTick(ticks);
      get().syncTickState();
    },

    setSpeed: (speed) => {
      const k = get().kernel;
      k.clock.setSpeed(speed);
      set({ speed });
    },

    openWindow: (appId, title, customData) => {
      const conf = DEFAULT_WINDOWS_CONFIG[appId] || {
        title: appId,
        icon: 'Square',
        width: 600,
        height: 400,
      };

      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        // Un-minimize and bring to front if already open
        get().focusWindow(existing.id);
        if (existing.isMinimized) {
          set((state) => ({
            windows: state.windows.map((w) =>
              w.id === existing.id ? { ...w, isMinimized: false } : w
            ),
          }));
        }
        return existing.id;
      }

      const id = `win-${appId}-${Date.now()}`;
      const zIndex = get().nextZIndex + 1;
      const offset = (get().windows.length * 28) % 180;

      const newWindow: WindowState = {
        id,
        appId,
        title: title || conf.title,
        icon: conf.icon,
        x: Math.max(40, 100 + offset),
        y: Math.max(30, 60 + offset),
        width: conf.width,
        height: conf.height,
        isMinimized: false,
        isMaximized: false,
        zIndex,
        customData,
      };

      // Also create simulated process for this application window!
      const proc = get().kernel.processManager.createProcess(
        appId,
        `/${appId}`,
        'MIXED',
        { timestamp: get().kernel.clock.getTime() }
      );
      newWindow.associatedPid = proc.getPid();

      set((state) => ({
        windows: [...state.windows, newWindow],
        activeWindowId: id,
        nextZIndex: zIndex + 1,
      }));

      return id;
    },

    closeWindow: (id) => {
      const win = get().windows.find((w) => w.id === id);
      if (win && win.associatedPid) {
        // Terminate associated application process
        get().kernel.processManager.terminateProcess(
          win.associatedPid,
          0,
          get().kernel.clock.getTime()
        );
      }

      set((state) => ({
        windows: state.windows.filter((w) => w.id !== id),
        activeWindowId:
          state.activeWindowId === id
            ? state.windows.find((w) => w.id !== id)?.id || null
            : state.activeWindowId,
      }));
    },

    minimizeWindow: (id) => {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, isMinimized: true } : w
        ),
        activeWindowId:
          state.activeWindowId === id ? null : state.activeWindowId,
      }));
    },

    maximizeWindow: (id) => {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        ),
      }));
    },

    focusWindow: (id) => {
      const zIndex = get().nextZIndex + 1;
      set((state) => ({
        activeWindowId: id,
        nextZIndex: zIndex,
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, zIndex, isMinimized: false } : w
        ),
      }));
    },

    updateWindowPosition: (id, x, y) => {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, x, y } : w
        ),
      }));
    },

    updateWindowSize: (id, width, height) => {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, width, height } : w
        ),
      }));
    },

    setSchedulerAlgorithm: (algo) => {
      get().kernel.scheduler.setAlgorithm(algo);
      get().syncTickState();
    },

    setMemoryReplacement: (algo) => {
      get().kernel.memoryManager.setReplacementAlgorithm(algo);
      get().syncTickState();
    },

    setDiskAlgorithm: (algo) => {
      get().kernel.disk.setAlgorithm(algo);
      get().syncTickState();
    },

    setInspectedPid: (pid) => {
      set({ inspectedPid: pid });
    },

    showNotification: (message, type = 'info') => {
      set({ notification: { message, type } });
      setTimeout(() => {
        if (get().notification?.message === message) {
          set({ notification: null });
        }
      }, 4000);
    },

    clearNotification: () => {
      set({ notification: null });
    },

    syncTickState: () => {
      const k = get().kernel;
      set({
        simulationTime: k.clock.getTime(),
        formattedTime: k.clock.getFormattedTime(),
        isRunning: k.clock.getIsRunning(),
      });
    },
  };
});
