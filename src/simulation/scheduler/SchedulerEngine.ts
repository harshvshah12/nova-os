// ============================================================================
// NOVA OS — CPU SCHEDULER ENGINE
// Multi-algorithm scheduling (FCFS, SJF, SRTF, RR, Priority, MLQ, MLFQ)
// With multi-core dispatch, real context switching, and live Gantt tracking
// ============================================================================

import type {
  SchedulerAlgorithm,
  SchedulerConfig,
  SchedulerMetrics,
  GanttSlice,
  SimulationTime,
  PCB,
} from '../types';
import type { ProcessManager } from '../processes/ProcessManager';
import type { Process } from '../processes/Process';
import type { VirtualCpu } from '../hardware/Cpu';
import type { EventBus } from '../runtime/EventBus';

export class SchedulerEngine {
  private config: SchedulerConfig;
  private processManager: ProcessManager;
  private cpu: VirtualCpu;
  private eventBus?: EventBus;

  // MLFQ queues: [Level 0 (high priority, short quantum), Level 1, Level 2]
  private mlfqQueues: number[][] = [[], [], []];

  // Multilevel queues: [System, Interactive, Batch]
  private mlqQueues: {
    system: number[];
    interactive: number[];
    batch: number[];
  } = { system: [], interactive: [], batch: [] };

  // Live Gantt chart log
  private ganttSlices: GanttSlice[] = [];
  private readonly maxGanttSlices: number = 200;

  // Metrics
  private totalContextSwitches: number = 0;
  private ticksSinceAging: number = 0;

  constructor(
    processManager: ProcessManager,
    cpu: VirtualCpu,
    eventBus?: EventBus,
    initialAlgorithm: SchedulerAlgorithm = 'RR'
  ) {
    this.processManager = processManager;
    this.cpu = cpu;
    this.eventBus = eventBus;
    this.config = {
      algorithm: initialAlgorithm,
      timeQuantum: 20, // 20ms (2 ticks at 10ms/tick)
      preemptive: true,
      agingInterval: 10, // boost priority every 10 ticks
      mlfqQueues: [
        { level: 0, quantum: 10, priority: 100 },
        { level: 1, quantum: 20, priority: 120 },
        { level: 2, quantum: 40, priority: 139 },
      ],
    };
  }

  public getConfig(): Readonly<SchedulerConfig> {
    return this.config;
  }

  public setAlgorithm(algo: SchedulerAlgorithm): void {
    const oldAlgo = this.config.algorithm;
    this.config.algorithm = algo;

    this.eventBus?.emit(
      'CONTEXT_SWITCH',
      'scheduler',
      'SchedulerEngine',
      `Scheduler algorithm changed from ${oldAlgo} to ${algo}`,
      0,
      {
        metadata: { oldAlgo, newAlgo: algo },
        explanation: `Kernel switched scheduling policy to ${algo}. Ready queue dispatch ordering is now recomputed.`,
      }
    );
  }

  public setTimeQuantum(quantumMs: number): void {
    this.config.timeQuantum = Math.max(10, quantumMs);
  }

  public setPreemptive(preemptive: boolean): void {
    this.config.preemptive = preemptive;
  }

  public getGanttSlices(): GanttSlice[] {
    return this.ganttSlices.slice(-60); // Return most recent 60 slices for UI
  }

  public clearGantt(): void {
    this.ganttSlices = [];
  }

  public getMetrics(): SchedulerMetrics {
    const all = this.processManager.getAllProcesses();
    const completed = all.filter((p) => p.getState() === 'TERMINATED');

    let totalWait = 0;
    let totalTurnaround = 0;
    let totalResponse = 0;

    for (const p of all) {
      totalWait += p.getPcb().waitingTime;
      totalTurnaround += p.getPcb().turnaroundTime;
      totalResponse += p.getPcb().responseTime;
    }

    const count = all.length || 1;
    const completedCount = completed.length;

    return {
      totalContextSwitches: this.totalContextSwitches,
      averageWaitingTime: Math.round(totalWait / count),
      averageTurnaroundTime: Math.round(totalTurnaround / count),
      averageResponseTime: Math.round(totalResponse / count),
      cpuUtilization: this.cpu.getAverageUtilization(),
      throughput: completedCount,
    };
  }

