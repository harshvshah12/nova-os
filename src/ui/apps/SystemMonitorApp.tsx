// ============================================================================
// NOVA OS — SYSTEM MONITOR APPLICATION
// Live telemetry: Multi-core CPU meters, RAM breakdown, Disk & Network throughput
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { Cpu, HardDrive, Layers, Wifi, Activity, RefreshCw } from 'lucide-react';

export const SystemMonitorApp: React.FC = () => {
  const { kernel, simulationTime } = useOsStore();

  const [, setTick] = useState(0);

  // Force re-render periodically to keep dashboard lively
  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(handle);
  }, []);

  const cores = kernel.cpu.getCores();
  const avgCpu = kernel.cpu.getAverageUtilization();

  const ramMetrics = kernel.memoryManager.getMetrics();
  const totalRam = kernel.ram.getTotalMb();
  const usedRam = Math.round((ramMetrics.usedFrames / (ramMetrics.totalFrames || 1)) * totalRam);
  const freeRam = totalRam - usedRam;
  const ramPercent = Math.round((usedRam / totalRam) * 100);

  const diskState = kernel.disk.getState();
  const netState = kernel.net.getState();
  const schedMetrics = kernel.scheduler.getMetrics();

  const allProcesses = kernel.processManager.getAllProcesses();
  const runningCount = allProcesses.filter((p) => p.getState() === 'RUNNING').length;
  const readyCount = allProcesses.filter((p) => p.getState() === 'READY').length;
  const blockedCount = allProcesses.filter((p) => p.getState() === 'BLOCKED').length;

  return (
    <div className="h-full w-full p-4 overflow-y-auto space-y-4 text-xs font-sans">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Load</span>
            <span className="text-[11px] font-mono text-cyan-400">{avgCpu}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${avgCpu}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{cores.length} Virtual Cores @ {kernel.cpu.getFrequencyMhz()} MHz</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Memory</span>
            <span className="text-[11px] font-mono text-emerald-400">{ramPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${ramPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{usedRam} MB / {totalRam} MB used</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium"><HardDrive className="w-3.5 h-3.5 text-amber-400" /> Disk Cylinder</span>
            <span className="text-[11px] font-mono text-amber-400">Trk {diskState.currentTrack}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(diskState.currentTrack / 199) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{diskState.totalHeadMovements} seeks, {diskState.algorithm}</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium"><Wifi className="w-3.5 h-3.5 text-violet-400" /> Network</span>
            <span className="text-[11px] font-mono text-violet-400">{netState.ip}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-300">
            <span>TX: {netState.txPackets} pkts</span>
            <span>RX: {netState.rxPackets} pkts</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Interface eth0 (UP)</div>
        </div>
      </div>

      {/* Per-Core Multi-Core Grid */}
      <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            Virtual Multi-Core Activity
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Context Switches: {schedMetrics.totalContextSwitches}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cores.map((core) => (
            <div key={core.id} className="p-2.5 rounded bg-[#090D17] border border-white/5 space-y-2">
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-300 font-medium">Core {core.id}</span>
                <span className="text-cyan-400 text-[11px]">{core.utilization}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${core.utilization}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {core.currentPid ? (
                  <span className="text-emerald-400">PID {core.currentPid} ({kernel.processManager.getProcess(core.currentPid)?.getName() || 'Task'})</span>
                ) : (
                  <span className="text-slate-500">IDLE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task & Process State Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2.5">
          <span className="font-semibold text-slate-200 block">Process Scheduling States</span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-lg font-mono font-bold text-emerald-400">{runningCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Running</div>
            </div>
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
              <div className="text-lg font-mono font-bold text-cyan-400">{readyCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ready / Wait</div>
            </div>
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="text-lg font-mono font-bold text-amber-400">{blockedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">I/O Blocked</div>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
          <span className="font-semibold text-slate-200 block">Kernel & Memory Telemetry</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
            <div>Page Faults: <span className="text-amber-400">{ramMetrics.totalPageFaults}</span></div>
            <div>Page Evictions: <span className="text-red-400">{ramMetrics.pageReplacements}</span></div>
            <div>TLB Hit Ratio: <span className="text-emerald-400">
              {ramMetrics.tlbHits + ramMetrics.tlbMisses > 0
                ? `${Math.round((ramMetrics.tlbHits / (ramMetrics.tlbHits + ramMetrics.tlbMisses)) * 100)}%`
                : '100%'}
            </span></div>
            <div>Scheduler Policy: <span className="text-cyan-400">{kernel.scheduler.getConfig().algorithm}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
