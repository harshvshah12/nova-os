// ============================================================================
// NOVA OS — DESKTOP TOP BAR COMPONENT
// System panel with simulation clock controls, mode selector, and telemetry pills
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import type { ClockSpeed, OperatingMode } from '../../simulation/types';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Power,
  Cpu,
  Layers,
  HardDrive,
  Compass,
  GraduationCap,
  Bug,
  LayoutGrid,
} from 'lucide-react';

interface TopBarProps {
  onToggleLauncher: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleLauncher }) => {
  const {
    kernel,
    formattedTime,
    isRunning,
    speed,
    operatingMode,
    toggleSimulation,
    stepTick,
    setSpeed,
    setOperatingMode,
    restartSystem,
    windows,
    activeWindowId,
  } = useOsStore();

  const [showPowerMenu, setShowPowerMenu] = useState(false);

  const activeWin = windows.find((w) => w.id === activeWindowId);
  const avgCpu = kernel.cpu.getAverageUtilization();
  const ramPercent = kernel.ram.getMemoryUtilization();
  const currentTrack = kernel.disk.getCurrentTrack();

  const speeds: ClockSpeed[] = [0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0];

  return (
    <div className="h-9 px-3 bg-[#090D17]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between select-none z-50 text-xs font-sans text-slate-200">
      {/* Left Section: NOVA Logo, Launcher, Active App */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLauncher}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-cyan-400 font-bold tracking-wider transition-colors"
          title="Application Launcher"
        >
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span>NOVA OS</span>
        </button>

        {activeWin && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 font-medium text-slate-300">
            <span>{activeWin.title}</span>
          </div>
        )}
      </div>

      {/* Middle Section: Simulation Clock & Controls */}
      <div className="flex items-center gap-2 bg-[#0F1626] px-2.5 py-1 rounded-full border border-white/10">
        {/* Play/Pause */}
        <button
          onClick={toggleSimulation}
          className={`p-1 rounded-full hover:bg-white/10 transition-colors ${
            isRunning ? 'text-emerald-400' : 'text-amber-400'
          }`}
          title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Step Tick */}
        <button
          onClick={() => stepTick(1)}
          className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Step 1 Simulation Tick (10ms)"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as ClockSpeed)}
          className="bg-transparent text-[11px] font-mono text-cyan-400 border-none outline-none cursor-pointer"
          title="Simulation Speed Multiplier"
        >
          {speeds.map((s) => (
            <option key={s} value={s} className="bg-slate-900 text-slate-200">
              {s}x
            </option>
          ))}
        </select>

        {/* Virtual Clock Display */}
        <div className="font-mono text-[11px] font-semibold text-slate-200 pl-1.5 border-l border-white/10 tracking-wider">
          {formattedTime}
        </div>
      </div>

      {/* Right Section: Mode Selector & Hardware Status Pills */}
      <div className="flex items-center gap-2">
        {/* Mode Selector */}
        <div className="flex items-center rounded-lg bg-[#0F1626] p-0.5 border border-white/10 text-[10px] font-medium">
          <button
            onClick={() => setOperatingMode('NORMAL')}
            className={`px-2 py-0.5 rounded transition-colors ${
              operatingMode === 'NORMAL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setOperatingMode('LEARNING')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              operatingMode === 'LEARNING' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            Learning
          </button>
          <button
            onClick={() => setOperatingMode('DEBUG')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              operatingMode === 'DEBUG' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bug className="w-3 h-3" />
            Debug
          </button>
        </div>

        {/* Live Hardware Telemetry Pills */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-white/5 flex items-center gap-1 text-cyan-400">
            <Cpu className="w-3 h-3" />
            {avgCpu}%
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-white/5 flex items-center gap-1 text-emerald-400">
            <Layers className="w-3 h-3" />
            {ramPercent}%
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-white/5 flex items-center gap-1 text-amber-400">
            <HardDrive className="w-3 h-3" />
            T{currentTrack}
          </span>
        </div>

        {/* Power / Restart Menu */}
        <div className="relative">
          <button
            onClick={() => setShowPowerMenu(!showPowerMenu)}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100 transition-colors"
            title="System Power Menu"
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {showPowerMenu && (
            <div className="absolute right-0 top-8 w-44 bg-[#0F1626] border border-white/10 rounded-lg shadow-2xl p-1 z-50 space-y-1">
              <button
                onClick={() => {
                  setShowPowerMenu(false);
                  restartSystem();
                }}
                className="w-full px-2.5 py-1.5 rounded hover:bg-white/10 text-left flex items-center gap-2 text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Restart Virtual OS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
