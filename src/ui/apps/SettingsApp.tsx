// ============================================================================
// NOVA OS — SYSTEM SETTINGS APPLICATION
// Multi-tab configuration: Hardware, Appearance/Wallpapers, Kernel algorithms, Network
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import type { WallpaperId } from '../../store/osStore';
import { 
  Settings, 
  Cpu, 
  Layers, 
  HardDrive, 
  Wifi, 
  Palette, 
  Monitor, 
  Sliders, 
  ShieldCheck, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import type { 
  SchedulerAlgorithm, 
  PageReplacementAlgorithm, 
  DiskSchedulingAlgorithm 
} from '../../simulation/types';

export const SettingsApp: React.FC = () => {
  const { 
    kernel, 
    operatingMode, 
    setOperatingMode, 
    wallpaper, 
    setWallpaper, 
    showNotification,
    setSchedulerAlgorithm,
    setMemoryReplacement,
    setDiskAlgorithm
  } = useOsStore();

  const [activeTab, setActiveTab] = useState<'hardware' | 'appearance' | 'kernel' | 'network'>('hardware');

  const hw = kernel.getHardwareConfig();
  const netState = kernel.net.getState();

  const handleCoresChange = (cores: number) => {
    kernel.cpu.setCoreCount(cores);
    showNotification(`Virtual CPU reconfigured to ${cores} cores`, 'info');
  };

  const wallpapers: { id: WallpaperId; name: string; desc: string; gradient: string }[] = [
    {
      id: 'dark-obsidian',
      name: 'Dark Obsidian Luxe',
      desc: 'Technical obsidian with subtle cyan radial aura and engineering grid',
      gradient: 'from-cyan-950 via-[#0A0E1A] to-[#070A11]',
    },
    {
      id: 'cyber-matrix',
      name: 'Cyberpunk Matrix',
      desc: 'Deep emerald terminal mesh with digital circuit traces',
      gradient: 'from-emerald-950 via-[#07130F] to-[#040A08]',
    },
    {
      id: 'deep-space',
      name: 'Deep Space Nebula',
      desc: 'Cosmic violet and deep indigo starfield glow',
      gradient: 'from-violet-950 via-[#0F0B1E] to-[#06040F]',
    },
    {
      id: 'sunset-neon',
      name: 'Tokyo Sunset Neon',
      desc: 'Retro synthwave magenta and amber horizon',
      gradient: 'from-rose-950 via-[#1C0D1B] to-[#0D0612]',
    },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#080C14] text-xs font-sans text-slate-200 overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0F1D] p-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 text-white font-bold border-b border-white/5 mb-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>System Settings</span>
        </div>

        <button
          onClick={() => setActiveTab('hardware')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
            activeTab === 'hardware'
              ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 shrink-0" />
          <span>Hardware & CPU</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
            activeTab === 'appearance'
              ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('kernel')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
            activeTab === 'kernel'
              ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Kernel Algorithms</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
            activeTab === 'network'
              ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Network & Host</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'hardware' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Virtual Hardware Configuration</h2>
              <p className="text-slate-400 text-xs">Manage simulated processors and execution modes.</p>
            </div>

            {/* Cores configuration */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
              <span className="font-semibold text-slate-200 block text-xs">Logical CPU Cores</span>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 8].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCoresChange(c)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                      kernel.cpu.getCoreCount() === c
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {c} {c === 1 ? 'Core' : 'Cores'}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Clock Frequency: {hw.coreFrequencyMhz} MHz (Simulated x86_64 SMP architecture)
              </div>
            </div>

            {/* Operating Mode Selector */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
              <span className="font-semibold text-slate-200 block text-xs">Operating System Mode</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: 'NORMAL', label: 'Normal Mode', desc: 'Standard desktop OS interface with smooth multitasking' },
                  { id: 'LEARNING', label: 'Learning Mode', desc: 'Contextual academic hints & concept deep-dives' },
                  { id: 'DEBUG', label: 'Debug Mode', desc: 'Hardware register stepping & kernel trace inspection' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setOperatingMode(m.id as any)}
                    className={`p-3 rounded-lg text-left border transition-all space-y-1 ${
                      operatingMode === m.id
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950/30'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs">{m.label}</div>
                    <div className="text-[10px] opacity-75">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Manifest Table */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-2 font-mono text-[11px]">
              <span className="font-semibold text-slate-200 block text-xs font-sans">Simulated Hardware Manifest</span>
              <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                <div>RAM Allocation: <span className="text-emerald-400">{hw.ramTotalMb} MB</span></div>
                <div>Page Size: <span className="text-emerald-400">{hw.pageSizeKb} KB</span></div>
                <div>Storage Device: <span className="text-amber-400">{hw.diskSizeGb} GB (256 tracks)</span></div>
                <div>NIC: <span className="text-cyan-400">{hw.networkInterface} ({hw.ipAddress})</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Appearance & Desktop Customization</h2>
              <p className="text-slate-400 text-xs">Personalize your desktop background and workstation styling.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wallpapers.map((wp) => {
                const isSelected = wallpaper === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      setWallpaper(wp.id);
                      showNotification(`Applied wallpaper: ${wp.name}`, 'info');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/50'
                        : 'bg-[#0D1424] border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Visual Preview */}
                    <div className={`h-24 rounded-lg bg-gradient-to-br ${wp.gradient} border border-white/10 flex items-center justify-center relative overflow-hidden`}>
                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center justify-between">
                        <span>{wp.name}</span>
                        {isSelected && <span className="text-[10px] text-cyan-400 font-mono">Active</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{wp.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'kernel' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Kernel Simulation Algorithms</h2>
              <p className="text-slate-400 text-xs">Switch scheduling, virtual memory, and disk algorithms live.</p>
            </div>

            {/* Scheduler Algorithm */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-2">
              <span className="font-semibold text-slate-200 block text-xs">CPU Scheduling Algorithm</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['RR', 'PRIORITY', 'SJF', 'FCFS'] as SchedulerAlgorithm[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => {
                      setSchedulerAlgorithm(algo);
                      showNotification(`Scheduler switched to ${algo}`, 'info');
                    }}
                    className={`px-3 py-2 rounded-lg text-center font-mono text-[11px] transition-all ${
                      kernel.scheduler.getAlgorithm() === algo
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            {/* Memory Replacement Algorithm */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-2">
              <span className="font-semibold text-slate-200 block text-xs">Page Replacement Algorithm</span>
              <div className="grid grid-cols-3 gap-2">
                {(['LRU', 'FIFO', 'OPTIMAL'] as PageReplacementAlgorithm[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => {
                      setMemoryReplacement(algo);
                      showNotification(`Page replacement algorithm set to ${algo}`, 'info');
                    }}
                    className={`px-3 py-2 rounded-lg text-center font-mono text-[11px] transition-all ${
                      kernel.memoryManager.getReplacementAlgorithm() === algo
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            {/* Disk Scheduling Algorithm */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-2">
              <span className="font-semibold text-slate-200 block text-xs">Disk Head Scheduling</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['SCAN', 'LOOK', 'SSTF', 'FCFS'] as DiskSchedulingAlgorithm[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => {
                      setDiskAlgorithm(algo);
                      showNotification(`Disk scheduler set to ${algo}`, 'info');
                    }}
                    className={`px-3 py-2 rounded-lg text-center font-mono text-[11px] transition-all ${
                      kernel.disk.getAlgorithm() === algo
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Network & Host Environment</h2>
              <p className="text-slate-400 text-xs">Inspect virtual network adapter and connection state.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Interface:</span>
                <span className="text-slate-200 font-semibold">{hw.networkInterface}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">IPv4 Address:</span>
                <span className="text-cyan-400 font-semibold">{netState.ip}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">MAC Address:</span>
                <span className="text-slate-200">{netState.mac}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">DNS Nameserver:</span>
                <span className="text-slate-200">1.1.1.1, 8.8.8.8 (Simulated)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Packets Transmitted / Received:</span>
                <span className="text-slate-200">Tx: {netState.txPackets} | Rx: {netState.rxPackets}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
