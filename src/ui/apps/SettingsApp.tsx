// ============================================================================
// NOVA OS — SYSTEM SETTINGS APPLICATION
// Virtual Hardware Configuration and Simulation Defaults
// ============================================================================

import React from 'react';
import { useOsStore } from '../../store/osStore';
import { Settings, Cpu, Layers, HardDrive, Wifi, Sliders } from 'lucide-react';

export const SettingsApp: React.FC = () => {
  const { kernel, operatingMode, setOperatingMode, showNotification } = useOsStore();
  const hw = kernel.getHardwareConfig();

  const handleCoresChange = (cores: number) => {
    kernel.cpu.setCoreCount(cores);
    showNotification(`Virtual CPU reconfigured to ${cores} cores`, 'info');
  };

  return (
    <div className="h-full w-full p-4 overflow-y-auto bg-[#080C14] text-xs font-sans space-y-4">
      <div className="space-y-1 border-b border-white/5 pb-3">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          Virtual Machine & System Settings
        </h2>
        <p className="text-slate-400 text-[11px]">
          Configure simulated hardware components and operating system execution parameters.
        </p>
      </div>

      <div className="space-y-3">
        {/* Hardware Specs Card */}
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-3">
          <span className="font-semibold text-slate-200 block text-xs">Virtual CPU Cores</span>
          <div className="flex items-center gap-2">
            {[1, 2, 4, 8].map((c) => (
              <button
                key={c}
                onClick={() => handleCoresChange(c)}
                className={`px-3 py-1.5 rounded font-mono font-medium transition-colors ${
                  kernel.cpu.getCoreCount() === c
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {c} {c === 1 ? 'Core' : 'Cores'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Simulated Frequency: {hw.coreFrequencyMhz} MHz (x86_64 architecture)</span>
        </div>

        {/* Operating Mode Selector */}
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
          <span className="font-semibold text-slate-200 block text-xs">Operating System Mode</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'NORMAL', label: 'Normal Mode', desc: 'Standard desktop OS interface' },
              { id: 'LEARNING', label: 'Learning Mode', desc: 'Contextual academic explanations' },
              { id: 'DEBUG', label: 'Debug Mode', desc: 'Low-level CPU registers & stepping' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setOperatingMode(m.id as any)}
                className={`p-2.5 rounded text-left border transition-colors space-y-1 ${
                  operatingMode === m.id
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs">{m.label}</div>
                <div className="text-[10px] opacity-75">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Static Spec Overview */}
        <div className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2 font-mono text-[11px] text-slate-300">
          <span className="font-semibold text-slate-200 block text-xs font-sans">Simulated Hardware Manifest</span>
          <div className="grid grid-cols-2 gap-2">
            <div>RAM Allocation: <span className="text-emerald-400">{hw.ramTotalMb} MB</span></div>
            <div>Page Size: <span className="text-emerald-400">{hw.pageSizeKb} KB</span></div>
            <div>Storage Capacity: <span className="text-amber-400">{hw.diskSizeGb} GB</span></div>
            <div>Network Adapter: <span className="text-violet-400">{hw.networkInterface} ({hw.ipAddress})</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