  /**
   * Main scheduler dispatch tick
   * Evaluates all CPU cores, performs preemption or assigns next ready processes
   */
  public tick(currentTime: SimulationTime): void {
    // 1. Advance waiting times for processes waiting in READY queue
    const readyProcesses = this.processManager.getReadyProcesses();
    for (const p of readyProcesses) {
      p.addWaitingTime(10);
    }

    // 2. Handle Aging (prevents starvation in Priority scheduling & MLFQ)
    this.ticksSinceAging++;
    if (this.ticksSinceAging >= this.config.agingInterval) {
      this.ticksSinceAging = 0;
      this.applyAging(currentTime);
    }

    const cores = this.cpu.getCores();

    // 3. For each CPU core, check current running process status
    for (const core of cores) {
      const runningPid = core.currentPid;
      let shouldSwitch = false;
      let switchReason = '';

      if (runningPid !== null) {
        const runningProcess = this.processManager.getProcess(runningPid);

        if (!runningProcess || runningProcess.getState() === 'TERMINATED') {
          // Process exited
          shouldSwitch = true;
          switchReason = 'Process terminated';
          this.cpu.releaseCore(core.id);
        } else if (runningProcess.getState() === 'BLOCKED' || runningProcess.getState() === 'SUSPENDED') {
          // Process blocked on I/O or waiting
          shouldSwitch = true;
          switchReason = 'Process blocked for I/O / wait';
          this.cpu.releaseCore(core.id);
        } else {
          // Process is RUNNING on core: check time quantum / preemption
          runningProcess.addCpuTime(10);

          // Update active Gantt slice
          this.recordGanttSlice(
            runningPid,
            runningProcess.getName(),
            core.id,
            currentTime - 10,
            currentTime,
            runningProcess.getPcb().color
          );

          // Preemption checks
          if (this.config.algorithm === 'RR') {
            const runningMs = core.ticksSinceLastSwitch * 10;
            if (runningMs >= this.config.timeQuantum && readyProcesses.length > 0) {
              shouldSwitch = true;
              switchReason = `Round Robin quantum (${this.config.timeQuantum}ms) expired`;
              runningProcess.setState('READY', currentTime);
              this.cpu.releaseCore(core.id);
            }
          } else if (this.config.algorithm === 'SRTF') {
            // Check if any ready process has shorter remaining cycles than current
            const currentInst = runningProcess.getCurrentInstruction();
            const currentCycles = currentInst?.cyclesRemaining ?? 10;
            const shorterProcess = readyProcesses.find((p) => {
              const inst = p.getCurrentInstruction();
              return inst && inst.cyclesRemaining < currentCycles;
            });
            if (shorterProcess) {
              shouldSwitch = true;
              switchReason = `SRTF Preemption: PID ${shorterProcess.getPid()} has shorter remaining burst`;
              runningProcess.setState('READY', currentTime);
              this.cpu.releaseCore(core.id);
            }
          } else if (this.config.algorithm === 'MLFQ') {
            const runningMs = core.ticksSinceLastSwitch * 10;
            if (runningMs >= this.config.timeQuantum && readyProcesses.length > 0) {
              shouldSwitch = true;
              switchReason = 'MLFQ quantum expired (demoting process)';
              // Demote priority in MLFQ
              const currentPriority = runningProcess.getPcb().dynamicPriority;
              runningProcess.setDynamicPriority(Math.min(139, currentPriority + 10));
              runningProcess.setState('READY', currentTime);
              this.cpu.releaseCore(core.id);
            }
          }
        }
      }

      // If core is now idle or freed, pick next process from Ready queue
      if (core.state === 'IDLE' || core.currentPid === null) {
        const nextProcess = this.selectNextProcess();
        if (nextProcess) {
          const prevPid = runningPid;
          const nextPid = nextProcess.getPid();

          nextProcess.setState('RUNNING', currentTime);
          this.cpu.assignProcessToCore(core.id, nextPid, nextProcess.getPcb().registers);

          // Give core the first instruction
          this.cpu.setCoreInstruction(core.id, nextProcess.getCurrentInstruction());

          this.totalContextSwitches++;

          this.eventBus?.emit(
            'CONTEXT_SWITCH',
            'scheduler',
            'SchedulerEngine',
            `Context Switch on Core ${core.id}: ${prevPid ? `PID ${prevPid}` : 'Idle'} -> PID ${nextPid} (${nextProcess.getName()})`,
            currentTime,
            {
              coreId: core.id,
              pid: nextPid,
              metadata: {
                prevPid,
                nextPid,
                algorithm: this.config.algorithm,
                reason: switchReason || 'Core was idle',
              },
              explanation: `The ${this.config.algorithm} scheduler scheduled PID ${nextPid} (${nextProcess.getName()}) onto Core ${core.id}. Reason: ${switchReason || 'Core became available'}.`,
            }
          );
        }
      } else {
        // Keep core current instruction synced
        const runningProcess = this.processManager.getProcess(core.currentPid);
        if (runningProcess) {
          this.cpu.setCoreInstruction(core.id, runningProcess.getCurrentInstruction());
        }
      }
    }
  }

