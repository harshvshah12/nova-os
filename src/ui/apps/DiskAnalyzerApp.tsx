// ============================================================================
// NOVA OS — DISK PLATER & HEAD ANALYZER APPLICATION
// Animated platter cylinders, magnetic actuator arm, and elevator algorithm visualizer
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import type { DiskSchedulingAlgorithm } from '../../simulation/types';
import { HardDrive, Play, Plus, Sliders } from 'lucide-react';

export const DiskAnalyzerApp: React.FC = () => {
  const { kernel, setDiskAlgorithm } = useOsStore();
  const [, setTick] = useState(0);
  const [targetTrack, setTargetTrack] = useState<number>(120);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 150);
    return () => clearInterval(handle);
  }, []);

  const disk = kernel.disk;
  const state = disk.getState();

  const handleQueueRequest = () => {
    disk.queueRequest(1, targetTrack, 0, 'READ', kernel.clock.getTime());
  };

  const handleRandomBurst = () => {
    const sampleTracks = [25, 80, 15, 170, 95, 40, 190, 60];
    sampleTracks.forEach((trk) => {
      disk.queueRequest(1, trk, 0, 'READ', kernel.clock.getTime());
    });
  };

  // Platter head angle calculation (0 to 199 mapped to 0 to 100% radius)
  const headRadiusPercent = 25 + (state.currentTrack / 199) * 65;

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Configuration Bar */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Disk Algorithm:</span>
          <select
            value={state.algorithm}
            onChange={(e) => setDiskAlgorithm(e.target.value as DiskSchedulingAlgorithm)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-amber-500/30 text-amber-400 font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
          >
            <option value="SCAN">SCAN (Elevator)</option>
            <option value="LOOK">LOOK (Optimized Elevator)</option>
            <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
            <option value="C-LOOK">C-LOOK (Circular LOOK)</option>
            <option value="SSTF">SSTF (Shortest Seek Time First)</option>
            <option value="FCFS">FCFS (First-Come First-Served)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomBurst}
            className="px-2.5 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono border border-amber-500/30"
          >
            Inject 8 Track Requests
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Animated Disk Platter SVG */}
        <div className="p-4 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col items-center justify-center relative min-h-[280px]">
          <span className="text-slate-400 font-semibold text-xs absolute top-3 left-3">
            Simulated Disk Platter (200 Cylinders)
          </span>

          <svg className="w-56 h-56" viewBox="0 0 200 200">
            {/* Outer spindle & concentric tracks */}
            <circle cx="100" cy="100" r="92" fill="#0D1424" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="35" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="16" fill="#1E293B" stroke="#475569" strokeWidth="2" />

            {/* Target Pending Request markers */}
            {state.pendingRequests.map((req) => {
              const r = 20 + (req.track / 199) * 70;
              return (
                <circle
                  key={req.id}
                  cx="100"
                  cy={100 - r}
                  r="3.5"
                  fill="#F59E0B"
                  className="animate-pulse"
                />
              );
            })}

            {/* Actuator Head Ring */}
            <circle
              cx="100"
              cy="100"
              r={20 + (state.currentTrack / 199) * 70}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.5"
              strokeOpacity="0.8"
            />

            {/* Actuator Arm */}
            <line
              x1="20"
              y1="180"
              x2="100"
              y2={100 - (20 + (state.currentTrack / 199) * 70)}
              stroke="#38BDF8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy={100 - (20 + (state.currentTrack / 199) * 70)}
              r="4"
              fill="#06B6D4"
              stroke="#FFF"
              strokeWidth="1.5"
            />
          </svg>

          <div className="font-mono text-center mt-2 space-y-0.5">
            <div className="text-amber-400 font-bold text-sm">Cylinder / Track: {state.currentTrack} / 199</div>
            <div className="text-[11px] text-slate-400">Head Sweep: {state.headDirection} | Total Seek Distance: {state.totalHeadMovements} tracks</div>
          </div>
        </div>

        {/* Request Queue & Manual Injection */}
        <div className="space-y-3 flex flex-col">
          {/* Manual Request Creator */}
          <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
            <span className="font-semibold text-slate-200 block text-xs">Seek Track Request</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="199"
                value={targetTrack}
                onChange={(e) => setTargetTrack(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-cyan-400 font-mono text-xs outline-none"
              />
              <button
                onClick={handleQueueRequest}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Queue Seek
              </button>
            </div>
          </div>

          {/* Pending Queue List */}
          <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 flex-1 flex flex-col space-y-2">
            <span className="font-semibold text-slate-200 text-xs">
              Pending Disk Requests ({state.pendingRequests.length})
            </span>
            <div className="flex-1 overflow-auto max-h-[160px] space-y-1">
              {state.pendingRequests.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">No pending cylinder seek requests</div>
              ) : (
                state.pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-1.5 rounded bg-[#090D17] border border-amber-500/20 text-[11px] font-mono flex justify-between items-center"
                  >
                    <span className="text-amber-300 font-bold">Track {req.track}</span>
                    <span className="text-slate-400">PID {req.pid} ({req.type})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
