// ============================================================================
// NOVA OS — LEARNING MODE PANEL ("Why Did This Happen?")
// Real-time academic explanation engine linking simulation events to OS theory
// ============================================================================

import React from 'react';
import { useOsStore } from '../../store/osStore';
import { BookOpen, HelpCircle, Lightbulb, CheckCircle2, ChevronRight } from 'lucide-react';

export const LearningPanel: React.FC = () => {
  const { lastExplanation, recentEvents, operatingMode } = useOsStore();

  if (operatingMode !== 'LEARNING') return null;

  return (
    <div className="absolute top-11 right-4 w-80 max-h-[calc(100vh-140px)] bg-[#0C121E]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-40 overflow-hidden flex flex-col text-xs font-sans">
      {/* Header */}
      <div className="p-3 bg-[#111A2C] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs">Learning Mode: OS Internals</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Why Did This Happen Card */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why Did This Happen?</span>
          </div>
          <p className="text-slate-200 text-[11px] leading-relaxed">
            {lastExplanation ||
              'Watching kernel event stream... As processes run, page faults occur, or scheduling quantum expires, academic explanations appear here.'}
          </p>
        </div>

        {/* Operating Systems Core Concepts Guide */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-300 text-[11px] flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Operating Systems Lab Reference
          </span>

          <div className="space-y-1.5 text-[11px]">
            <details className="p-2 rounded bg-slate-900 border border-white/5 cursor-pointer text-slate-300 group">
              <summary className="font-medium text-cyan-300 list-none flex justify-between items-center">
                <span>1. Round Robin Scheduling</span>
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-1.5 text-slate-400 leading-relaxed text-[10px]">
                Each process receives a fixed time slice (quantum). If the process is still running when the timer interrupt fires, a context switch preempts it to the back of the Ready queue.
              </p>
            </details>

            <details className="p-2 rounded bg-slate-900 border border-white/5 cursor-pointer text-slate-300 group">
              <summary className="font-medium text-cyan-300 list-none flex justify-between items-center">
                <span>2. Virtual Memory & Page Faults</span>
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-1.5 text-slate-400 leading-relaxed text-[10px]">
                Processes use virtual addresses. When an address maps to a page whose present bit is 0, CPU Interrupt 0x0E triggers a Page Fault. The kernel must allocate a physical RAM frame or evict an existing one using LRU.
              </p>
            </details>

            <details className="p-2 rounded bg-slate-900 border border-white/5 cursor-pointer text-slate-300 group">
              <summary className="font-medium text-cyan-300 list-none flex justify-between items-center">
                <span>3. Coffman Deadlock Conditions</span>
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-1.5 text-slate-400 leading-relaxed text-[10px]">
                Four necessary conditions: (1) Mutual Exclusion, (2) Hold and Wait, (3) No Preemption, and (4) Circular Wait. Banker's Algorithm prevents deadlocks by rejecting unsafe state transitions.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
