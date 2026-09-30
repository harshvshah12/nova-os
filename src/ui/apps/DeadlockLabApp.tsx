// ============================================================================
// NOVA OS — DEADLOCK & BANKER'S LAB APPLICATION
// Resource Allocation Graph (RAG), Cycle Detection, and Banker's Safe State Engine
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { AlertTriangle, CheckCircle, ShieldAlert, RefreshCw, Zap } from 'lucide-react';

export const DeadlockLabApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(handle);
  }, []);

  const detector = kernel.deadlockDetector;
  const resources = detector.getResources();
  const deadlockState = detector.getDeadlockState();

  const handleInjectDeadlock = () => {
    detector.injectClassicDeadlock(40, 41);
    showNotification('Classic Circular Wait Deadlock Injected (P40 <-> P41)', 'warn');
  };

  const handleReset = () => {
    detector.reset();
    showNotification('Deadlock engine reset to default safe state', 'info');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Banner Status */}
      <div
        className={`p-3 border-b flex items-center justify-between flex-wrap gap-2 ${
          deadlockState.isDeadlocked
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {deadlockState.isDeadlocked ? (
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          <div>
            <div className="font-bold text-sm">
              {deadlockState.isDeadlocked
                ? 'DEADLOCK DETECTED! (Circular Wait Cycle in RAG)'
                : 'SYSTEM STATE: SAFE (Banker Sequence Exists)'}
            </div>
            <div className="text-[11px] opacity-80 font-mono">
              {deadlockState.isDeadlocked
                ? `Deadlocked Processes: [${deadlockState.deadlockedPids.map((p) => `PID ${p}`).join(', ') || 'P40, P41'}]`
                : `Safe Sequence: [${deadlockState.safeSequence.map((p) => `P${p}`).join(' → ') || 'No active claims'}]`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInjectDeadlock}
            className="px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-500 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Inject Deadlock Trap
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resource Allocation Graph (RAG) Visualizer */}
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <span className="font-semibold text-slate-200 text-xs">Resource Allocation Graph (RAG)</span>
          <div className="flex-1 bg-[#090D17] rounded border border-white/5 p-3 flex flex-col justify-center items-center min-h-[220px]">
            {deadlockState.isDeadlocked ? (
              <div className="flex flex-col items-center space-y-3 font-mono">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center font-bold text-cyan-300">
                    P40
                  </div>
                  <div className="text-red-400 font-bold text-lg animate-pulse">⇄</div>
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center font-bold text-cyan-300">
                    P41
                  </div>
                </div>

                <div className="text-[11px] text-red-400 text-center font-sans space-y-1">
                  <div>Circular Wait Cycle Detected:</div>
                  <div className="font-mono text-slate-300">P40 holds R0(GPU) & requests R1(Disk)</div>
                  <div className="font-mono text-slate-300">P41 holds R1(Disk) & requests R0(GPU)</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center font-sans">
                Graph has no cycles. All resource dependencies are resolved safely.
              </div>
            )}
          </div>
        </div>

        {/* Resources & Banker's Available Vector */}
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-3">
          <span className="font-semibold text-slate-200 text-xs">Resource Pools & Availability</span>
          <div className="space-y-2">
            {resources.map((res) => (
              <div key={res.id} className="p-2.5 rounded bg-[#090D17] border border-white/5 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: res.color }} />
                  <div>
                    <div className="font-bold text-slate-200">{res.id} — {res.name}</div>
                    <div className="text-[10px] text-slate-500">Total: {res.totalInstances} units</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold text-sm">
                    {res.availableInstances} Available
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {res.totalInstances - res.availableInstances} Held
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-semibold">Banker's Algorithm Rules:</span> Whenever a process requests resources, the kernel simulates granting them and tests whether there is at least one sequence of process completions that avoids deadlock. If unsafe, the request is blocked.
          </div>
        </div>
      </div>
    </div>
  );
};