  /**
   * Selects the next process to execute based on current algorithm
   */
  private selectNextProcess(): Process | null {
    const ready = this.processManager.getReadyProcesses();
    if (ready.length === 0) return null;

    switch (this.config.algorithm) {
      case 'FCFS':
      case 'RR': {
        // FIFO order of arrival into Ready state based on lastReadyTime
        const sorted = [...ready].sort(
          (a, b) => a.getPcb().lastReadyTime - b.getPcb().lastReadyTime
        );
        return sorted[0];
      }

      case 'SJF':
      case 'SRTF': {
        // Shortest burst based on current instruction cycles remaining
        let shortest: Process = ready[0];
        let minCycles = shortest.getCurrentInstruction()?.cyclesRemaining ?? 10;

        for (let i = 1; i < ready.length; i++) {
          const cycles = ready[i].getCurrentInstruction()?.cyclesRemaining ?? 10;
          if (cycles < minCycles) {
            minCycles = cycles;
            shortest = ready[i];
          }
        }
        return shortest;
      }

      case 'PRIORITY': {
        // Lower numeric value = higher priority (0 highest, 139 lowest)
        let highestPri: Process = ready[0];
        for (let i = 1; i < ready.length; i++) {
          if (ready[i].getPcb().dynamicPriority < highestPri.getPcb().dynamicPriority) {
            highestPri = ready[i];
          }
        }
        return highestPri;
      }

      case 'MLQ': {
        // 1. System processes (Priority < 100)
        // 2. Interactive (Priority 100-119)
        // 3. Batch (Priority >= 120)
        const system = ready.filter((p) => p.getPcb().priority < 100);
        if (system.length > 0) return system[0];

        const interactive = ready.filter(
          (p) => p.getPcb().priority >= 100 && p.getPcb().priority < 120
        );
        if (interactive.length > 0) return interactive[0];

        return ready[0];
      }

      case 'MLFQ': {
        // Multi-level Feedback Queue based on dynamic priority
        let highest: Process = ready[0];
        for (let i = 1; i < ready.length; i++) {
          if (ready[i].getPcb().dynamicPriority < highest.getPcb().dynamicPriority) {
            highest = ready[i];
          }
        }
        return highest;
      }

      default:
        return ready[0];
    }
  }

  /**
   * Prevent starvation by boosting priority of long-waiting processes
   */
  private applyAging(currentTime: SimulationTime): void {
    const ready = this.processManager.getReadyProcesses();
    for (const process of ready) {
      const pcb = process.getPcb();
      if (pcb.waitingTime > 50 && pcb.dynamicPriority > 10) {
        // Boost priority by lowering numeric value
        process.setDynamicPriority(pcb.dynamicPriority - 5);
      }
    }
  }

  private recordGanttSlice(
    pid: number,
    name: string,
    coreId: number,
    startTime: SimulationTime,
    endTime: SimulationTime,
    color: string
  ): void {
    // If the last slice for this core was the same PID, extend it
    const lastSlice = this.ganttSlices
      .slice()
      .reverse()
      .find((s) => s.coreId === coreId);

    if (lastSlice && lastSlice.pid === pid && lastSlice.endTime === startTime) {
      lastSlice.endTime = endTime;
    } else {
      this.ganttSlices.push({
        pid,
        processName: name,
        coreId,
        startTime,
        endTime,
        color,
      });

      if (this.ganttSlices.length > this.maxGanttSlices) {
        this.ganttSlices.shift();
      }
    }
  }

  public reset(): void {
    this.ganttSlices = [];
    this.totalContextSwitches = 0;
    this.ticksSinceAging = 0;
  }
}
