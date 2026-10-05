// ============================================================================
// NOVA OS — FLOATING DESKTOP DOCK
// Translucent quick-launch dock with active process indicators
// ============================================================================

import React from 'react';
import { useOsStore } from '../../store/osStore';
import type { AppId } from '../../simulation/types';
import {
  Terminal,
  Activity,
  Cpu,
  Layers,
  GitCommit,
  Folder,
  HardDrive,
  Wifi,
  FileText,
  AlertTriangle,
  PlayCircle,
  Clock,
  Box,
  Settings,
  FolderGit2,
  Utensils,
} from 'lucide-react';

interface DockItem {
  appId: AppId;
  label: string;
  icon: React.ElementType;
  color: string;
}

const DOCK_ITEMS: DockItem[] = [
  { appId: 'project-hub', label: "Harsh's Projects", icon: FolderGit2, color: '#38BDF8' },
  { appId: 'terminal', label: 'Terminal', icon: Terminal, color: '#06B6D4' },
  { appId: 'system-monitor', label: 'System Monitor', icon: Activity, color: '#34D399' },
  { appId: 'process-manager', label: 'Process Manager', icon: Cpu, color: '#F472B6' },
  { appId: 'scheduler-visualizer', label: 'Scheduler', icon: GitCommit, color: '#FBBF24' },
  { appId: 'memory-analyzer', label: 'Memory Analyzer', icon: Layers, color: '#A78BFA' },
  { appId: 'sync-lab', label: 'Concurrency Lab', icon: Utensils, color: '#EC4899' },
  { appId: 'deadlock-lab', label: 'Deadlock Lab', icon: AlertTriangle, color: '#EF4444' },
  { appId: 'disk-analyzer', label: 'Disk Platter', icon: HardDrive, color: '#FB923C' },
  { appId: 'file-manager', label: 'File Manager', icon: Folder, color: '#F59E0B' },
  { appId: 'network-monitor', label: 'Network Monitor', icon: Wifi, color: '#818CF8' },
  { appId: 'os-scenarios', label: 'OS Scenarios', icon: PlayCircle, color: '#10B981' },
  { appId: 'settings', label: 'Settings', icon: Settings, color: '#64748B' },
];

export const Dock: React.FC = () => {
  const { windows, openWindow, activeWindowId, focusWindow, minimizeWindow } = useOsStore();

  const handleItemClick = (appId: AppId) => {
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      if (existing.id === activeWindowId && !existing.isMinimized) {
        minimizeWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
    } else {
      openWindow(appId);
    }
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#090F1C]/85 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.1)]">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const openWin = windows.find((w) => w.appId === item.appId);
          const isOpen = Boolean(openWin);
          const isActive = openWin?.id === activeWindowId && !openWin.isMinimized;

          return (
            <button
              key={item.appId}
              onClick={() => handleItemClick(item.appId)}
              className="group relative flex flex-col items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-all duration-150 hover:-translate-y-1.5"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 px-2 py-0.5 rounded bg-[#0D1424] border border-white/10 text-[10px] font-medium text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                {item.label}
              </div>

              {/* Icon */}
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? '#38BDF8' : item.color }}
              />

              {/* Running Dot */}
              <div
                className={`w-1 h-1 rounded-full mt-1 transition-all ${
                  isActive
                    ? 'bg-cyan-400 w-2.5 shadow-[0_0_6px_#38bdf8]'
                    : isOpen
                    ? 'bg-slate-400'
                    : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
