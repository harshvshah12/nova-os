import { describe, it, expect } from 'vitest';
import { ProcessManager } from '../simulation/processes/ProcessManager';
import { VirtualCpu } from '../simulation/hardware/Cpu';
import { EventBus } from '../simulation/runtime/EventBus';
import { SchedulerEngine } from '../simulation/scheduler/SchedulerEngine';

describe('Phase 3 & 4 — Processes & CPU Scheduler', () => {
  it('ProcessManager creates, forks, and manages process states', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);

    const p1 = pm.createProcess('shell', '/bin/bash', 'MIXED');
    expect(p1.getPid()).toBe(1);
    expect(p1.getState()).toBe('READY');

    const child = pm.forkProcess(p1.getPid(), 10);
    expect(child).not.toBeNull();
    expect(child?.getPid()).toBe(2);
    expect(p1.getPcb().childrenPids).toContain(2);

    pm.terminateProcess(2, 0, 50);
    expect(child?.getState()).toBe('TERMINATED');
    expect(child?.getPcb().turnaroundTime).toBe(40);
  });

  it('Scheduler executes Round Robin with quantum expiration', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);
    const cpu = new VirtualCpu(1, 2400); // 1 core for deterministic test
    const scheduler = new SchedulerEngine(pm, cpu, bus, 'RR');
    scheduler.setTimeQuantum(20); // 2 ticks

    // Create 2 processes
    const p1 = pm.createProcess('p1', 'work1', 'CPU_BOUND');
    const p2 = pm.createProcess('p2', 'work2', 'CPU_BOUND');

    // Tick 1 (10ms): Core 0 was idle, schedules p1
    scheduler.tick(10);
    expect(cpu.getCore(0)?.currentPid).toBe(p1.getPid());
    expect(p1.getState()).toBe('RUNNING');

    // Tick 2 (20ms): Core 0 runs 1 cycle on p1
    cpu.tick();
    scheduler.tick(20);
    expect(cpu.getCore(0)?.currentPid).toBe(p1.getPid());

    // Tick 3 (30ms): Core 0 runs 2nd cycle -> hit quantum limit (20ms) -> preempted to READY, p2 is scheduled
    cpu.tick();
    scheduler.tick(30);
    expect(cpu.getCore(0)?.currentPid).toBe(p2.getPid());
    expect(p2.getState()).toBe('RUNNING');
    expect(p1.getState()).toBe('READY');
  });

  it('Scheduler Priority algorithm selects highest priority process', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);
    const cpu = new VirtualCpu(1, 2400);
    const scheduler = new SchedulerEngine(pm, cpu, bus, 'PRIORITY');

    // Low priority (value 130) vs High priority (value 80)
    const pLow = pm.createProcess('batch', 'job', 'CPU_BOUND', { priority: 130 });
    const pHigh = pm.createProcess('sys', 'urgent', 'CPU_BOUND', { priority: 80 });

    scheduler.tick(10);
    // Should select pHigh first because 80 < 130
    expect(cpu.getCore(0)?.currentPid).toBe(pHigh.getPid());
  });

  it('Live Gantt chart slices are recorded correctly', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);
    const cpu = new VirtualCpu(1, 2400);
    const scheduler = new SchedulerEngine(pm, cpu, bus, 'FCFS');

    const p1 = pm.createProcess('worker', 'run', 'CPU_BOUND');
    scheduler.tick(10);
    scheduler.tick(20);

    const slices = scheduler.getGanttSlices();
    expect(slices.length).toBeGreaterThan(0);
    expect(slices[0].pid).toBe(p1.getPid());
  });
});
