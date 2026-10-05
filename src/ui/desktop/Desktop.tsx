// ============================================================================
// NOVA OS — MASTER DESKTOP ENVIRONMENT
// Window Manager host, desktop shortcuts, floating dock, top panel, and lab tools
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { AppLauncher } from './AppLauncher';
import { WindowFrame } from '../windows/WindowFrame';
import { LearningPanel } from '../learning/LearningPanel';
import { DebuggerPanel } from '../debugger/DebuggerPanel';
import type { AppId } from '../../simulation/types';

// Core & Lab Applications
import { TerminalApp } from '../apps/TerminalApp';
import { SystemMonitorApp } from '../apps/SystemMonitorApp';
import { ProcessManagerApp } from '../apps/ProcessManagerApp';
import { SchedulerApp } from '../apps/SchedulerApp';
import { MemoryAnalyzerApp } from '../apps/MemoryAnalyzerApp';
import { DiskAnalyzerApp } from '../apps/DiskAnalyzerApp';
import { FileManagerApp } from '../apps/FileManagerApp';
import { NetworkMonitorApp } from '../apps/NetworkMonitorApp';
import { DeadlockLabApp } from '../apps/DeadlockLabApp';
import { OsScenariosApp } from '../apps/OsScenariosApp';
import { TextEditorApp } from '../apps/TextEditorApp';
import { EventTimelineApp } from '../apps/EventTimelineApp';
import { SettingsApp } from '../apps/SettingsApp';
import { PackageManagerApp } from '../apps/PackageManagerApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { ProjectHubApp } from '../apps/ProjectHubApp';
import { SyncLabApp } from '../apps/SyncLabApp';

// New Desktop Suite Applications
import { BrowserApp } from '../apps/BrowserApp';
import { SoftwareCenterApp } from '../apps/SoftwareCenterApp';
import { DocumentViewerApp } from '../apps/DocumentViewerApp';
import { ImageViewerApp } from '../apps/ImageViewerApp';
import { MediaPlayerApp } from '../apps/MediaPlayerApp';
import { ArchiveManagerApp } from '../apps/ArchiveManagerApp';
import { DownloadManagerApp } from '../apps/DownloadManagerApp';
import { SystemInfoApp } from '../apps/SystemInfoApp';
import { HelpDocsApp } from '../apps/HelpDocsApp';
import { CalendarApp } from '../apps/CalendarApp';
import { NotesApp } from '../apps/NotesApp';

import {
  Terminal,
  Activity,
  Cpu,
  Layers,
  GitCommit,
  Folder,
  HardDrive,
  Wifi,
  AlertTriangle,
  PlayCircle,
  Clock,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Info,
  FolderGit2,
  Utensils,
  Globe,
  ShoppingBag,
  BookOpen,
  Music,
  FileText,
  Calendar as CalendarIcon,
  ShieldCheck,
  Archive,
  Image as ImageIcon
} from 'lucide-react';

const APP_COMPONENT_MAP: Record<AppId, React.FC<any>> = {
  terminal: TerminalApp,
  'system-monitor': SystemMonitorApp,
  'process-manager': ProcessManagerApp,
  'scheduler-visualizer': SchedulerApp,
  'memory-analyzer': MemoryAnalyzerApp,
  'disk-analyzer': DiskAnalyzerApp,
  'file-manager': FileManagerApp,
  'network-monitor': NetworkMonitorApp,
  'deadlock-lab': DeadlockLabApp,
  'os-scenarios': OsScenariosApp,
  'text-editor': TextEditorApp,
  'event-timeline': EventTimelineApp,
  settings: SettingsApp,
  'package-manager': PackageManagerApp,
  calculator: CalculatorApp,
  'project-hub': ProjectHubApp,
  'sync-lab': SyncLabApp,
  browser: BrowserApp,
  'software-center': SoftwareCenterApp,
  'document-viewer': DocumentViewerApp,
  'image-viewer': ImageViewerApp,
  'media-player': MediaPlayerApp,
  'archive-manager': ArchiveManagerApp,
  'download-manager': DownloadManagerApp,
  'system-info': SystemInfoApp,
  'help-docs': HelpDocsApp,
  calendar: CalendarApp,
  notes: NotesApp,
};

