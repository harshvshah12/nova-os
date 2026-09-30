import { describe, it, expect } from 'vitest';
import { Kernel } from '../simulation/kernel/Kernel';

describe('Phase 2 & 9 — Integrated Kernel & Subsystems', () => {
  it('boots the virtual machine and transitions to RUNNING', async () => {
    const kernel = new Kernel({ cores: 4, ramTotalMb: 2048 });
    expect(kernel.getBootState()).toBe('OFF');

    await kernel.boot();
    expect(kernel.getBootState()).toBe('RUNNING');
    expect(kernel.getBootSteps().length).toBeGreaterThan(5);

    // Initial system processes should exist
    const processes = kernel.processManager.getAllProcesses();
    expect(processes.length).toBeGreaterThanOrEqual(3);
    expect(processes[0].getName()).toBe('systemd');
  });

  it('populates and serves real-time /proc files from simulated subsystems', async () => {
    const kernel = new Kernel();
    await kernel.boot();

    // /proc/cpuinfo
    const cpuInfo = kernel.vfs.readFile('/proc/cpuinfo');
    expect(cpuInfo).toContain('NOVA Virtual Core');
    expect(cpuInfo).toContain('processor\t: 0');

    // /proc/meminfo
    const memInfo = kernel.vfs.readFile('/proc/meminfo');
    expect(memInfo).toContain('MemTotal:');
    expect(memInfo).toContain('PageFaults:');

    // /proc/scheduler
    const schedInfo = kernel.vfs.readFile('/proc/scheduler');
    expect(schedInfo).toContain('Algorithm:\tRR');
  });

  it('runs master tick loop, executes instructions, and reclaims memory on exit', async () => {
    const kernel = new Kernel();
    await kernel.boot();
    kernel.clock.pause(); // deterministic stepping

    // Create a 1-instruction process that exits
    const p = kernel.processManager.createProcess('quick_task', './run', 'CPU_BOUND', {
      instructions: [
        { type: 'CPU', cycles: 1, cyclesRemaining: 1 },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1 },
      ],
    });

    // Step clock a few ticks to schedule, execute, and exit
    for (let t = 1; t <= 10; t++) {
      kernel.tick(t * 10, 10);
    }

    expect(p.getState()).toBe('TERMINATED');
    expect(kernel.memoryManager.getPageTable(p.getPid())).toBeUndefined();
  });
});
