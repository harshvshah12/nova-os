// ============================================================================
// NOVA OS — MEMORY ANALYZER APPLICATION
// 4KB Paged Virtual Memory (524,288 Physical Frames for 2048 MB RAM),
// Physical Frame Inspector, 64-Segment Memory Map, MMU Address Translation,
// TLB Hardware Cache, Swap Partition, and Interactive Page Fault Pipeline
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import type { PageReplacementAlgorithm } from '../../simulation/types';
import {
  Layers,
  Zap,
  HardDrive,
  Cpu,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';

export const MemoryAnalyzerApp: React.FC = () => {
  const { kernel, setMemoryReplacement } = useOsStore();
  const [, setTick] = useState(0);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  // MMU Address Translation inputs
  const [inputAddress, setInputAddress] = useState<string>('0x00003064');

  // Frame window pagination (showing 64 frames per page)
  const [frameWindowStart, setFrameWindowStart] = useState<number>(0);
  const [jumpFrameInput, setJumpFrameInput] = useState<string>('0');

  // Animated Page Fault Pipeline State
  const [activeFaultStep, setActiveFaultStep] = useState<number | null>(null);
  const [isSimulatingFault, setIsSimulatingFault] = useState<boolean>(false);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(handle);
  }, []);

  const ram = kernel.ram;
  const mm = kernel.memoryManager;
  const totalFrames = ram.getFrameCount();
  const metrics = mm.getMetrics();
  const tlbEntries = mm.getTlb();
  const processes = kernel.processManager.getActiveProcesses();

  // Get bucketed overview (64 segments of 32MB each)
  const bucketSummaries = ram.getBucketSummaries(64);

  // Get the 64 frames in the current window
  const windowFrames = ram.getFrameWindow(frameWindowStart, 64);

  // Selected process page table
  const effectivePid = selectedPid || (processes[0]?.getPid() ?? 1);
  const pageTable = mm.getPageTable(effectivePid);

  // Parse virtual address
  const parsedAddress = inputAddress.startsWith('0x')
    ? parseInt(inputAddress, 16)
    : parseInt(inputAddress, 10) || 0;

  const translation = mm.translateVirtualAddress(parsedAddress, effectivePid);

  // Jump to frame
  const handleJumpFrame = () => {
    const val = parseInt(jumpFrameInput, 10);
    if (!isNaN(val) && val >= 0 && val < totalFrames) {
      setFrameWindowStart(Math.floor(val / 64) * 64);
    }
  };

  // Jump to process frames
  const handleJumpToProcessFrames = (pid: number) => {
    const procFrames = ram.getFramesByPid(pid);
    if (procFrames.length > 0) {
      const firstFrame = procFrames[0].frameNumber;
      setFrameWindowStart(Math.floor(firstFrame / 64) * 64);
      setJumpFrameInput(firstFrame.toString());
    }
    setSelectedPid(pid);
  };

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
          const syntheticUnmapped =
            (Math.max(...(pageTable ? Array.from(pageTable.keys()) : [0]), 0) + 1) * 4096 + 0x42;
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
          <div>
            Total RAM:{' '}
            <span className="text-cyan-400 font-bold">
              {ram.getTotalMb()} MB ({totalFrames.toLocaleString()} Frames)
            </span>
          </div>
          <div>
            Page Size: <span className="text-cyan-400 font-bold">4 KB (4096B)</span>
          </div>
          <div>
            Page Faults: <span className="text-amber-400 font-bold">{metrics.totalPageFaults}</span>
          </div>
          <div>
            Replacements: <span className="text-red-400 font-bold">{metrics.pageReplacements}</span>
          </div>
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
        {/* Left Column: Physical RAM Map & 64-Frame Window */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Segmented 64-Bucket Physical Memory Map (32 MB per segment) */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Physical Address Space (64 Segments × 32 MB = 2,048 MB)
              </span>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="text-slate-400">
                  Allocated: <span className="text-cyan-400 font-bold">{metrics.usedFrames.toLocaleString()}</span> frames ({((metrics.usedFrames / (totalFrames || 1)) * 100).toFixed(2)}%)
                </span>
                <span className="text-slate-400">
                  Free: <span className="text-emerald-400 font-bold">{metrics.freeFrames.toLocaleString()}</span> frames
                </span>
              </div>
            </div>

            {/* 64 Segments Bar */}
            <div className="grid grid-cols-16 sm:grid-cols-32 md:grid-cols-64 gap-0.5 p-1.5 bg-[#090D17] rounded border border-white/5">
              {bucketSummaries.map((b) => {
                const isWindowInBucket =
                  frameWindowStart >= b.startFrame && frameWindowStart <= b.endFrame;

                return (
                  <div
                    key={b.bucketIndex}
                    onClick={() => {
                      setFrameWindowStart(b.startFrame);
                      setJumpFrameInput(b.startFrame.toString());
                    }}
                    className={`h-5 rounded-xs cursor-pointer transition-all duration-150 relative group ${
                      isWindowInBucket ? 'ring-1 ring-cyan-400 z-10' : ''
                    } ${
                      b.usedFrames > 0
                        ? 'bg-cyan-500 hover:bg-cyan-400'
                        : 'bg-slate-800/80 hover:bg-slate-700'
                    }`}
                    style={{
                      opacity: b.usedFrames > 0 ? Math.max(0.4, b.utilizationPercent / 100) : 0.25,
                    }}
                    title={`Segment #${b.bucketIndex}: Frames ${b.startFrame.toLocaleString()} - ${b.endFrame.toLocaleString()} (32 MB) | Used: ${b.usedFrames} frames (${b.utilizationPercent}%)`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>0x00000000 (0 MB)</span>
              <span>1024 MB</span>
              <span>0x7FFFFFFF (2048 MB)</span>
            </div>
          </div>

          {/* 64-Frame Window Inspector */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>
                  Physical Frame Window: Frames #{frameWindowStart.toLocaleString()} – #
                  {(frameWindowStart + 63).toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  (0x{(frameWindowStart * 4096).toString(16).toUpperCase().padStart(8, '0')} - 0x
                  {((frameWindowStart + 64) * 4096 - 1).toString(16).toUpperCase().padStart(8, '0')})
                </span>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <button
                  onClick={() => {
                    const prev = Math.max(0, frameWindowStart - 64);
                    setFrameWindowStart(prev);
                    setJumpFrameInput(prev.toString());
                  }}
                  disabled={frameWindowStart === 0}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200"
                  title="Previous 64 Frames"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(totalFrames - 64, frameWindowStart + 64);
                    setFrameWindowStart(next);
                    setJumpFrameInput(next.toString());
                  }}
                  disabled={frameWindowStart >= totalFrames - 64}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200"
                  title="Next 64 Frames"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1 ml-2">
                  <span className="text-slate-400">Jump to F#:</span>
                  <input
                    type="number"
                    value={jumpFrameInput}
                    onChange={(e) => setJumpFrameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJumpFrame()}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-300 font-mono text-[10px] outline-none"
                  />
                  <button
                    onClick={handleJumpFrame}
                    className="p-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300"
                    title="Jump"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 8x8 Grid of the 64 Frames in Current Window */}
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#090D17] rounded border border-white/5">
              {windowFrames.map((frame) => {
                const proc = frame.allocatedPid ? kernel.processManager.getProcess(frame.allocatedPid) : null;
                const color = proc?.getPcb().color || '#38BDF8';
                const isSelected = selectedPid === frame.allocatedPid;

                return (
                  <div
                    key={frame.frameNumber}
                    onClick={() => {
                      if (frame.allocatedPid) {
                        setSelectedPid(frame.allocatedPid);
                      }
                    }}
                    className={`p-1 rounded text-center cursor-pointer transition-all duration-150 font-mono text-[10px] ${
                      frame.isFree
                        ? 'bg-slate-900 border border-white/5 text-slate-600 hover:border-slate-500'
                        : 'border text-white shadow-sm'
                    } ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                    style={!frame.isFree ? { backgroundColor: `${color}25`, borderColor: `${color}60` } : {}}
                    title={
                      frame.isFree
                        ? `Frame #${frame.frameNumber}: Free (4 KB) | Physical Addr: 0x${(frame.frameNumber * 4096).toString(16).toUpperCase()}`
                        : `Frame #${frame.frameNumber}: PID ${frame.allocatedPid}, Virtual Page ${frame.pageNumber} (${frame.isDirty ? 'Dirty' : 'Clean'}) | Physical Addr: 0x${(frame.frameNumber * 4096).toString(16).toUpperCase()}`
                    }
                  >
                    <div className="font-bold text-[9px] text-slate-400 truncate">F{frame.frameNumber}</div>
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
                MMU Address Translation (Paging Math: 4KB Pages)
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
                onChange={(e) => handleJumpToProcessFrames(Number(e.target.value))}
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
                          {pte.frameNumber !== null ? (
                            <button
                              onClick={() => {
                                setFrameWindowStart(Math.floor(pte.frameNumber! / 64) * 64);
                                setJumpFrameInput(pte.frameNumber!.toString());
                              }}
                              className="hover:underline text-cyan-300"
                            >
                              Frame {pte.frameNumber}
                            </button>
                          ) : (
                            '—'
                          )}
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

          {/* Interactive Page Fault Pipeline Animator */}
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