const DESKTOP_SHORTCUTS: { appId: AppId; label: string; icon: React.ElementType; color: string }[] = [
  { appId: 'project-hub', label: "Harsh's Projects", icon: FolderGit2, color: '#38BDF8' },
  { appId: 'browser', label: 'NOVA Browser', icon: Globe, color: '#06B6D4' },
  { appId: 'file-manager', label: 'Files (/home)', icon: Folder, color: '#F59E0B' },
  { appId: 'software-center', label: 'Software Center', icon: ShoppingBag, color: '#8B5CF6' },
  { appId: 'terminal', label: 'Terminal', icon: Terminal, color: '#10B981' },
  { appId: 'system-monitor', label: 'System Monitor', icon: Activity, color: '#34D399' },
  { appId: 'scheduler-visualizer', label: 'Scheduler Lab', icon: GitCommit, color: '#FBBF24' },
  { appId: 'memory-analyzer', label: 'RAM / Paging', icon: Layers, color: '#A78BFA' },
  { appId: 'sync-lab', label: 'Concurrency Lab', icon: Utensils, color: '#EC4899' },
  { appId: 'deadlock-lab', label: "Banker's Lab", icon: AlertTriangle, color: '#EF4444' },
  { appId: 'notes', label: 'Quick Notes', icon: FileText, color: '#EAB308' },
  { appId: 'help-docs', label: 'Help & Manual', icon: BookOpen, color: '#38BDF8' },
  { appId: 'system-info', label: 'About NOVA', icon: ShieldCheck, color: '#06B6D4' },
  { appId: 'settings', label: 'Settings', icon: SettingsIcon, color: '#94A3B8' },
];

export const Desktop: React.FC = () => {
  const { windows, openWindow, notification, clearNotification, wallpaper } = useOsStore();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // Wallpaper themes
  const wallpaperThemes: Record<string, { bg: string; radial: string; gridOpacity: string }> = {
    'dark-obsidian': {
      bg: 'bg-[#070A11]',
      radial: 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]',
      gridOpacity: 'opacity-[0.035]',
    },
    'cyber-matrix': {
      bg: 'bg-[#040A08]',
      radial: 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.18),rgba(0,0,0,0))]',
      gridOpacity: 'opacity-[0.05]',
    },
    'deep-space': {
      bg: 'bg-[#06040F]',
      radial: 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.2),rgba(0,0,0,0))]',
      gridOpacity: 'opacity-[0.04]',
    },
    'sunset-neon': {
      bg: 'bg-[#0D0612]',
      radial: 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.18),rgba(0,0,0,0))]',
      gridOpacity: 'opacity-[0.04]',
    },
  };

  const currentTheme = wallpaperThemes[wallpaper] || wallpaperThemes['dark-obsidian'];

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none ${currentTheme.bg} flex flex-col font-sans transition-colors duration-500`}>
      {/* Background Wallpaper */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${currentTheme.radial}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]" />
        <div
          className={`absolute inset-0 ${currentTheme.gridOpacity}`}
          style={{
            backgroundImage: `linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg, #FFF 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Bar */}
      <TopBar onToggleLauncher={() => setIsLauncherOpen(!isLauncherOpen)} />

      {/* Desktop Workspace */}
      <div className="relative flex-1 overflow-hidden z-10 p-4">
        {/* Desktop Shortcut Icons */}
        <div className="grid grid-flow-col grid-rows-7 gap-3 w-fit">
          {DESKTOP_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.appId}
                onDoubleClick={() => openWindow(item.appId)}
                onClick={() => openWindow(item.appId)}
                className="w-20 p-2 rounded-xl flex flex-col items-center justify-center space-y-1.5 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md shadow-black/40"
                  style={{
                    backgroundColor: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="text-[11px] font-medium text-slate-200 text-center tracking-wide drop-shadow-md truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Windows Host */}
        {windows.map((win) => {
          const AppComponent = APP_COMPONENT_MAP[win.appId] || TerminalApp;
          return (
            <WindowFrame key={win.id} window={win}>
              <AppComponent windowId={win.id} customData={win.customData} />
            </WindowFrame>
          );
        })}

        {/* Floating Side Panels */}
        <LearningPanel />
        <DebuggerPanel />
      </div>

      {/* Bottom Floating Dock */}
      <Dock />

      {/* App Launcher Modal */}
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
      />

      {/* Notification Toast */}
      {notification && (
        <div
          onClick={clearNotification}
          className={`absolute bottom-16 right-5 max-w-sm p-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-2.5 z-50 animate-in slide-in-from-bottom duration-200 cursor-pointer ${
            notification.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : notification.type === 'warn'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-slate-900/90 border-cyan-500/40 text-slate-100'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : notification.type === 'warn' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="text-xs font-sans leading-snug">{notification.message}</span>
        </div>
      )}
    </div>
  );
};
