// ============================================================================
// NOVA OS — PROCESS MANAGER
// Lifecycle management, PCB table, state transitions, signals, and process tree
// ============================================================================

import type {
  PCB,
  ProcessState,
  WorkloadType,
  SimulationTime,
  Instruction,
} from '../types';
import { Process } from './Process';
import { WorkloadGenerator } from './WorkloadGenerator';
import type { EventBus } from '../runtime/EventBus';

export class ProcessManager {
  private processes: Map<number, Process> = new Map();
  private nextPid: number = 1;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public createProcess(
    name: string,
    command: string,
    workloadType: WorkloadType = 'MIXED',
    options?: {
      ppid?: number;
      uid?: number;
      gid?: number;
      priority?: number;
      nice?: number;
      instructions?: Instruction[];
      timestamp?: SimulationTime;
      virtualPagesCount?: number;
    }
  ): Process {
    const pid = this.nextPid++;
    const timestamp = options?.timestamp ?? 0;
    const instructions =
      options?.instructions ?? WorkloadGenerator.createInstructions(workloadType, 8);

    const process = new Process(pid, name, command, instructions, workloadType, {
      ...options,
      creationTime: timestamp,
    });

    this.processes.set(pid, process);

    // If parent process exists, update its child list
    if (options?.ppid && this.processes.has(options.ppid)) {
      const parent = this.processes.get(options.ppid)!;
      (parent.getPcb() as PCB).childrenPids.push(pid);
    }

    // Set state to READY
    process.setState('READY', timestamp);

    this.eventBus?.emit(
      'PROCESS_CREATE',
      'process',
      'ProcessManager',
      `Process created: PID ${pid} (${name}) [${workloadType}]`,
      timestamp,
      {
        pid,
        metadata: { name, command, priority: process.getPcb().priority, workloadType },
        explanation: `Kernel initialized Process Control Block for PID ${pid} (${name}) with ${instructions.length} instructions and placed it into the READY queue.`,
      }
    );

    return process;
  }

  public forkProcess(parentPid: number, timestamp: SimulationTime): Process | null {
    const parent = this.processes.get(parentPid);
    if (!parent) return null;

    const parentPcb = parent.getPcb();
    const childPid = this.nextPid++;

    const childInstructions = parentPcb.instructions
      .slice(parentPcb.programCounter)
      .map((inst) => ({ ...inst }));

    const child = new Process(
      childPid,
      `${parentPcb.name}_child`,
      parentPcb.command,
      childInstructions.length > 0 ? childInstructions : WorkloadGenerator.createMixed(4),
      parentPcb.workloadType,
      {
        ppid: parentPid,
        uid: parentPcb.uid,
        gid: parentPcb.gid,
        priority: parentPcb.priority,
        nice: parentPcb.nice,
        creationTime: timestamp,
      }
    );

    this.processes.set(childPid, child);
    (parent.getPcb() as PCB).childrenPids.push(childPid);
    child.setState('READY', timestamp);

    this.eventBus?.emit(
      'PROCESS_CREATE',
      'process',
      'ProcessManager',
      `fork(): Child PID ${childPid} created from Parent PID ${parentPid}`,
      timestamp,
      {
        pid: childPid,
        metadata: { parentPid, childPid },
        explanation: `The fork() system call duplicated the parent process execution state, assigning child PID ${childPid} with independent memory space and PCB.`,
      }
    );

    return child;
  }

  public terminateProcess(
    pid: number,
    exitCode: number = 0,
    timestamp: SimulationTime
  ): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;

    // Do not terminate init PID 1
    if (pid === 1) {
      console.warn('Attempted to kill init PID 1 — ignoring');
      return false;
    }

    process.terminate(exitCode, timestamp);

    this.eventBus?.emit(
      'PROCESS_TERMINATE',
      'process',
      'ProcessManager',
      `Process terminated: PID ${pid} (${process.getName()}) with exit code ${exitCode}`,
      timestamp,
      {
        pid,
        metadata: {
          exitCode,
          cpuTime: process.getPcb().cpuTime,
          turnaroundTime: process.getPcb().turnaroundTime,
        },
        explanation: `Process PID ${pid} exited. The kernel will reclaim its CPU allocation, release physical frames, and notify the parent process.`,
      }
    );

    return true;
  }

  public sendSignal(pid: number, signal: number, timestamp: SimulationTime): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;

    const pcb = process.getPcb() as PCB;
    pcb.pendingSignals.push(signal);

    const sigNames: Record<number, string> = {
      2: 'SIGINT',
      9: 'SIGKILL',
      15: 'SIGTERM',
      18: 'SIGCONT',
      19: 'SIGSTOP',
    };
    const sigName = sigNames[signal] || `SIG(${signal})`;

    this.eventBus?.emit(
      'SIGNAL_SENT',
      'process',
      'ProcessManager',
      `Signal ${sigName} sent to PID ${pid} (${process.getName()})`,
      timestamp,
      { pid, metadata: { signal, sigName } }
    );

    if (signal === 9 || signal === 15) {
      // SIGKILL or SIGTERM
      this.terminateProcess(pid, signal === 9 ? 137 : 143, timestamp);
    } else if (signal === 19) {
      // SIGSTOP
      process.setState('SUSPENDED', timestamp);
    } else if (signal === 18) {
      // SIGCONT
      if (process.getState() === 'SUSPENDED') {
        process.setState('READY', timestamp);
      }
    }

    return true;
  }

  public blockProcess(pid: number, reason: string, until?: SimulationTime, timestamp: SimulationTime = 0): void {
    const process = this.processes.get(pid);
    if (process && process.getState() !== 'TERMINATED') {
      process.setBlocked(reason, until);
      this.eventBus?.emit(
        'PROCESS_BLOCK',
        'process',
        'ProcessManager',
        `PID ${pid} blocked: ${reason}`,
        timestamp,
        { pid, metadata: { reason, until } }
      );
    }
  }

  public wakeProcess(pid: number, timestamp: SimulationTime = 0): void {
    const process = this.processes.get(pid);
    if (process && process.getState() === 'BLOCKED') {
      process.unblock();
      this.eventBus?.emit(
        'PROCESS_WAKE',
        'process',
        'ProcessManager',
        `PID ${pid} (${process.getName()}) unblocked and moved to READY`,
        timestamp,
        { pid }
      );
    }
  }

  public getProcess(pid: number): Process | undefined {
    return this.processes.get(pid);
  }

  public getAllProcesses(): Process[] {
    return Array.from(this.processes.values());
  }

  public getActiveProcesses(): Process[] {
    return this.getAllProcesses().filter(
      (p) => p.getState() !== 'TERMINATED' && p.getState() !== 'ZOMBIE'
    );
  }

  public getReadyProcesses(): Process[] {
    return this.getAllProcesses().filter((p) => p.getState() === 'READY');
  }

  public getBlockedProcesses(): Process[] {
    return this.getAllProcesses().filter((p) => p.getState() === 'BLOCKED');
  }

  public getRunningProcesses(): Process[] {
    return this.getAllProcesses().filter((p) => p.getState() === 'RUNNING');
  }

  public checkBlockedTimeouts(currentTime: SimulationTime): void {
    for (const process of this.getBlockedProcesses()) {
      const pcb = process.getPcb();
      if (pcb.blockedUntil !== undefined && currentTime >= pcb.blockedUntil) {
        this.wakeProcess(pcb.pid, currentTime);
      }
    }
  }

  public reset(): void {
    this.processes.clear();
    this.nextPid = 1;
  }
}
