// ============================================================================
// NOVA OS — APPLICATION LAUNCHER MODAL
// Searchable grid overlay for all system applications and OS lab utilities
// ============================================================================

import React, { useState } from 'react';
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
  Hash,
  Search,
  X,
  FolderGit2,
  Utensils,
} from 'lucide-react';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppInfo {
  appId: AppId;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const APPS_LIST: AppInfo[] = [
  { appId: 'project-hub', name: "Harsh's Projects", category: 'Portfolio', description: 'Showcase of DeepFake AI, ESP32 TinyML, and Systems architectures', icon: FolderGit2, color: '#38BDF8' },
  { appId: 'sync-lab', name: 'Concurrency Lab', category: 'Kernel Lab', description: 'Semaphores, Mutexes, Bounded Buffer & Dining Philosophers', icon: Utensils, color: '#EC4899' },
  { appId: 'terminal', name: 'Terminal', category: 'System', description: 'Bash-inspired shell with pipes, redirection, and signals', icon: Terminal, color: '#06B6D4' },
  { appId: 'system-monitor', name: 'System Monitor', category: 'Telemetry', description: 'Real-time multi-core CPU, RAM, and I/O graphs', icon: Activity, color: '#34D399' },
  { appId: 'process-manager', name: 'Process Manager', category: 'System', description: 'Inspect PCB table, process trees, and send signals', icon: Cpu, color: '#F472B6' },
  { appId: 'scheduler-visualizer', name: 'Scheduler', category: 'Kernel Lab', description: 'Live Gantt chart, queue pipelines, RR/SJF/MLFQ', icon: GitCommit, color: '#FBBF24' },
  { appId: 'memory-analyzer', name: 'Memory Analyzer', category: 'Kernel Lab', description: '4KB paged virtual memory map, address translation & TLB', icon: Layers, color: '#A78BFA' },
  { appId: 'disk-analyzer', name: 'Disk Platter Analyzer', category: 'Kernel Lab', description: 'Animated cylinder seek head, SCAN & LOOK algorithms', icon: HardDrive, color: '#FB923C' },
  { appId: 'deadlock-lab', name: 'Deadlock & Banker’s Lab', category: 'Kernel Lab', description: 'Resource Allocation Graph, cycle detector & safety test', icon: AlertTriangle, color: '#EF4444' },
  { appId: 'os-scenarios', name: 'OS Demonstration Lab', category: 'Education', description: '1-click academic lab demonstrations', icon: PlayCircle, color: '#10B981' },
  { appId: 'file-manager', name: 'File Manager', category: 'Storage', description: 'Browse virtual file system with permissions', icon: Folder, color: '#F59E0B' },
  { appId: 'network-monitor', name: 'Network Monitor', category: 'Networking', description: 'Virtual eth0 interface, ping tool & packet stream', icon: Wifi, color: '#818CF8' },
  { appId: 'event-timeline', name: 'Event Timeline', category: 'Kernel Lab', description: 'Audit log of kernel events and causal explanations', icon: Clock, color: '#06B6D4' },
  { appId: 'text-editor', name: 'Text Editor', category: 'Utilities', description: 'Create and edit virtual files', icon: FileText, color: '#94A3B8' },
  { appId: 'calculator', name: 'Calculator', category: 'Utilities', description: 'Standard arithmetic calculator accessory', icon: Hash, color: '#64748B' },
  { appId: 'package-manager', name: 'Package Manager', category: 'System', description: 'Search and install simulated software packages', icon: Box, color: '#E879F9' },
  { appId: 'settings', name: 'System Settings', category: 'Preferences', description: 'Configure virtual CPU cores, RAM, and defaults', icon: Settings, color: '#64748B' },
];

export const AppLauncher: React.FC<AppLauncherProps> = ({ isOpen, onClose }) => {
  const { openWindow } = useOsStore();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = APPS_LIST.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleLaunch = (appId: AppId) => {
    openWindow(appId);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0C121E]/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 flex flex-col space-y-4 max-h-[85vh] overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-white/10">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search applications, kernel labs, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-slate-100 font-sans text-sm outline-none placeholder:text-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Application Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
          {filtered.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.appId}
                onClick={() => handleLaunch(app.appId)}
                className="p-3.5 rounded-xl bg-[#090D17] hover:bg-[#121929] border border-white/5 hover:border-cyan-500/30 flex flex-col items-start text-left space-y-2 transition-all duration-150 group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: `${app.color}20`, borderColor: `${app.color}40` }}
                >
                  <Icon className="w-5 h-5" style={{ color: app.color }} />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs group-hover:text-cyan-400 transition-colors">
                    {app.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{app.category}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {app.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
