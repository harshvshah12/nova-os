// ============================================================================
// NOVA OS — PROCESS & PROCESS CONTROL BLOCK (PCB)
// Full state transitions, instruction execution pipeline, and metrics
// ============================================================================

import type {
  PCB,
  ProcessState,
  Instruction,
  WorkloadType,
  ProcessPriority,
  SimulationTime,
  CpuRegisters,
} from '../types';
import { createDefaultRegisters } from '../hardware/Cpu';

const PROCESS_COLORS = [
  '#38BDF8', // Sky
  '#34D399', // Emerald
  '#F472B6', // Pink
  '#FBBF24', // Amber
  '#A78BFA', // Violet
  '#FB923C', // Orange
  '#4ADE80', // Green
  '#2DD4BF', // Teal
  '#818CF8', // Indigo
  '#E879F9', // Fuchsia
];

export class Process {
  private pcb: PCB;

  constructor(
    pid: number,
    name: string,
    command: string,
    instructions: Instruction[],
    workloadType: WorkloadType = 'MIXED',
    options?: {
      ppid?: number;
      uid?: number;
      gid?: number;
      priority?: number;
      nice?: number;
      creationTime?: SimulationTime;
      virtualPagesCount?: number;
    }
  ) {
    const colorIndex = pid % PROCESS_COLORS.length;
    const virtualPagesCount = options?.virtualPagesCount || 8;
    const virtualPages = Array.from({ length: virtualPagesCount }, (_, i) => i);

    this.pcb = {
      pid,
      ppid: options?.ppid ?? 1,
      uid: options?.uid ?? 1000,
      gid: options?.gid ?? 1000,
      name,
      command,
      state: 'NEW',
      priority: options?.priority ?? 120, // Normal priority
      nice: options?.nice ?? 0,
      dynamicPriority: options?.priority ?? 120,
      cpuTime: 0,
      memoryUsageBytes: virtualPagesCount * 4096,
      programCounter: 0,
      registers: createDefaultRegisters(),
      instructions: instructions.map((inst) => ({ ...inst })),
      parentPid: options?.ppid ?? null,
      childrenPids: [],
      openFiles: [
        { fd: 0, path: '/dev/stdin', mode: 'r', cursor: 0 },
        { fd: 1, path: '/dev/stdout', mode: 'w', cursor: 0 },
        { fd: 2, path: '/dev/stderr', mode: 'w', cursor: 0 },
      ],
      pendingSignals: [],
      creationTime: options?.creationTime ?? 0,
      firstScheduledTime: null,
      lastReadyTime: options?.creationTime ?? 0,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: 0,
      completionTime: null,
      exitCode: null,
      allocatedFrames: [],
      virtualPages,
      workloadType,
      color: PROCESS_COLORS[colorIndex],
    };
  }

  public getPcb(): Readonly<PCB> {
    return this.pcb;
  }

  public getPid(): number {
    return this.pcb.pid;
  }

  public getName(): string {
    return this.pcb.name;
  }

  public getState(): ProcessState {
    return this.pcb.state;
  }

  public setState(newState: ProcessState, timestamp: SimulationTime): void {
    const oldState = this.pcb.state;
    this.pcb.state = newState;

    if (newState === 'READY') {
      this.pcb.lastReadyTime = timestamp;
    }

    if (newState === 'RUNNING' && this.pcb.firstScheduledTime === null) {
      this.pcb.firstScheduledTime = timestamp;
      this.pcb.responseTime = timestamp - this.pcb.creationTime;
    }

    if (newState === 'TERMINATED' && this.pcb.completionTime === null) {
      this.pcb.completionTime = timestamp;
      this.pcb.turnaroundTime = timestamp - this.pcb.creationTime;
    }
  }

  public getCurrentInstruction(): Instruction | null {
    if (this.pcb.programCounter >= this.pcb.instructions.length) {
      return null;
    }
    return this.pcb.instructions[this.pcb.programCounter];
  }

  public advanceInstruction(): Instruction | null {
    this.pcb.programCounter++;
    this.pcb.registers.rip = 0x00400000 + this.pcb.programCounter * 4;
    return this.getCurrentInstruction();
  }

  public addCpuTime(deltaMs: number): void {
    this.pcb.cpuTime += deltaMs;
  }

  public addWaitingTime(deltaMs: number): void {
    if (this.pcb.state === 'READY') {
      this.pcb.waitingTime += deltaMs;
    }
  }

  public setRegisters(regs: Partial<CpuRegisters>): void {
    this.pcb.registers = { ...this.pcb.registers, ...regs };
  }

  public setDynamicPriority(priority: number): void {
    this.pcb.dynamicPriority = Math.max(0, Math.min(139, priority));
  }

  public setNice(nice: number): void {
    this.pcb.nice = Math.max(-20, Math.min(19, nice));
    this.pcb.priority = 120 + this.pcb.nice;
    this.pcb.dynamicPriority = this.pcb.priority;
  }

  public setBlocked(reason: string, until?: SimulationTime): void {
    this.pcb.state = 'BLOCKED';
    this.pcb.blockedReason = reason;
    this.pcb.blockedUntil = until;
  }

  public unblock(): void {
    this.pcb.state = 'READY';
    this.pcb.blockedReason = undefined;
    this.pcb.blockedUntil = undefined;
  }

  public isFinished(): boolean {
    return this.pcb.programCounter >= this.pcb.instructions.length;
  }

  public terminate(exitCode: number = 0, timestamp: SimulationTime): void {
    this.pcb.state = 'TERMINATED';
    this.pcb.exitCode = exitCode;
    this.pcb.completionTime = timestamp;
    this.pcb.turnaroundTime = timestamp - this.pcb.creationTime;
  }

  public assignFrame(frameNumber: number): void {
    if (!this.pcb.allocatedFrames.includes(frameNumber)) {
      this.pcb.allocatedFrames.push(frameNumber);
    }
  }

  public removeFrame(frameNumber: number): void {
    this.pcb.allocatedFrames = this.pcb.allocatedFrames.filter((f) => f !== frameNumber);
  }

  public clearFrames(): void {
    this.pcb.allocatedFrames = [];
  }
}
