// ============================================================================
// NOVA OS — APPLICATION REGISTRY & MIME DISPATCH
// Centralized metadata, file associations, process profiles, and desktop defaults
// ============================================================================

import type { AppId, WorkloadType } from '../types';

export type AppCategory =
  | 'System'
  | 'Internet'
  | 'Productivity'
  | 'Media'
  | 'Developer'
  | 'Kernel Lab'
  | 'Personal';

export interface AppMetadata {
  id: AppId;
  name: string;
  category: AppCategory;
  processName: string;
  version: string;
  description: string;
  icon: string; // Lucide icon name
  accentColor: string;
  defaultWidth: number;
  defaultHeight: number;
  workloadProfile: {
    workloadType: WorkloadType;
    memoryMb: number;
    priority: number;
    description: string;
  };
  supportedExtensions: string[];
  supportedMimeTypes: string[];
  isPinnedToDock: boolean;
  isDesktopShortcut: boolean;
  isSystemCore: boolean;
}

export const APPLICATION_REGISTRY: Record<AppId, AppMetadata> = {
  browser: {
    id: 'browser',
    name: 'NOVA Browser',
    category: 'Internet',
    processName: 'nova-browser',
    version: '2.4.0',
    description: 'High-speed sandboxed web browser with multi-tab simulation, packet telemetry, and verified project portal',
    icon: 'Globe',
    accentColor: '#38BDF8',
    defaultWidth: 920,
    defaultHeight: 580,
    workloadProfile: {
      workloadType: 'MIXED',
      memoryMb: 186,
      priority: 25,
      description: 'Tab rendering, DOM parsing, WebSocket streams, and network packet handling',
    },
    supportedExtensions: ['html', 'htm', 'url'],
    supportedMimeTypes: ['text/html', 'application/x-url'],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'file-manager': {
    id: 'file-manager',
    name: 'File Manager',
    category: 'System',
    processName: 'nova-files',
    version: '1.8.2',
    description: 'Unix inode browser, permissions manager, breadcrumb navigation, and trash recovery',
    icon: 'Folder',
    accentColor: '#F59E0B',
    defaultWidth: 760,
    defaultHeight: 500,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 64,
      priority: 28,
      description: 'Directory traversal, inode metadata reads, and VFS tree updates',
    },
    supportedExtensions: ['dir', 'folder'],
    supportedMimeTypes: ['inode/directory'],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    category: 'System',
    processName: 'bash',
    version: '5.2.15',
    description: 'Linux-compatible command line with pipes, redirection, signals, and background jobs',
    icon: 'Terminal',
    accentColor: '#06B6D4',
    defaultWidth: 720,
    defaultHeight: 480,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 48,
      priority: 20,
      description: 'Interactive shell command interpreter and process supervisor',
    },
    supportedExtensions: ['sh', 'bash', 'zsh'],
    supportedMimeTypes: ['application/x-sh', 'text/x-shellscript'],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'text-editor': {
    id: 'text-editor',
    name: 'Text Editor',
    category: 'Productivity',
    processName: 'nova-editor',
    version: '3.1.0',
    description: 'Clean code and document editor with line numbering, file permissions check, and dirty buffer tracking',
    icon: 'FileText',
    accentColor: '#94A3B8',
    defaultWidth: 680,
    defaultHeight: 480,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 52,
      priority: 32,
      description: 'File buffer manipulation, syntax parsing, and disk flush',
    },
    supportedExtensions: ['txt', 'c', 'h', 'py', 'json', 'ts', 'js', 'log', 'conf', 'cfg', 'csv'],
    supportedMimeTypes: ['text/plain', 'text/x-c', 'application/json', 'text/javascript'],
    isPinnedToDock: true,
    isDesktopShortcut: false,
    isSystemCore: true,
  },
  'document-viewer': {
    id: 'document-viewer',
    name: 'Document Viewer',
    category: 'Productivity',
    processName: 'doc-viewer',
    version: '1.2.0',
    description: 'Formatted technical specification and PDF handbook reader with outline index and search',
    icon: 'BookOpen',
    accentColor: '#6366F1',
    defaultWidth: 740,
    defaultHeight: 520,
    workloadProfile: {
      workloadType: 'MEMORY_INTENSIVE',
      memoryMb: 80,
      priority: 35,
      description: 'Document page layout rasterization and font glyph cache',
    },
    supportedExtensions: ['pdf', 'doc', 'docx', 'rtf', 'md'],
    supportedMimeTypes: ['application/pdf', 'application/msword', 'text/markdown'],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'image-viewer': {
    id: 'image-viewer',
    name: 'Image Viewer',
    category: 'Media',
    processName: 'image-viewer',
    version: '2.0.1',
    description: 'Hardware-accelerated image canvas with zoom, pan, rotation, and color histogram telemetry',
    icon: 'Image',
    accentColor: '#10B981',
    defaultWidth: 680,
    defaultHeight: 480,
    workloadProfile: {
      workloadType: 'MEMORY_INTENSIVE',
      memoryMb: 72,
      priority: 34,
      description: 'Image pixel decoding, SVG vector rasterization, and framebuffer scaling',
    },
    supportedExtensions: ['png', 'jpg', 'jpeg', 'svg', 'webp', 'bmp', 'ico'],
    supportedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'media-player': {
    id: 'media-player',
    name: 'Media Player',
    category: 'Media',
    processName: 'nova-media',
    version: '1.5.0',
    description: 'Audio streaming and Web Audio API synthesizer with live real-time frequency spectrum visualizer',
    icon: 'Music',
    accentColor: '#EC4899',
    defaultWidth: 640,
    defaultHeight: 460,
    workloadProfile: {
      workloadType: 'MIXED',
      memoryMb: 96,
      priority: 22,
      description: 'Audio PCM decoding, 1024-point FFT binning, and canvas render loop',
    },
    supportedExtensions: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'mp4'],
    supportedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4'],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'archive-manager': {
    id: 'archive-manager',
    name: 'Archive Manager',
    category: 'System',
    processName: 'archive-tool',
    version: '1.4.0',
    description: 'Package archiver supporting virtual TAR, GZ, and ZIP compression and extraction',
    icon: 'Package',
    accentColor: '#EAB308',
    defaultWidth: 620,
    defaultHeight: 440,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 60,
      priority: 30,
      description: 'Deflate algorithm data compression and CRC32 checksum hashing',
    },
    supportedExtensions: ['zip', 'tar', 'gz', 'tgz', 'bz2'],
    supportedMimeTypes: ['application/zip', 'application/x-tar', 'application/gzip'],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'download-manager': {
    id: 'download-manager',
    name: 'Download Manager',
    category: 'Internet',
    processName: 'downloadd',
    version: '1.1.0',
    description: 'Real-time network transfer dashboard tracking simulated socket throughput and disk buffer flush',
    icon: 'Download',
    accentColor: '#0EA5E9',
    defaultWidth: 640,
    defaultHeight: 420,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 40,
      priority: 26,
      description: 'TCP chunk assembly and disk write-back caching',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'software-center': {
    id: 'software-center',
    name: 'Software Center',
    category: 'System',
    processName: 'software-store',
    version: '2.1.0',
    description: 'Graphical package repository manager with simulated dependency resolution and package installation',
    icon: 'ShoppingBag',
    accentColor: '#A855F7',
    defaultWidth: 780,
    defaultHeight: 520,
    workloadProfile: {
      workloadType: 'MIXED',
      memoryMb: 85,
      priority: 28,
      description: 'Repository index synchronization, dependency graph check, and payload extraction',
    },
    supportedExtensions: ['deb', 'pkg', 'nova'],
    supportedMimeTypes: ['application/vnd.debian.binary-package'],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'system-info': {
    id: 'system-info',
    name: 'System Information',
    category: 'System',
    processName: 'sysinfo',
    version: '1.0.0',
    description: 'Hardware architecture overview, kernel version, memory frame capacity, and system uptime',
    icon: 'Info',
    accentColor: '#38BDF8',
    defaultWidth: 580,
    defaultHeight: 440,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 32,
      priority: 40,
      description: 'Query kernel telemetry tables and format hardware summary',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: true,
  },
  'help-docs': {
    id: 'help-docs',
    name: 'Help & Documentation',
    category: 'Productivity',
    processName: 'nova-help',
    version: '2.0.0',
    description: 'Comprehensive operating systems laboratory handbook, command reference, and architecture guide',
    icon: 'HelpCircle',
    accentColor: '#14B8A6',
    defaultWidth: 800,
    defaultHeight: 540,
    workloadProfile: {
      workloadType: 'MEMORY_INTENSIVE',
      memoryMb: 50,
      priority: 38,
      description: 'Handbook search index lookup and Markdown rendering',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    category: 'Productivity',
    processName: 'calc',
    version: '1.3.0',
    description: 'Programmer and scientific desktop calculator with Base-2, Base-10, Base-16 conversions',
    icon: 'Hash',
    accentColor: '#64748B',
    defaultWidth: 320,
    defaultHeight: 440,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 24,
      priority: 45,
      description: 'Floating point arithmetic and bitwise radix shifts',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar & Clock',
    category: 'Productivity',
    processName: 'nova-clock',
    version: '1.2.0',
    description: 'Simulation time tracking, world clock zones, countdown timer, and schedule events',
    icon: 'Calendar',
    accentColor: '#F43F5E',
    defaultWidth: 540,
    defaultHeight: 440,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 28,
      priority: 40,
      description: 'Clock tick timer subscription and epoch date calculations',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    category: 'Productivity',
    processName: 'nova-notes',
    version: '1.0.0',
    description: 'Fast desktop scratchpad with persistent auto-save to /home/nova/Documents/notes.txt',
    icon: 'FileEdit',
    accentColor: '#FBBF24',
    defaultWidth: 420,
    defaultHeight: 400,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 36,
      priority: 35,
      description: 'Auto-save buffer sync to VFS',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: false,
  },
  'system-monitor': {
    id: 'system-monitor',
    name: 'System Monitor',
    category: 'System',
    processName: 'sysmon',
    version: '2.5.0',
    description: 'Real-time multi-core CPU usage, physical memory allocation, disk seeks, and network interface rates',
    icon: 'Activity',
    accentColor: '#34D399',
    defaultWidth: 780,
    defaultHeight: 520,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 65,
      priority: 18,
      description: 'Kernel metrics polling, history ring buffer rotation, and SVG telemetry rendering',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'process-manager': {
    id: 'process-manager',
    name: 'Process Manager',
    category: 'System',
    processName: 'procman',
    version: '2.2.0',
    description: 'Process Control Block (PCB) inspector, signal dispatcher (SIGKILL, SIGTERM), and process tree hierarchy',
    icon: 'Cpu',
    accentColor: '#F472B6',
    defaultWidth: 800,
    defaultHeight: 520,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 70,
      priority: 15,
      description: 'PCB table walk, state aggregation, and signal dispatch',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'scheduler-visualizer': {
    id: 'scheduler-visualizer',
    name: 'Scheduler Lab',
    category: 'Kernel Lab',
    processName: 'sched-lab',
    version: '3.0.0',
    description: 'Live interactive Gantt chart comparing Round Robin, Shortest Job First, SRTF, and Multi-Level Feedback Queues',
    icon: 'GitCommit',
    accentColor: '#FBBF24',
    defaultWidth: 840,
    defaultHeight: 540,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 80,
      priority: 16,
      description: 'Queue pipeline simulation, quantum countdown, and turnaround/waiting time statistics',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'memory-analyzer': {
    id: 'memory-analyzer',
    name: 'Memory Analyzer',
    category: 'Kernel Lab',
    processName: 'mmu-analyzer',
    version: '3.2.0',
    description: '4KB paged virtual memory architecture, 524,288 frame buffer, MMU translation, and 8-stage page fault pipeline',
    icon: 'Layers',
    accentColor: '#A78BFA',
    defaultWidth: 840,
    defaultHeight: 550,
    workloadProfile: {
      workloadType: 'MEMORY_INTENSIVE',
      memoryMb: 95,
      priority: 14,
      description: 'Frame map density mapping, page table traversal, and TLB hit ratio telemetry',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'sync-lab': {
    id: 'sync-lab',
    name: 'Concurrency Lab',
    category: 'Kernel Lab',
    processName: 'sync-lab',
    version: '2.0.0',
    description: 'Dijkstra Counting Semaphores, Mutexes, Dining Philosophers, and Bounded Buffer Producer-Consumer',
    icon: 'Utensils',
    accentColor: '#EC4899',
    defaultWidth: 840,
    defaultHeight: 550,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 75,
      priority: 15,
      description: 'Mutex lock handoff, semaphore waiting queue rotation, and critical section verification',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'deadlock-lab': {
    id: 'deadlock-lab',
    name: 'Banker’s Lab',
    category: 'Kernel Lab',
    processName: 'banker-lab',
    version: '2.1.0',
    description: 'Resource Allocation Graph (RAG), Tarjan cycle detector, and Edsger Dijkstra Banker’s Safety Algorithm',
    icon: 'AlertTriangle',
    accentColor: '#EF4444',
    defaultWidth: 820,
    defaultHeight: 540,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 68,
      priority: 17,
      description: 'Matrix safety evaluation and deadlock cycle graph rendering',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'disk-analyzer': {
    id: 'disk-analyzer',
    name: 'Disk Elevator',
    category: 'Kernel Lab',
    processName: 'disk-lab',
    version: '2.0.0',
    description: 'Rotational platter cylinder seek visualizer with SCAN, LOOK, and SSTF elevator algorithms',
    icon: 'HardDrive',
    accentColor: '#FB923C',
    defaultWidth: 760,
    defaultHeight: 500,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 55,
      priority: 24,
      description: 'Actuator arm position computation and request queue optimization',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'network-monitor': {
    id: 'network-monitor',
    name: 'Network Monitor',
    category: 'Kernel Lab',
    processName: 'netmon',
    version: '1.9.0',
    description: 'Virtual eth0 network interface telemetry, packet transmission stream, and ICMP ping tool',
    icon: 'Wifi',
    accentColor: '#818CF8',
    defaultWidth: 720,
    defaultHeight: 480,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 50,
      priority: 25,
      description: 'Socket buffer monitoring and packet header parsing',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'os-scenarios': {
    id: 'os-scenarios',
    name: 'OS Scenarios',
    category: 'Kernel Lab',
    processName: 'scenarios',
    version: '2.0.0',
    description: '1-click academic lab demonstrations simulating Thrashing, CPU Bursts, Deadlocks, and I/O bottlenecks',
    icon: 'PlayCircle',
    accentColor: '#10B981',
    defaultWidth: 760,
    defaultHeight: 500,
    workloadProfile: {
      workloadType: 'MIXED',
      memoryMb: 60,
      priority: 20,
      description: 'Multi-workload generator orchestrator',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'event-timeline': {
    id: 'event-timeline',
    name: 'Event Timeline',
    category: 'Kernel Lab',
    processName: 'audit-log',
    version: '1.5.0',
    description: 'Chronological audit log of all hardware interrupts, system calls, page faults, and context switches',
    icon: 'Clock',
    accentColor: '#06B6D4',
    defaultWidth: 740,
    defaultHeight: 480,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 45,
      priority: 30,
      description: 'Kernel event bus event listener and causal chain tracer',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: true,
  },
  'project-hub': {
    id: 'project-hub',
    name: "Harsh's Project Hub",
    category: 'Personal',
    processName: 'project-hub',
    version: '3.0.0',
    description: 'Engineering portfolio with verified live deployments, GitHub repositories, and live simulated workload processes',
    icon: 'FolderGit2',
    accentColor: '#38BDF8',
    defaultWidth: 860,
    defaultHeight: 560,
    workloadProfile: {
      workloadType: 'MIXED',
      memoryMb: 110,
      priority: 15,
      description: 'Portfolio project supervisor and verified deployment launcher',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
  'package-manager': {
    id: 'package-manager',
    name: 'CLI Package Manager',
    category: 'Developer',
    processName: 'pkg-tool',
    version: '1.2.0',
    description: 'Command line interface for package dependencies and virtual binary installations',
    icon: 'Box',
    accentColor: '#E879F9',
    defaultWidth: 680,
    defaultHeight: 460,
    workloadProfile: {
      workloadType: 'CPU_BOUND',
      memoryMb: 42,
      priority: 30,
      description: 'APT-style package database parser',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: false,
    isDesktopShortcut: false,
    isSystemCore: true,
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    category: 'System',
    processName: 'settings-daemon',
    version: '2.0.0',
    description: 'System appearance, CPU multi-core configuration, RAM sizing, network parameters, and user sessions',
    icon: 'Settings',
    accentColor: '#64748B',
    defaultWidth: 680,
    defaultHeight: 500,
    workloadProfile: {
      workloadType: 'IO_BOUND',
      memoryMb: 48,
      priority: 35,
      description: 'System configuration reader and kernel tuning applicator',
    },
    supportedExtensions: [],
    supportedMimeTypes: [],
    isPinnedToDock: true,
    isDesktopShortcut: true,
    isSystemCore: true,
  },
};

/**
 * MIME & File Extension Dispatcher
 */
export function getAppForFile(filename: string): AppMetadata {
  const parts = filename.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1] : '';

  // Look for exact extension match in registry
  for (const app of Object.values(APPLICATION_REGISTRY)) {
    if (app.supportedExtensions.includes(ext)) {
      return app;
    }
  }

  // Fallbacks based on common heuristics
  if (['pdf', 'doc', 'docx', 'md'].includes(ext)) {
    return APPLICATION_REGISTRY['document-viewer'];
  }
  if (['txt', 'c', 'h', 'sh', 'py', 'json', 'log', 'conf', 'csv'].includes(ext)) {
    return APPLICATION_REGISTRY['text-editor'];
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'bmp'].includes(ext)) {
    return APPLICATION_REGISTRY['image-viewer'];
  }
  if (['mp3', 'wav', 'ogg', 'mp4'].includes(ext)) {
    return APPLICATION_REGISTRY['media-player'];
  }
  if (['zip', 'tar', 'gz', 'tgz'].includes(ext)) {
    return APPLICATION_REGISTRY['archive-manager'];
  }
  if (['html', 'htm'].includes(ext)) {
    return APPLICATION_REGISTRY['browser'];
  }

  // Default to Text Editor
  return APPLICATION_REGISTRY['text-editor'];
}

/**
 * Filter applications by category
 */
export function getAppsByCategory(category: AppCategory | 'All'): AppMetadata[] {
  const all = Object.values(APPLICATION_REGISTRY);
  if (category === 'All') return all;
  return all.filter((app) => app.category === category);
}

/**
 * Search applications by query
 */
export function searchApps(query: string): AppMetadata[] {
  const q = query.toLowerCase().trim();
  if (!q) return Object.values(APPLICATION_REGISTRY);
  return Object.values(APPLICATION_REGISTRY).filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      app.processName.toLowerCase().includes(q)
  );
}
