// ============================================================================
// NOVA OS — SCHEDULER VISUALIZER APPLICATION
// Live Gantt chart, interactive queue pipelines, multi-algorithm benchmarking
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useOsStore } from '../../store/osStore';
import type { SchedulerAlgorithm } from '../../simulation/types';
import { GitCommit, Play, Sliders, BarChart2 } from 'lucide-react';

export const SchedulerApp: React.FC = () => {
  const { kernel, setSchedulerAlgorithm } = useOsStore();
  const [, setTick] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(handle);
  }, []);

  const config = kernel.scheduler.getConfig();
  const metrics = kernel.scheduler.getMetrics();
  const readyQueue = kernel.processManager.getReadyProcesses();
  const blockedQueue = kernel.processManager.getBlockedProcesses();
  const cores = kernel.cpu.getCores();
  const slices = kernel.scheduler.getGanttSlices();

  // Draw Live Gantt Chart onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.fillStyle = '#070B12';
    ctx.fillRect(0, 0, width, height);

    // Draw horizontal lane per core
    const coreCount = cores.length;
    const laneHeight = (height - 30) / Math.max(1, coreCount);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    for (let c = 0; c < coreCount; c++) {
      const y = c * laneHeight;
      ctx.strokeRect(40, y, width - 40, laneHeight);

      ctx.fillStyle = '#64748B';
      ctx.font = '10px Fira Code';
      ctx.fillText(`Core ${c}`, 2, y + laneHeight / 2 + 3);
    }

    if (slices.length === 0) {
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText('Waiting for CPU scheduling execution slices...', width / 2 - 120, height / 2);
      return;
    }

    // Time window calculation
    const latestTime = kernel.clock.getTime();
    const timeWindow = 1500; // 1.5 simulated seconds visible
    const startTime = Math.max(0, latestTime - timeWindow);

    // Draw slices
    for (const slice of slices) {
      if (slice.endTime < startTime) continue;

      const xStart = 40 + ((Math.max(slice.startTime, startTime) - startTime) / timeWindow) * (width - 50);
      const xEnd = 40 + ((slice.endTime - startTime) / timeWindow) * (width - 50);
      const sliceWidth = Math.max(2, xEnd - xStart);
      const y = slice.coreId * laneHeight + 4;
      const h = laneHeight - 8;

      ctx.fillStyle = slice.color;
      ctx.beginPath();
      ctx.roundRect(xStart, y, sliceWidth, h, 3);
      ctx.fill();

      // Label PID inside block if wide enough
      if (sliceWidth > 26) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 9px Fira Code';
        ctx.fillText(`P${slice.pid}`, xStart + 4, y + h / 2 + 3);
      }
    }

    // Time axis at bottom
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px Fira Code';
    ctx.fillText(`${(startTime / 1000).toFixed(2)}s`, 40, height - 8);
    ctx.fillText(`${(latestTime / 1000).toFixed(2)}s`, width - 50, height - 8);
  }, [slices, cores, kernel.clock]);

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Configuration Bar */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Algorithm:</span>
          <select
            value={config.algorithm}
            onChange={(e) => setSchedulerAlgorithm(e.target.value as SchedulerAlgorithm)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-400 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
          >
            <option value="RR">Round Robin (RR)</option>
            <option value="FCFS">First-Come First-Served (FCFS)</option>
            <option value="SJF">Shortest Job First (SJF)</option>
            <option value="SRTF">Shortest Remaining Time First (SRTF)</option>
            <option value="PRIORITY">Priority Scheduling</option>
            <option value="MLQ">Multilevel Queue (MLQ)</option>
            <option value="MLFQ">Multilevel Feedback Queue (MLFQ)</option>
          </select>
        </div>

        {/* Quantum tuning (for RR) */}
        {config.algorithm === 'RR' && (
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span>Time Quantum:</span>
            <input
              type="range"
              min="10"
              max="80"
              step="10"
              value={config.timeQuantum}
              onChange={(e) => kernel.scheduler.setTimeQuantum(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold">{config.timeQuantum}ms</span>
          </div>
        )}

        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
          <span>Context Switches:</span>
          <span className="text-emerald-400 font-bold">{metrics.totalContextSwitches}</span>
        </div>
      </div>

      {/* Live Scrolling Gantt Chart Canvas */}
      <div className="p-3 border-b border-white/5 bg-[#0A0E1A]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            Live Execution Gantt Chart (Real-Time Streams)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1.5s sliding window</span>
        </div>
        <div className="rounded overflow-hidden border border-white/10 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={130}
            className="w-full h-[130px] block"
          />
        </div>
      </div>

      {/* Queues & Cores Visualization */}
      <div className="flex-1 overflow-auto p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Ready Queue Pipeline */}
        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              READY QUEUE ({readyQueue.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {readyQueue.length === 0 ? (
              <div className="text-slate-500 text-center py-6">Ready queue is empty</div>
            ) : (
              readyQueue.map((p) => {
                const pcb = p.getPcb();
                return (
                  <div
                    key={pcb.pid}
                    className="p-2 rounded bg-[#090D17] border border-cyan-500/20 flex items-center justify-between text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pcb.color }} />
                      <span className="font-bold text-slate-200">PID {pcb.pid}</span>
                      <span className="text-slate-400 text-[10px] font-sans truncate max-w-[80px]">{pcb.name}</span>
                    </div>
                    <span className="text-cyan-400">Pri: {pcb.dynamicPriority}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CPU Cores Dispatch Slots */}
        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE CPU CORES
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {cores.map((c) => {
              const currentProc = c.currentPid ? kernel.processManager.getProcess(c.currentPid) : null;
              return (
                <div
                  key={c.id}
                  className={`p-2 rounded border text-[11px] font-mono space-y-1 ${
                    c.currentPid
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-900 border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Core {c.id}</span>
                    <span className="text-emerald-400">{c.utilization}%</span>
                  </div>
                  {currentProc ? (
                    <div className="text-[10px] text-slate-300 truncate">
                      Running: <span className="font-bold text-emerald-300">PID {currentProc.getPid()}</span> ({currentProc.getName()})
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600">State: IDLE</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked / Waiting Queue */}
        <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              I/O WAITING ({blockedQueue.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {blockedQueue.length === 0 ? (
              <div className="text-slate-500 text-center py-6">No processes waiting for I/O</div>
            ) : (
              blockedQueue.map((p) => {
                const pcb = p.getPcb();
                return (
                  <div
                    key={pcb.pid}
                    className="p-2 rounded bg-[#090D17] border border-amber-500/20 text-[11px] font-mono space-y-0.5"
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-amber-400">PID {pcb.pid}</span>
                      <span className="text-[10px] text-slate-400">{pcb.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {pcb.blockedReason || 'I/O synchronization'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Comparative Metrics Footer */}
      <div className="p-2.5 bg-[#0D1322] border-t border-white/5 grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
        <div>Avg Wait: <span className="text-cyan-400 font-bold">{metrics.averageWaitingTime}ms</span></div>
        <div>Avg Turnaround: <span className="text-emerald-400 font-bold">{metrics.averageTurnaroundTime}ms</span></div>
        <div>Avg Response: <span className="text-violet-400 font-bold">{metrics.averageResponseTime}ms</span></div>
        <div>Completed: <span className="text-amber-400 font-bold">{metrics.throughput} tasks</span></div>
      </div>
    </div>
  );
};
