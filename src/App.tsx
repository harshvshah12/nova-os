// ============================================================================
// NOVA OS — MAIN APP COMPONENT
// Switches between BIOS Boot Screen and Interactive Desktop Environment
// ============================================================================

import React, { useEffect } from 'react';
import { useOsStore } from './store/osStore';
import { Desktop } from './ui/desktop/Desktop';
import { BootScreen } from './ui/desktop/BootScreen';
import { Power, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const { bootState, restartSystem } = useOsStore();

  if (bootState === 'OFF' || bootState === 'BOOTING') {
    return <BootScreen />;
  }

  if (bootState === 'SHUTDOWN') {
    return (
      <div className="fixed inset-0 bg-black text-slate-400 font-mono flex flex-col items-center justify-center space-y-4 select-none">
        <Power className="w-12 h-12 text-slate-700" />
        <div className="text-sm font-semibold">Virtual System Halted</div>
        <p className="text-xs text-slate-600">The simulated computer is safely powered down.</p>
        <button
          onClick={restartSystem}
          className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-400 text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Power On Again
        </button>
      </div>
    );
  }

  return <Desktop />;
};
