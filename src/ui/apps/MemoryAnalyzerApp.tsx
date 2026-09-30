// ============================================================================
// NOVA OS — MEMORY ANALYZER APPLICATION
// 64-frame physical RAM grid, interactive page tables, TLB cache, and page fault logs
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import type { PageReplacementAlgorithm } from '../../simulation/types';
import { Layers, Zap, Sliders, AlertCircle } from 'lucide-react';

export const MemoryAnalyzerApp: React.FC = () => {
  const { kernel, setMemoryReplacement } = useOsStore();
  const [, setTick] = useState(0);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(handle);
  }, []);

  const ram = kernel.ram;
  const mm = kernel.memoryManager;
  const frames = ram.getFrames();
  const metrics = mm.getMetrics();
  const tlbEntries = mm.getTlb();
  const processes = kernel.processManager.getActiveProcesses();

  // Selected process page table
  const effectivePid = selectedPid || (processes[0]?.getPid() ?? 1);
  const pageTable = mm.getPageTable(effectivePid);

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Configuration & Telemetry Bar */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Page Replacement:</span>
          <select
            value={mm.getReplacementAlgorithm()}
            onChange={(e) => setMemoryReplacement(e.target.value as PageReplacementAlgorithm)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-400 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="LRU">Least Recently Used (LRU)</option>
            <option value="FIFO">First-In First-Out (FIFO)</option>
            <option value="OPTIMAL">Belady's Optimal (Lookahead)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div>Page Faults: <span className="text-amber-400 font-bold">{metrics.totalPageFaults}</span></div>
          <div>Replacements: <span className="text-red-400 font-bold">{metrics.pageReplacements}</span></div>
          <div>TLB Hit Ratio: <span className="text-emerald-400 font-bold">
            {metrics.tlbHits + metrics.tlbMisses > 0
              ? `${Math.round((metrics.tlbHits / (metrics.tlbHits + metrics.tlbMisses)) * 100)}%`
              : '100%'}
          </span></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Physical RAM Frame Grid (64 frames) */}
        <div className="lg:col-span-7 p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-semibold text-xs">
            <span>Physical RAM Frame Buffer ({frames.length} Frames × 32MB)</span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-800 border border-white/20" /> Free ({metrics.freeFrames})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> Allocated ({metrics.usedFrames})</span>
            </div>
          </div>

          {/* 8x8 Grid of 64 Frames */}
          <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#090D17] rounded border border-white/5">
            {frames.map((frame) => {
              const proc = frame.allocatedPid ? kernel.processManager.getProcess(frame.allocatedPid) : null;
              const color = proc?.getPcb().color || '#38BDF8';
              const isSelected = selectedPid === frame.allocatedPid;

              return (
                <div
                  key={frame.frameNumber}
                  onClick={() => frame.allocatedPid && setSelectedPid(frame.allocatedPid)}
                  className={`p-1 rounded text-center cursor-pointer transition-all duration-150 font-mono text-[10px] ${
                    frame.isFree
                      ? 'bg-slate-900 border border-white/5 text-slate-600 hover:border-slate-500'
                      : 'border text-white shadow-sm'
                  } ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                  style={!frame.isFree ? { backgroundColor: `${color}25`, borderColor: `${color}60` } : {}}
                  title={
                    frame.isFree
                      ? `Frame ${frame.frameNumber}: Free`
                      : `Frame ${frame.frameNumber}: PID ${frame.allocatedPid}, Page ${frame.pageNumber}`
                  }
                >
                  <div className="font-bold text-[9px] text-slate-400">F{frame.frameNumber}</div>
                  <div className="text-[10px] font-semibold truncate" style={{ color }}>
                    {frame.isFree ? '—' : `P${frame.allocatedPid}`}
                  </div>
                  {!frame.isFree && (
                    <div className="text-[8px] text-slate-400 flex justify-center gap-0.5">
                      <span>Pg{frame.pageNumber}</span>
                      {frame.isDirty && <span className="text-amber-400 font-bold">D</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Page Table & TLB Cache */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Page Table Inspector */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-slate-200 font-semibold text-xs">
              <span>Page Table: PID {effectivePid}</span>
              <select
                value={effectivePid}
                onChange={(e) => setSelectedPid(Number(e.target.value))}
                className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-400 font-mono text-[11px]"
              >
                {processes.map((p) => (
                  <option key={p.getPid()} value={p.getPid()}>
                    PID {p.getPid()} ({p.getName()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-auto max-h-[180px]">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-1">VIRT PAGE</th>
                    <th className="pb-1">FRAME #</th>
                    <th className="pb-1">PRESENT</th>
                    <th className="pb-1">DIRTY</th>
                    <th className="pb-1">PROT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pageTable ? (
                    Array.from(pageTable.values()).map((pte) => (
                      <tr key={pte.pageNumber} className="hover:bg-white/[0.02]">
                        <td className="py-1 text-slate-200">Page {pte.pageNumber}</td>
                        <td className="py-1 font-bold text-cyan-400">
                          {pte.frameNumber !== null ? `Frame ${pte.frameNumber}` : '—'}
                        </td>
                        <td className="py-1">
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] ${
                              pte.isPresent ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
                            }`}
                          >
                            {pte.isPresent ? '1 (RAM)' : '0 (Disk)'}
                          </span>
                        </td>
                        <td className="py-1 text-slate-400">{pte.isModified ? 'Yes' : 'No'}</td>
                        <td className="py-1 text-slate-400">{pte.protection}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        No page table available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Translation Lookaside Buffer (TLB) */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-slate-200 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Hardware TLB Cache ({tlbEntries.length}/16 entries)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 font-mono text-[9px]">
              {tlbEntries.slice(-8).map((entry, i) => (
                <div key={i} className="p-1 rounded bg-[#090D17] border border-amber-500/20 text-center">
                  <div className="text-amber-400 font-bold">P{entry.pid} : Pg{entry.pageNumber}</div>
                  <div className="text-slate-400">→ F{entry.frameNumber}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
