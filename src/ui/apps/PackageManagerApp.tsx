// ============================================================================
// NOVA OS — PACKAGE MANAGER APPLICATION (pkg)
// Simulated software package repository, dependency manager, and installer
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { Box, Download, Trash2, CheckCircle, Search } from 'lucide-react';

interface PackageDef {
  name: string;
  version: string;
  description: string;
  sizeKb: number;
  category: string;
  isInstalled: boolean;
}

export const PackageManagerApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [packages, setPackages] = useState<PackageDef[]>([
    {
      name: 'gcc-sim',
      version: '12.2.0',
      description: 'Simulated GNU C Compiler suite with standard libraries',
      sizeKb: 48200,
      category: 'Developer Tools',
      isInstalled: true,
    },
    {
      name: 'python3-sim',
      version: '3.11.2',
      description: 'Interactive interpreted programming language runtime',
      sizeKb: 36400,
      category: 'Runtimes',
      isInstalled: true,
    },
    {
      name: 'nginx-sim',
      version: '1.24.0',
      description: 'High-performance HTTP server and reverse proxy daemon',
      sizeKb: 14200,
      category: 'Servers',
      isInstalled: false,
    },
    {
      name: 'htop-sim',
      version: '3.2.1',
      description: 'Interactive graphical process viewer and resource analyzer',
      sizeKb: 2800,
      category: 'Utilities',
      isInstalled: false,
    },
    {
      name: 'sqlite3-sim',
      version: '3.40.1',
      description: 'Self-contained zero-configuration virtual SQL database',
      sizeKb: 8900,
      category: 'Database',
      isInstalled: false,
    },
  ]);
  const [search, setSearch] = useState('');

  const handleInstall = (name: string) => {
    kernel.shell.execute(`pkg install ${name}`);
    setPackages((prev) =>
      prev.map((p) => (p.name === name ? { ...p, isInstalled: true } : p))
    );
    showNotification(`Installed package ${name}`, 'info');
  };

  const handleRemove = (name: string) => {
    kernel.vfs.deleteFile(`/usr/bin/${name}`);
    setPackages((prev) =>
      prev.map((p) => (p.name === name ? { ...p, isInstalled: false } : p))
    );
    showNotification(`Removed package ${name}`, 'info');
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Search Bar */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search package repository..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-100 font-mono text-xs outline-none"
        />
      </div>

      {/* Package List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.map((pkg) => (
          <div
            key={pkg.name}
            className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100 text-sm font-mono">{pkg.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">v{pkg.version}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-white/5">
                  {pkg.category}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{pkg.description}</p>
              <div className="text-[10px] text-slate-500 font-mono">Package Size: {(pkg.sizeKb / 1024).toFixed(1)} MB</div>
            </div>

            <div>
              {pkg.isInstalled ? (
                <button
                  onClick={() => handleRemove(pkg.name)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Uninstall
                </button>
              ) : (
                <button
                  onClick={() => handleInstall(pkg.name)}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
