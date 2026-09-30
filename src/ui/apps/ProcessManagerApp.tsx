// ============================================================================
// NOVA OS — PROCESS MANAGER APPLICATION
// Live PCB table, signals (SIGKILL, SIGTERM, SIGSTOP), Nice tuning, and process tree
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { Plus, Play, Pause, Trash2, GitFork, ArrowDownUp } from 'lucide-react';
import type { WorkloadType } from '../../simulation/types';

export const ProcessManagerApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [, setTick] = useState(0);
  const [filterState, setFilterState] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('LIST');

  // New process modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProcName, setNewProcName] = useState('worker_task');
  const [newProcWorkload, setNewProcWorkload] = useState<WorkloadType>('CPU_BOUND');

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(handle);
  }, []);

  const processes = kernel.processManager.getAllProcesses();
  const filtered = processes.filter((p) => {
    if (filterState === 'ALL') return true;
    return p.getState() === filterState;
  });

  const handleSignal = (pid: number, sig: number) => {
    kernel.processManager.sendSignal(pid, sig, kernel.clock.getTime());
    showNotification(`Signal ${sig} sent to PID ${pid}`, 'info');
  };

  const handleSpawn = () => {
    kernel.processManager.createProcess(newProcName, `./${newProcName}`, newProcWorkload, {
      timestamp: kernel.clock.getTime(),
    });
    setShowNewModal(false);
    showNotification(`Process ${newProcName} created`, 'info');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Action Bar */}
      <div className="p-2.5 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Process
          </button>

          <div className="flex items-center rounded bg-slate-800 p-0.5 border border-white/5">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'LIST' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('TREE')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'TREE' ? 'bg-cyan-500 text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Process Tree
            </button>
          </div>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1">
          {['ALL', 'RUNNING', 'READY', 'BLOCKED', 'TERMINATED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${
                filterState === st
                  ? 'bg-slate-700 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto p-2">
        {viewMode === 'LIST' ? (
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="pb-2 pl-2">PID</th>
                <th className="pb-2">PPID</th>
                <th className="pb-2">NAME</th>
                <th className="pb-2">STATE</th>
                <th className="pb-2">PRIORITY</th>
                <th className="pb-2">NICE</th>
                <th className="pb-2">CPU TIME</th>
                <th className="pb-2">WAIT TIME</th>
                <th className="pb-2">FRAMES</th>
                <th className="pb-2 pr-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filtered.map((proc) => {
                const pcb = proc.getPcb();
                const stateColor =
                  pcb.state === 'RUNNING'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : pcb.state === 'READY'
                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                    : pcb.state === 'BLOCKED'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-slate-500 bg-slate-800/20 border-slate-700/20';

                return (
                  <tr key={pcb.pid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pl-2 font-bold text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: pcb.color }} />
                      {pcb.pid}
                    </td>
                    <td className="py-2 text-slate-400">{pcb.ppid}</td>
                    <td className="py-2 text-slate-200 font-sans font-medium">{pcb.name}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${stateColor}`}>
                        {pcb.state}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">{pcb.dynamicPriority}</td>
                    <td className="py-2 text-slate-400">{pcb.nice}</td>
                    <td className="py-2 text-slate-300">{(pcb.cpuTime / 1000).toFixed(2)}s</td>
                    <td className="py-2 text-slate-400">{(pcb.waitingTime / 1000).toFixed(2)}s</td>
                    <td className="py-2 text-cyan-400">{pcb.allocatedFrames.length}</td>
                    <td className="py-2 pr-2 text-right">
                      {pcb.state !== 'TERMINATED' && (
                        <div className="inline-flex items-center gap-1">
                          {pcb.state === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleSignal(pcb.pid, 18)} // SIGCONT
                              className="p-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Resume (SIGCONT)"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSignal(pcb.pid, 19)} // SIGSTOP
                              className="p-1 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-400 transition-colors"
                              title="Suspend (SIGSTOP)"
                            >
                              <Pause className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSignal(pcb.pid, 9)} // SIGKILL
                            className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Kill (SIGKILL)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Process Tree View */
          <div className="space-y-1 font-mono p-2">
            <span className="text-slate-400 font-semibold mb-2 block">Parent-Child Process Tree:</span>
            {processes
              .filter((p) => p.getPcb().ppid === 0 || p.getPcb().ppid === 1)
              .map((parent) => {
                const pcb = parent.getPcb();
                return (
                  <div key={pcb.pid} className="space-y-1">
                    <div className="p-1.5 rounded bg-slate-800/40 border border-white/5 flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold">
                        PID {pcb.pid} — {pcb.name} [{pcb.state}]
                      </span>
                      <span className="text-slate-400 text-[10px]">CPU: {pcb.cpuTime}ms</span>
                    </div>

                    {/* Children */}
                    {pcb.childrenPids.length > 0 && (
                      <div className="pl-6 border-l border-white/10 space-y-1">
                        {pcb.childrenPids.map((childPid) => {
                          const child = kernel.processManager.getProcess(childPid);
                          if (!child) return null;
                          return (
                            <div key={childPid} className="p-1 rounded bg-slate-900/60 text-slate-300 text-[11px] flex justify-between">
                              <span>└── PID {childPid}: {child.getName()} ({child.getState()})</span>
                              <span className="text-slate-500">{child.getPcb().cpuTime}ms</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* New Process Modal */}
      {showNewModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E1524] border border-cyan-500/30 rounded-lg p-4 w-80 space-y-3 shadow-2xl">
            <h3 className="font-semibold text-slate-100 text-sm">Spawn Virtual Process</h3>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Process Name</label>
                <input
                  type="text"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-100 font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Workload Profile</label>
                <select
                  value={newProcWorkload}
                  onChange={(e) => setNewProcWorkload(e.target.value as WorkloadType)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-100 text-xs focus:border-cyan-500 outline-none"
                >
                  <option value="CPU_BOUND">CPU-Bound (Heavy compute burst)</option>
                  <option value="IO_BOUND">I/O-Bound (Disk seek & read)</option>
                  <option value="MEMORY_INTENSIVE">Memory-Intensive (Page faults)</option>
                  <option value="MIXED">Mixed (Realistic application)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSpawn}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium font-sans"
              >
                Spawn Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
