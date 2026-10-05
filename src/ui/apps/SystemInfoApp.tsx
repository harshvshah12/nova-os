// ============================================================================
// NOVA OS — SYSTEM INFORMATION (ABOUT THIS SYSTEM)
// macOS / Ubuntu-style comprehensive hardware and kernel telemetry overview
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { 
  Laptop, 
  Cpu, 
  Layers, 
  HardDrive, 
  Wifi, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  BarChart3, 
  User, 
  Copy, 
  CheckCircle2 
} from 'lucide-react';

export const SystemInfoApp: React.FC = () => {
  const { kernel, simulationTime, openWindow } = useOsStore();
  const [, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(handle);
  }, []);

  const totalRamMb = kernel.ram.getTotalMb();
  const ramMetrics = kernel.memoryManager.getMetrics();
  const usedRamMb = Math.round((ramMetrics.usedFrames / (ramMetrics.totalFrames || 1)) * totalRamMb);
  const cores = kernel.cpu.getCores();
  const diskState = kernel.disk.getState();
  const netState = kernel.net.getState();
  const procCount = kernel.processManager.getAllProcesses().length;
  const schedMetrics = kernel.scheduler.getMetrics();

  // Format uptime
  const totalSeconds = Math.floor(simulationTime / 10); // 10 ticks = 1 sec approx
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const uptimeStr = `${minutes}m ${seconds}s (${simulationTime} ticks)`;

  const sysSummary = `NOVA OS 2.5 (Obsidian Edition)
Kernel: Nova Microkernel v2.5.0-x86_64-sim
CPU: ${cores.length} Virtual Cores @ ${kernel.cpu.getFrequencyMhz()} MHz
Memory: ${usedRamMb}MB / ${totalRamMb}MB (4KB Paged)
Storage: ${diskState.totalTracks} Tracks, Head @ Track #${diskState.currentTrack}
Uptime: ${uptimeStr}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sysSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full bg-[#080C14] text-slate-200 p-6 overflow-y-auto space-y-6 text-xs font-sans selection:bg-cyan-500/30">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#0E1726] to-slate-900 border border-cyan-500/20 shadow-xl shadow-cyan-950/20">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-400 text-slate-950">
            v2.5
          </span>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
            NOVA OS <span className="text-cyan-400 font-mono text-sm font-normal">2.5 LTS</span>
          </h1>
          <p className="text-slate-400 text-xs">
            Cyberpunk Obsidian Workstation • Linux-Inspired Simulated Operating System
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 font-mono text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Architecture: x86_64 Simulated</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Kernel: Microkernel v2.5.0</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Status: Running</span>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors text-[11px]"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied' : 'Copy Specs'}</span>
        </button>
      </div>

      {/* Hardware & Simulation Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Virtual Processor */}
        <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Virtual Processor
            </span>
            <span className="font-mono text-cyan-400">{kernel.cpu.getFrequencyMhz()} MHz</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Logical Cores:</span>
              <span className="text-slate-200">{cores.length} Cores (SMP Architecture)</span>
            </div>
            <div className="flex justify-between">
              <span>Average Utilization:</span>
              <span className="text-cyan-400">{kernel.cpu.getAverageUtilization()}%</span>
            </div>
            <div className="flex justify-between">
              <span>Scheduler Algorithm:</span>
              <span className="text-slate-200 capitalize">{kernel.scheduler.getAlgorithm()}</span>
            </div>
            <div className="flex justify-between">
              <span>Context Switches:</span>
              <span className="text-slate-200">{schedMetrics.totalContextSwitches.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Virtual Memory */}
        <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Memory Subsystem
            </span>
            <span className="font-mono text-emerald-400">{totalRamMb} MB Virtual RAM</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Page / Frame Size:</span>
              <span className="text-slate-200">4 KB (4096 bytes)</span>
            </div>
            <div className="flex justify-between">
              <span>Physical Frame Pool:</span>
              <span className="text-slate-200">{ramMetrics.totalFrames.toLocaleString()} Frames</span>
            </div>
            <div className="flex justify-between">
              <span>Allocated Frames:</span>
              <span className="text-emerald-400">{ramMetrics.usedFrames.toLocaleString()} ({Math.round((ramMetrics.usedFrames / ramMetrics.totalFrames) * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Page Replacement:</span>
              <span className="text-slate-200">LRU / Clock Paged VM</span>
            </div>
          </div>
        </div>

        {/* Virtual Storage & Filesystem */}
        <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" /> Storage & VFS
            </span>
            <span className="font-mono text-amber-400">2048 MB Simulated Disk</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Disk Tracks:</span>
              <span className="text-slate-200">{diskState.totalTracks} Tracks (Elevator/LOOK)</span>
            </div>
            <div className="flex justify-between">
              <span>Current Head Position:</span>
              <span className="text-amber-400">Track #{diskState.currentTrack}</span>
            </div>
            <div className="flex justify-between">
              <span>Virtual File System:</span>
              <span className="text-slate-200">Hierarchical In-Memory Unix VFS</span>
            </div>
            <div className="flex justify-between">
              <span>Mount Point:</span>
              <span className="text-slate-200">/ (root), /mnt/usb</span>
            </div>
          </div>
        </div>

        {/* Network & Environment */}
        <div className="p-4 rounded-xl bg-[#0D1424] border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" /> Network & Identity
            </span>
            <span className="font-mono text-blue-400">{netState.ip}</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>MAC Address:</span>
              <span className="text-slate-200">{netState.mac}</span>
            </div>
            <div className="flex justify-between">
              <span>Packets Transferred:</span>
              <span className="text-blue-400">Tx: {netState.txPackets} | Rx: {netState.rxPackets}</span>
            </div>
            <div className="flex justify-between">
              <span>Current User:</span>
              <span className="text-slate-200">nova (UID: 1000, GID: 1000)</span>
            </div>
            <div className="flex justify-between">
              <span>Simulated Uptime:</span>
              <span className="text-slate-200">{uptimeStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Diagnostics */}
      <div className="p-4 rounded-xl bg-[#0A0E1A] border border-white/5 space-y-3">
        <h3 className="font-semibold text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Deep Diagnostics Tools
        </h3>
        <p className="text-slate-400 text-xs">
          Inspect granular live telemetry, schedule workloads, or execute system commands inside the NOVA runtime:
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => openWindow('system-monitor')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all font-medium"
          >
            <BarChart3 className="w-4 h-4" /> System Monitor
          </button>
          <button
            onClick={() => openWindow('terminal')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all font-medium"
          >
            <Terminal className="w-4 h-4" /> Terminal (/bin/sh)
          </button>
          <button
            onClick={() => openWindow('memory-analyzer')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all font-medium"
          >
            <Layers className="w-4 h-4" /> 4KB Paged Memory Analyzer
          </button>
          <button
            onClick={() => openWindow('scheduler-visualizer')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all font-medium"
          >
            <Cpu className="w-4 h-4" /> CPU Scheduler Lab
          </button>
        </div>
      </div>
    </div>
  );
};
