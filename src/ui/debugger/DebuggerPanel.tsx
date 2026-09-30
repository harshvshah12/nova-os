// ============================================================================
// NOVA OS — DEBUGGER & REGISTER INSPECTOR PANEL
// Low-level CPU hardware registers, instruction stepping, and MMU inspection
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { Bug, Play, StepForward, FastForward, Cpu } from 'lucide-react';

export const DebuggerPanel: React.FC = () => {
  const { kernel, operatingMode, stepTick, toggleSimulation, isRunning } = useOsStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(handle);
  }, []);

  if (operatingMode !== 'DEBUG') return null;

  const core0 = kernel.cpu.getCore(0);
  const regs = core0?.registers;
  const currentInst = core0?.currentInstruction;
  const runningProcess = core0?.currentPid ? kernel.processManager.getProcess(core0.currentPid) : null;

  return (
    <div className="absolute top-11 right-4 w-84 max-h-[calc(100vh-140px)] bg-[#0C121E]/95 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-40 overflow-hidden flex flex-col text-xs font-sans">
      {/* Header */}
      <div className="p-3 bg-[#171D2D] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-100 text-xs">Kernel & Hardware Debugger</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Core 0 Trap
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
        {/* Step Controls */}
        <div className="p-2.5 rounded bg-slate-900 border border-white/5 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Step Execution Control</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSimulation}
              className={`flex-1 py-1.5 rounded font-sans font-medium text-xs flex items-center justify-center gap-1 ${
                isRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => stepTick(1)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-sans font-medium flex items-center gap-1"
              title="Step 1 Tick (10ms)"
            >
              <StepForward className="w-3 h-3" />
              +1 Tick
            </button>
            <button
              onClick={() => stepTick(5)}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-sans font-medium"
              title="Step 5 Ticks"
            >
              +5
            </button>
          </div>
        </div>

        {/* Current Core Execution Context */}
        <div className="p-2.5 rounded bg-slate-900 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Execution Pipeline (Core 0)</div>
          <div className="text-slate-300 text-[11px]">
            Target: {runningProcess ? (
              <span className="text-emerald-400 font-bold">PID {runningProcess.getPid()} ({runningProcess.getName()})</span>
            ) : (
              <span className="text-slate-500">IDLE Loop</span>
            )}
          </div>
          <div className="text-slate-400 text-[10px] truncate">
            Instruction: <span className="text-cyan-300">{currentInst?.description || currentInst?.type || 'NOP (Waiting)'}</span>
          </div>
          {currentInst && (
            <div className="text-slate-500 text-[10px]">
              Cycles remaining: {currentInst.cyclesRemaining} / {currentInst.cycles}
            </div>
          )}
        </div>

        {/* CPU Hardware Registers (x86_64 style) */}
        {regs && (
          <div className="p-2.5 rounded bg-slate-900 border border-white/5 space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Virtual CPU Registers</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div><span className="text-slate-500">rax:</span> <span className="text-cyan-300">0x{regs.rax.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rbx:</span> <span className="text-cyan-300">0x{regs.rbx.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rcx:</span> <span className="text-cyan-300">0x{regs.rcx.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rdx:</span> <span className="text-cyan-300">0x{regs.rdx.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rsi:</span> <span className="text-slate-300">0x{regs.rsi.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rdi:</span> <span className="text-slate-300">0x{regs.rdi.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rip:</span> <span className="text-amber-400 font-bold">0x{regs.rip.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rsp:</span> <span className="text-slate-300">0x{regs.rsp.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">rbp:</span> <span className="text-slate-300">0x{regs.rbp.toString(16).padStart(8, '0')}</span></div>
              <div><span className="text-slate-500">flags:</span> <span className="text-emerald-400">0x{regs.flags.toString(16).padStart(4, '0')}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
