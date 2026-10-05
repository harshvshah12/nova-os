// ============================================================================
// NOVA OS — APPLICATION LAUNCHER MODAL
// Searchable, categorized application grid for the complete 24-app ecosystem
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import type { AppId } from '../../simulation/types';
import { APPLICATION_REGISTRY } from '../../simulation/applications/ApplicationRegistry';
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
  Globe,
  ShoppingBag,
  BookOpen,
  Image,
  Music,
  Archive,
  Download,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
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
  FolderGit2,
  Utensils,
  Globe,
  ShoppingBag,
  BookOpen,
  Image,
  Music,
  Archive,
  Download,
  ShieldCheck,
  Calendar,
};

const CATEGORIES = [
  'All',
  'Kernel Labs',
  'System',
  'Internet',
  'Productivity',
  'Media',
  'Portfolio',
];

export const AppLauncher: React.FC<AppLauncherProps> = ({ isOpen, onClose }) => {
  const { openWindow } = useOsStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const allApps = Object.values(APPLICATION_REGISTRY);

  const filtered = allApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || app.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

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
        className="w-full max-w-3xl bg-[#0C121E]/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 flex flex-col space-y-4 max-h-[85vh] overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-white/10">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search all 24 applications, kernel labs, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm font-sans focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all font-medium whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Application Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((app) => {
              const Icon = ICON_MAP[app.icon] || FileText;
              return (
                <button
                  key={app.id}
                  onClick={() => handleLaunch(app.id as AppId)}
                  className="flex flex-col items-start p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all text-left group hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${app.accentColor}18`,
                        border: `1px solid ${app.accentColor}30`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: app.accentColor }} />
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {app.category}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate w-full">
                    {app.name}
                  </span>

                  <span className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {app.description}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No applications matching &quot;{search}&quot; in {selectedCategory}
            </div>
          )}
        </div>

        {/* Footer Shortcut Note */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>{filtered.length} Applications Available</span>
          <span className="font-mono text-[10px] text-slate-500">Press ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
};
