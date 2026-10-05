// ============================================================================
// NOVA OS — MEMORY ANALYZER APPLICATION
// 4KB Paged Virtual Memory, Physical Frame Buffer, MMU Address Translation,
// TLB Hardware Cache, Swap Space Partition, and Interactive Page Fault Pipeline
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import type { PageReplacementAlgorithm } from '../../simulation/types';
import {
  Layers,
  Zap,
  HardDrive,
  Cpu,
  ArrowRight,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const MemoryAnalyzerApp: React.FC = () => {
  const { kernel, setMemoryReplacement } = useOsStore();
  const [, setTick] = useState(0);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  // MMU Address Translation inputs
  const [inputAddress, setInputAddress] = useState<string>('0x00003064');

  // Animated Page Fault Pipeline State
  const [activeFaultStep, setActiveFaultStep] = useState<number | null>(null);
  const [isSimulatingFault, setIsSimulatingFault] = useState<boolean>(false);

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

  // Parse virtual address
  const parsedAddress = inputAddress.startsWith('0x')
    ? parseInt(inputAddress, 16)
    : parseInt(inputAddress, 10) || 0;

  const translation = mm.translateVirtualAddress(parsedAddress, effectivePid);

  // Trigger Step-by-Step Page Fault Walkthrough
  const handleTriggerPageFaultSimulation = () => {
    if (isSimulatingFault) return;
    setIsSimulatingFault(true);
    setActiveFaultStep(1);

    // Step through the 8 stages
    const stepIntervals = [600, 1200, 1800, 2400, 3000, 3600, 4200, 4800];
    stepIntervals.forEach((delay, index) => {
      setTimeout(() => {
        setActiveFaultStep(index + 1);
        if (index === 5) {
          // Perform real memory access at an unmapped address to mutate engine state
          const syntheticUnmapped = (Math.max(...(pageTable ? Array.from(pageTable.keys()) : [0])) + 1) * 4096 + 0x42;
          mm.accessMemory(effectivePid, syntheticUnmapped, false, kernel.clock.getTime());
        }
        if (index === stepIntervals.length - 1) {
          setTimeout(() => {
            setIsSimulatingFault(false);
            setActiveFaultStep(null);
          }, 1500);
        }
      }, delay);
    });
  };

  const faultPipelineSteps = [
    { num: 1, label: 'CPU Virtual Address', desc: 'CPU issues 32-bit VA' },
    { num: 2, label: 'TLB Lookup', desc: 'Hardware TLB Miss' },
    { num: 3, label: 'Page Table', desc: 'PTE Present Bit = 0' },
    { num: 4, label: 'Interrupt 0x0E', desc: 'CPU Page Fault Trap' },
    { num: 5, label: 'Process BLOCKED', desc: 'Kernel context switch' },
    { num: 6, label: 'Disk/Swap I/O', desc: 'Page loaded into RAM' },
    { num: 7, label: 'Update PTE & TLB', desc: 'Present = 1, PFN stored' },
    { num: 8, label: 'Instruction Retry', desc: 'Process unblocked, RUNNING' },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans overflow-auto select-none">
      {/* Top Configuration & Telemetry Bar */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Page Replacement:</span>
          </div>
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

        <div className="flex items-center gap-4 font-mono text-[11px] flex-wrap">
          <div>Page Size: <span className="text-cyan-400 font-bold">4 KB (4096B)</span></div>
          <div>Page Faults: <span className="text-amber-400 font-bold">{metrics.totalPageFaults}</span></div>
          <div>Replacements: <span className="text-red-400 font-bold">{metrics.pageReplacements}</span></div>
          <div>
            TLB Hit Ratio:{' '}
            <span className="text-emerald-400 font-bold">
              {metrics.tlbHits + metrics.tlbMisses > 0
                ? `${Math.round((metrics.tlbHits / (metrics.tlbHits + metrics.tlbMisses)) * 100)}%`
                : '100%'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Swap:</span>
            <span className="text-purple-300 font-bold">
              {metrics.usedSwapSlots}/{metrics.totalSwapSlots} slots
            </span>
            <span className="text-slate-500 text-[10px]">(In: {metrics.swapIns} | Out: {metrics.swapOuts})</span>
          </div>
        </div>
      </div>

      <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        {/* Left Column: Physical RAM Frame Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold text-xs">
              <span>Physical RAM Frame Buffer ({frames.length} Frames × 4 KB = {frames.length * 4} KB)</span>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-slate-800 border border-white/20" /> Free ({metrics.freeFrames})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-cyan-500" /> Allocated ({metrics.usedFrames})
                </span>
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
                        ? `Frame ${frame.frameNumber}: Free (4 KB)`
                        : `Frame ${frame.frameNumber}: PID ${frame.allocatedPid}, Virtual Page ${frame.pageNumber} (${frame.isDirty ? 'Dirty' : 'Clean'})`
                    }
                  >
                    <div className="font-bold text-[9px] text-slate-400">F{frame.frameNumber}</div>
                    <div className="text-[10px] font-semibold truncate" style={{ color }}>
                      {frame.isFree ? '—' : `P${frame.allocatedPid}`}
                    </div>
                    {!frame.isFree && (
                      <div className="text-[8px] text-slate-400 flex justify-center gap-0.5">
                        <span>Pg{frame.pageNumber}</span>
                        {frame.isDirty && <span className="text-amber-400 font-bold" title="Dirty Page">D</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational MMU 32-bit Address Translation Breakdown */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2.5">
            <div className="flex justify-between items-center text-slate-200 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                MMU Address Translation (Paging Math)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">Virtual Address:</span>
                <input
                  type="text"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="0x00003064"
                  className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-400 font-mono text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Address Bitfield Decomposition */}
            <div className="grid grid-cols-12 gap-2 p-2 bg-[#090D17] rounded border border-white/5 font-mono text-[10px]">
              <div className="col-span-7 p-2 rounded bg-cyan-950/30 border border-cyan-800/40">
                <div className="text-cyan-400 font-semibold mb-0.5">Virtual Page Number (VPN) — 20 bits</div>
                <div className="text-slate-300">
                  Math: <code className="text-cyan-300">VA / 4096 = {translation.vpn}</code> (0x{translation.vpn.toString(16).toUpperCase()})
                </div>
              </div>
              <div className="col-span-5 p-2 rounded bg-indigo-950/30 border border-indigo-800/40">
                <div className="text-indigo-400 font-semibold mb-0.5">Page Offset — 12 bits</div>
                <div className="text-slate-300">
                  Math: <code className="text-indigo-300">VA % 4096 = {translation.offset}</code> (0x{translation.offset.toString(16).toUpperCase()})
                </div>
              </div>
            </div>

            {/* Translation Output Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-900/60 border border-white/5">
                <div className="text-slate-400 text-[9px]">TLB CACHE</div>
                <div className={translation.inTlb ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {translation.inTlb ? 'HIT (Cached)' : 'MISS'}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-white/5">
                <div className="text-slate-400 text-[9px]">PAGE STATUS</div>
                <div className={translation.isPresent ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {translation.isPresent ? 'PRESENT (In RAM)' : translation.swapBlockId !== null ? `SWAPPED (Slot #${translation.swapBlockId})` : 'NOT PRESENT'}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-white/5">
                <div className="text-slate-400 text-[9px]">PHYSICAL FRAME</div>
                <div className="text-cyan-400 font-bold">
                  {translation.frameNumber !== null ? `Frame #${translation.frameNumber}` : 'None (Page Fault)'}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-white/5">
                <div className="text-slate-400 text-[9px]">PHYSICAL ADDRESS</div>
                <div className="text-emerald-300 font-bold">
                  {translation.physicalAddress !== null ? `0x${translation.physicalAddress.toString(16).toUpperCase().padStart(8, '0')}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Page Table, TLB, and Page Fault Pipeline */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Page Table Inspector */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
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

            <div className="overflow-auto max-h-[160px]">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-1">VIRT PAGE</th>
                    <th className="pb-1">FRAME #</th>
                    <th className="pb-1">PRESENT</th>
                    <th className="pb-1">DIRTY</th>
                    <th className="pb-1">SWAP</th>
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
                            {pte.isPresent ? '1 (RAM)' : '0 (Fault)'}
                          </span>
                        </td>
                        <td className="py-1 text-slate-400">{pte.isModified ? 'Yes' : 'No'}</td>
                        <td className="py-1 text-purple-400">
                          {pte.swapBlockId !== null && pte.swapBlockId !== undefined ? `#${pte.swapBlockId}` : '—'}
                        </td>
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
              {tlbEntries.length === 0 && (
                <div className="col-span-4 py-2 text-center text-slate-500 text-[10px]">
                  TLB cache currently empty
                </div>
              )}
            </div>
          </div>

          {/* Interactive Page Fault Pipeline Animator (Section 7) */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-slate-200 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Page Fault Pipeline Walkthrough
              </span>
              <button
                onClick={handleTriggerPageFaultSimulation}
                disabled={isSimulatingFault}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center gap-1 disabled:opacity-50"
              >
                {isSimulatingFault ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Stepping...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Simulate Fault
                  </>
                )}
              </button>
            </div>

            {/* 8-Stage Pipeline Grid */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
              {faultPipelineSteps.map((step) => {
                const isActive = activeFaultStep === step.num;
                const isPast = activeFaultStep !== null && activeFaultStep > step.num;

                return (
                  <div
                    key={step.num}
                    className={`p-1.5 rounded border transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg ring-1 ring-amber-400 scale-102'
                        : isPast
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span>Step {step.num}</span>
                      {isPast && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <div className="text-[8.5px] font-semibold truncate">{step.label}</div>
                    <div className="text-[7.5px] opacity-75 truncate">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
