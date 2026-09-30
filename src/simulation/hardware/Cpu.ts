// ============================================================================
// NOVA OS — VIRTUAL CPU (MULTI-CORE & REGISTERS)
// Real simulated instruction cycles, core telemetry, and register tracking
// ============================================================================

import type {
  CpuCore,
  CpuCoreState,
  CpuRegisters,
  Instruction,
} from '../types';

export function createDefaultRegisters(): CpuRegisters {
  return {
    rax: 0,
    rbx: 0,
    rcx: 0,
    rdx: 0,
    rsi: 0,
    rdi: 0,
    rbp: 0x7fffffffe000,
    rsp: 0x7fffffffdff0,
    rip: 0x00400000,
    flags: 0x0002, // IF (Interrupt Flag) set
  };
}

export class VirtualCpu {
  private cores: CpuCore[] = [];
  private coreCount: number = 4;
  private frequencyMhz: number = 2400;
  private coreCycleHistory: boolean[][] = []; // true if busy, false if idle
  private readonly historyWindowSize: number = 20;

  constructor(coreCount: number = 4, frequencyMhz: number = 2400) {
    this.coreCount = coreCount;
    this.frequencyMhz = frequencyMhz;
    this.initCores();
  }

  public initCores(): void {
    this.cores = [];
    this.coreCycleHistory = [];
    for (let i = 0; i < this.coreCount; i++) {
      this.cores.push({
        id: i,
        state: 'IDLE',
        currentPid: null,
        registers: createDefaultRegisters(),
        currentInstruction: null,
        utilization: 0,
        instructionsExecuted: 0,
        ticksSinceLastSwitch: 0,
      });
      this.coreCycleHistory.push([]);
    }
  }

  public getCores(): CpuCore[] {
    return this.cores;
  }

  public getCore(id: number): CpuCore | undefined {
    return this.cores[id];
  }

  public getCoreCount(): number {
    return this.coreCount;
  }

  public setCoreCount(newCount: number): void {
    if (newCount < 1) newCount = 1;
    if (newCount > 8) newCount = 8;
    this.coreCount = newCount;
    this.initCores();
  }

  public getFrequencyMhz(): number {
    return this.frequencyMhz;
  }

  public assignProcessToCore(
    coreId: number,
    pid: number,
    registers?: CpuRegisters
  ): void {
    const core = this.cores[coreId];
    if (!core) return;

    core.currentPid = pid;
    core.state = 'RUNNING';
    core.ticksSinceLastSwitch = 0;
    if (registers) {
      core.registers = { ...registers };
    }
  }

  public releaseCore(coreId: number): void {
    const core = this.cores[coreId];
    if (!core) return;

    core.currentPid = null;
    core.state = 'IDLE';
    core.currentInstruction = null;
    core.ticksSinceLastSwitch = 0;
  }

  public setCoreInstruction(coreId: number, instruction: Instruction | null): void {
    const core = this.cores[coreId];
    if (core) {
      core.currentInstruction = instruction;
    }
  }

  public updateCoreRegisters(coreId: number, registers: Partial<CpuRegisters>): void {
    const core = this.cores[coreId];
    if (core) {
      core.registers = { ...core.registers, ...registers };
    }
  }

  /**
   * Execute 1 hardware tick across all cores
   * Returns an array of instructions completed during this tick
   */
  public tick(): { coreId: number; completedInstruction: Instruction | null; pid: number | null }[] {
    const results: { coreId: number; completedInstruction: Instruction | null; pid: number | null }[] = [];

    for (let i = 0; i < this.coreCount; i++) {
      const core = this.cores[i];
      core.ticksSinceLastSwitch++;

      const isBusy = core.currentPid !== null && core.state === 'RUNNING';

      // Update utilization sliding window
      const history = this.coreCycleHistory[i];
      history.push(isBusy);
      if (history.length > this.historyWindowSize) {
        history.shift();
      }
      const busyCount = history.filter(Boolean).length;
      core.utilization = Math.round((busyCount / history.length) * 100);

      let completedInst: Instruction | null = null;

      if (isBusy && core.currentInstruction) {
        // Decrement instruction cycle counter
        core.currentInstruction.cyclesRemaining--;

        // Simulate register activity
        core.registers.rip += 4;
        core.registers.rax = (core.registers.rax + 1) & 0xffffffff;

        if (core.currentInstruction.cyclesRemaining <= 0) {
          completedInst = core.currentInstruction;
          core.instructionsExecuted++;
          core.currentInstruction = null;
        }
      }

      results.push({
        coreId: i,
        completedInstruction: completedInst,
        pid: core.currentPid,
      });
    }

    return results;
  }

  /**
   * Average CPU utilization across all cores
   */
  public getAverageUtilization(): number {
    if (this.cores.length === 0) return 0;
    const sum = this.cores.reduce((acc, c) => acc + c.utilization, 0);
    return Math.round(sum / this.cores.length);
  }
}
