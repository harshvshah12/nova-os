// ============================================================================
// NOVA OS — SOFTWARE CENTER APPLICATION
// Graphical package manager & app marketplace with simulated dependency checks,
// network package download, and VFS package installation
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { APPLICATION_REGISTRY, type AppMetadata } from '../../simulation/applications/ApplicationRegistry';
import {
  ShoppingBag,
  Download,
  CheckCircle,
  Play,
  RotateCw,
  Search,
  Box,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface SoftwarePackage extends AppMetadata {
  installed: boolean;
  downloadSizeMb: number;
}

export const SoftwareCenterApp: React.FC = () => {
  const { kernel, openWindow, showNotification } = useOsStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installStep, setInstallStep] = useState<string>('');

  const [packages, setPackages] = useState<Record<string, boolean>>({
    browser: true,
    'file-manager': true,
    terminal: true,
    'text-editor': true,
    'document-viewer': true,
    'image-viewer': true,
    'media-player': true,
    'archive-manager': true,
    'download-manager': true,
    calculator: true,
    calendar: true,
    notes: true,
    'system-monitor': true,
    'process-manager': true,
    'scheduler-visualizer': true,
    'memory-analyzer': true,
    'sync-lab': true,
    'deadlock-lab': true,
    'disk-analyzer': true,
    'network-monitor': true,
    'project-hub': true,
    settings: true,
  });

  const categories = ['All', 'Internet', 'Productivity', 'Media', 'Developer', 'System', 'Kernel Lab'];

  const allApps = Object.values(APPLICATION_REGISTRY);

  const filteredApps = allApps.filter((app) => {
    const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesSearch =
      search === '' ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstall = (app: AppMetadata) => {
    setInstallingId(app.id);
    setInstallStep('Resolving dependency tree...');

    setTimeout(() => {
      setInstallStep('Downloading package payload (TCP eth0)...');
      kernel.eventBus.emit(
        'NETWORK_PACKET_SEND',
        'network',
        'software-center',
        `Package download request: ${app.processName}.pkg`,
        kernel.clock.getTime()
      );
    }, 400);

    setTimeout(() => {
      setInstallStep('Allocating disk blocks & extracting binaries...');
      kernel.vfs.writeFile(
        `/usr/bin/${app.processName}`,
        `#!/bin/bash\n# Installed via NOVA Software Center\nexec /bin/${app.processName}\n`,
        0,
        0,
        755
      );
    }, 900);

    setTimeout(() => {
      setPackages((prev) => ({ ...prev, [app.id]: true }));
      setInstallingId(null);
      setInstallStep('');
      showNotification(`Successfully installed ${app.name}`, 'info');
    }, 1400);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#070B14] text-xs font-sans select-none overflow-hidden">
      {/* Top Header & Search */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-5 h-5 text-purple-400" />
          <div>
            <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
              NOVA Software Center
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Official Repository
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Verified operating system utilities, developer tools, and academic labs
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search software..."
            className="pl-8 pr-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-200 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-3 py-2 bg-[#090E1A] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Installation Step Alert */}
      {installingId && (
        <div className="px-4 py-2 bg-purple-950/40 border-b border-purple-500/30 flex items-center gap-2 text-purple-300 font-mono text-[11px]">
          <RotateCw className="w-3.5 h-3.5 animate-spin" />
          <span>{installStep}</span>
        </div>
      )}

      {/* Software Grid */}
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredApps.map((app) => {
          const isInstalled = packages[app.id] ?? false;
          const isBusy = installingId === app.id;

          return (
            <div
              key={app.id}
              className="p-3.5 rounded-xl bg-[#0C1220] border border-white/5 hover:border-purple-500/30 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md shrink-0"
                      style={{
                        backgroundColor: `${app.accentColor}18`,
                        border: `1px solid ${app.accentColor}30`,
                      }}
                    >
                      <Box className="w-5 h-5" style={{ color: app.accentColor }} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-xs">{app.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">v{app.version} • {app.category}</div>
                    </div>
                  </div>

                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 border border-white/10 text-slate-400">
                    {app.workloadProfile.memoryMb}MB
                  </span>
                </div>

                <p className="text-[11px] text-slate-300/80 leading-relaxed mb-3">
                  {app.description}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-500">
                  {app.processName}
                </span>

                <div className="flex items-center gap-1.5">
                  {isInstalled ? (
                    <>
                      <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Installed
                      </span>
                      <button
                        onClick={() => openWindow(app.id)}
                        className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" /> Open
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(app)}
                      disabled={isBusy}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-md"
                    >
                      {isBusy ? <RotateCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
