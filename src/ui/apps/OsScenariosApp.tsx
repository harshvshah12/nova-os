// ============================================================================
// NOVA OS — OS SCENARIOS & INTERACTIVE LAB WORKBENCH
// One-click educational demonstrations for scheduling, paging, deadlocks & disk
// ============================================================================

import React from 'react';
import { useOsStore } from '../../store/osStore';
import { PlayCircle, Cpu, Layers, AlertTriangle, HardDrive, GitFork, Play } from 'lucide-react';

interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  badge: string;
  run: (store: any) => void;
}

export const OsScenariosApp: React.FC = () => {
  const store = useOsStore();
  const { kernel, showNotification, openWindow } = useOsStore();

  const scenarios: ScenarioCard[] = [
    {
      id: 'cpu-battle',
      title: 'CPU Scheduling Competition',
      description: 'Spawns 4 diverse workloads (CPU compute, I/O seeker, memory loader, mixed) to benchmark Round Robin preemption vs Shortest Job First.',
      category: 'CPU Scheduling',
      icon: Cpu,
      badge: 'Interactive',
      run: () => {
        openWindow('scheduler-visualizer');
        for (let i = 1; i <= 4; i++) {
          kernel.processManager.createProcess(
            `task_${i}_${i % 2 === 0 ? 'cpu' : 'io'}`,
            `./task_${i}`,
            i % 2 === 0 ? 'CPU_BOUND' : 'IO_BOUND',
            { timestamp: kernel.clock.getTime() }
          );
        }
        showNotification('Launched CPU Scheduling benchmark processes', 'info');
      },
    },
    {
      id: 'memory-thrashing',
      title: 'Memory Pressure & Page Fault Storm',
      description: 'Allocates heavy memory spaces across multiple processes, saturating the 64 physical RAM frames to trigger page fault traps and LRU frame evictions.',
      category: 'Virtual Memory',
      icon: Layers,
      badge: 'Paging Demo',
      run: () => {
        openWindow('memory-analyzer');
        for (let i = 1; i <= 4; i++) {
          kernel.processManager.createProcess(
            `mem_consumer_${i}`,
            `./allocator --pages=16`,
            'MEMORY_INTENSIVE',
            { timestamp: kernel.clock.getTime() }
          );
        }
        showNotification('Heavy memory allocation underway — watch RAM Frame Map!', 'warn');
      },
    },
    {
      id: 'deadlock-trap',
      title: 'Banker’s Deadlock & Circular Wait',
      description: 'Injects the classic Coffman circular wait trap where Process A holds Resource 1 and requests Resource 2, while Process B holds Resource 2 and requests Resource 1.',
      category: 'Concurrency',
      icon: AlertTriangle,
      badge: 'Deadlock',
      run: () => {
        openWindow('deadlock-lab');
        kernel.deadlockDetector.injectClassicDeadlock(40, 41);
        showNotification('Circular wait deadlock injected into Resource Allocation Graph', 'warn');
      },
    },
    {
      id: 'disk-elevator',
      title: 'Disk Elevator Seek Race (SCAN vs FCFS)',
      description: 'Queues 10 scattered cylinder tracks (15, 185, 40, 160, 90, 25, 195) to demonstrate how the SCAN elevator algorithm minimizes physical head distance.',
      category: 'Storage',
      icon: HardDrive,
      badge: 'Disk Platter',
      run: () => {
        openWindow('disk-analyzer');
        const tracks = [15, 185, 40, 160, 90, 25, 195, 75, 130];
        tracks.forEach((trk) => {
          kernel.disk.queueRequest(1, trk, 0, 'READ', kernel.clock.getTime());
        });
        showNotification('Queued 9 scattered track requests on virtual disk', 'info');
      },
    },
    {
      id: 'fork-hierarchy',
      title: 'Process Hierarchy & Orphan Trees',
      description: 'Simulates fork() execution spawning a root supervisor with multiple child and grandchild processes to visualize PCB ancestry and state transitions.',
      category: 'Processes',
      icon: GitFork,
      badge: 'Process Tree',
      run: () => {
        openWindow('process-manager');
        const parent = kernel.processManager.createProcess('supervisor', './supervisor', 'MIXED', {
          timestamp: kernel.clock.getTime(),
        });
        const c1 = kernel.processManager.forkProcess(parent.getPid(), kernel.clock.getTime());
        const c2 = kernel.processManager.forkProcess(parent.getPid(), kernel.clock.getTime());
        if (c1) {
          kernel.processManager.forkProcess(c1.getPid(), kernel.clock.getTime());
        }
        showNotification('Spawned hierarchical process tree', 'info');
      },
    },
  ];

  return (
    <div className="h-full w-full p-4 overflow-y-auto bg-[#080C14] text-xs font-sans space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-cyan-400" />
          Interactive Operating Systems Lab
        </h2>
        <p className="text-slate-400 text-[11px]">
          One-click controlled demonstrations modeling classical OS scenarios directly on the simulation engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className="p-3.5 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col justify-between space-y-3 hover:border-cyan-500/30 transition-colors shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    {sc.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {sc.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-mono uppercase">{sc.category}</span>
                <button
                  onClick={() => sc.run(store)}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-colors text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Launch Scenario
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
