// ============================================================================
// NOVA OS — WORKLOAD GENERATOR
// Synthetic and real-world instruction streams for CPU, I/O, and Memory
// ============================================================================

import type { Instruction, WorkloadType } from '../types';

export class WorkloadGenerator {
  public static createInstructions(
    type: WorkloadType,
    length: number = 8
  ): Instruction[] {
    switch (type) {
      case 'CPU_BOUND':
        return this.createCpuBound(length);
      case 'IO_BOUND':
        return this.createIoBound(length);
      case 'MEMORY_INTENSIVE':
        return this.createMemoryIntensive(length);
      case 'MIXED':
      default:
        return this.createMixed(length);
    }
  }

  public static createCpuBound(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      const cycles = Math.floor(Math.random() * 4) + 4; // 4 to 7 cycles
      list.push({
        type: 'CPU',
        cycles,
        cyclesRemaining: cycles,
        description: `Compute loop #${i + 1} (matrix/vector)`,
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Process exit syscall',
    });
    return list;
  }

  public static createIoBound(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      list.push({
        type: 'CPU',
        cycles: 1,
        cyclesRemaining: 1,
        description: 'Prepare I/O buffer',
      });
      list.push({
        type: 'IO_REQUEST',
        cycles: 1,
        cyclesRemaining: 1,
        ioTrack: Math.floor(Math.random() * 180) + 10,
        description: `Disk seek track ${(i * 25) % 190}`,
      });
      list.push({
        type: 'WAIT',
        cycles: 3,
        cyclesRemaining: 3,
        description: 'Wait for disk controller interrupt',
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Exit syscall',
    });
    return list;
  }

  public static createMemoryIntensive(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    // Access several virtual pages (some will trigger page faults)
    const pages = [0, 1, 4, 7, 2, 9, 12, 3, 14, 5];

    for (let i = 0; i < length; i++) {
      const page = pages[i % pages.length];
      const isWrite = i % 2 === 1;

      list.push({
        type: 'CPU',
        cycles: 1,
        cyclesRemaining: 1,
        description: 'Compute memory address pointer',
      });
      list.push({
        type: isWrite ? 'MEMORY_WRITE' : 'MEMORY_READ',
        cycles: 2,
        cyclesRemaining: 2,
        address: page * 4096 + (i * 64),
        description: `${isWrite ? 'Write' : 'Read'} Virtual Page ${page} (0x${(page * 4096).toString(16)})`,
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Exit syscall',
    });
    return list;
  }

  public static createMixed(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      const mod = i % 3;
      if (mod === 0) {
        list.push({
          type: 'CPU',
          cycles: 3,
          cyclesRemaining: 3,
          description: `Computation step ${i + 1}`,
        });
      } else if (mod === 1) {
        list.push({
          type: 'MEMORY_READ',
          cycles: 2,
          cyclesRemaining: 2,
          address: (i % 6) * 4096,
          description: `Load cache from virtual page ${i % 6}`,
        });
      } else {
        list.push({
          type: 'IO_REQUEST',
          cycles: 1,
          cyclesRemaining: 1,
          ioTrack: (i * 30) % 199,
          description: 'Synchronize file descriptors',
        });
      }
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Normal process exit',
    });
    return list;
  }

  public static createAppWorkload(name: string): Instruction[] {
    switch (name.toLowerCase()) {
      case 'bash':
      case 'terminal':
        return [
          { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Poll terminal input' },
          { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for user keystroke' },
          { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Echo stdout' },
        ];

      case 'editor':
      case 'text-editor':
        return [
          { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Render buffer' },
          { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Update document text in memory' },
          { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 40, description: 'Auto-save buffer to virtual disk' },
        ];

      case 'monitor':
      case 'system-monitor':
        return [
          { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Read /proc statistics' },
          { type: 'MEMORY_READ', cycles: 1, cyclesRemaining: 1, address: 0x1000, description: 'Inspect memory table' },
          { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Sleep until next sample interval' },
        ];

      case 'compiler':
        return this.createCpuBound(12);

      default:
        return this.createMixed(6);
    }
  }
}
