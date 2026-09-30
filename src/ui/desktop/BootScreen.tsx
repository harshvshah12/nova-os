// ============================================================================
// NOVA OS — BOOT SCREEN & BIOS LOADER
// Authentic sequential bootloader animation with hardware initialization logs
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { Power, Terminal } from 'lucide-react';

export const BootScreen: React.FC = () => {
  const { bootState, bootSteps, bootSystem, kernel } = useOsStore();
  const [bootInitiated, setBootInitiated] = useState(false);

  const hw = kernel.getHardwareConfig();

  const handleStartBoot = () => {
    setBootInitiated(true);
    bootSystem();
  };

  return (
    <div className="fixed inset-0 bg-[#05080E] text-slate-200 font-mono flex flex-col justify-between p-6 select-none z-50">
      {/* Top BIOS / Bootloader Header */}
      <div className="space-y-1">
        <div className="text-cyan-400 font-bold text-base flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          NOVA Virtual BIOS v0.1.0-sim (x86_64 Virtual Architecture)
        </div>
        <div className="text-xs text-slate-500">
          Google DeepMind Advanced Systems Simulation Environment
        </div>
        <div className="text-xs text-slate-400 pt-1">
          CPU: {hw.cores} Virtual Cores @ {hw.coreFrequencyMhz} MHz | RAM: {hw.ramTotalMb} MB | Disk: {hw.diskSizeGb} GB
        </div>
      </div>

      {/* Main Console Output */}
      <div className="flex-1 my-6 overflow-y-auto space-y-1 text-xs leading-relaxed max-w-3xl">
        {bootState === 'OFF' && !bootInitiated ? (
          <div className="py-12 space-y-4">
            <p className="text-slate-400">
              Virtual hardware is in standby. Press the button below to trigger power-on sequence and boot the simulated kernel.
            </p>
            <button
              onClick={handleStartBoot}
              className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Power className="w-4 h-4" />
              Power On Virtual Computer
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 animate-in fade-in">
            {bootSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">[  OK  ]</span>
                <span className="text-slate-300">{step.message}</span>
              </div>
            ))}
            {bootState === 'BOOTING' && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                <span>[ .... ]</span>
                <span>Initializing subsystems...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-[11px] text-slate-600 flex justify-between border-t border-white/5 pt-3">
        <span>NOVA OS Kernel 0.1.0 LTS</span>
        <span>Secure Virtual Boot Enabled</span>
      </div>
    </div>
  );
};
