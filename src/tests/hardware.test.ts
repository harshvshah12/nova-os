import { describe, it, expect } from 'vitest';
import { SimulationClock } from '../simulation/runtime/Clock';
import { EventBus } from '../simulation/runtime/EventBus';
import { VirtualCpu } from '../simulation/hardware/Cpu';
import { VirtualRam } from '../simulation/hardware/Ram';
import { VirtualDisk } from '../simulation/hardware/Disk';
import { VirtualNetworkAdapter } from '../simulation/hardware/NetworkAdapter';

describe('Phase 1 — Virtual Hardware & Runtime', () => {
  it('SimulationClock advances time deterministically in step mode', () => {
    const clock = new SimulationClock();
    expect(clock.getTime()).toBe(0);

    clock.stepTick(5); // 5 ticks * 10ms = 50ms
    expect(clock.getTime()).toBe(50);
    expect(clock.getTotalTicks()).toBe(5);
    expect(clock.getFormattedTime()).toBe('00:00.050');
  });

  it('EventBus records events in ring buffer and dispatches to subscribers', () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.subscribe('ALL', (e) => received.push(e.type));
    bus.emit('SYSTEM_BOOT', 'kernel', 'bootloader', 'System booting...', 0);
    bus.emit('CPU_TICK', 'cpu', 'timer', 'Timer interrupt', 10);

    expect(received).toEqual(['SYSTEM_BOOT', 'CPU_TICK']);
    expect(bus.getHistory().length).toBe(2);
    expect(bus.getHistory('kernel').length).toBe(1);
  });

  it('VirtualCpu executes instructions on assigned cores and tracks utilization', () => {
    const cpu = new VirtualCpu(4, 2400);
    expect(cpu.getCoreCount()).toBe(4);

    cpu.assignProcessToCore(0, 101);
    cpu.setCoreInstruction(0, {
      type: 'CPU',
      cycles: 2,
      cyclesRemaining: 2,
      description: 'Compute math',
    });

    const tick1 = cpu.tick();
    expect(tick1[0].completedInstruction).toBeNull();
    expect(tick1[0].pid).toBe(101);

    const tick2 = cpu.tick();
    expect(tick2[0].completedInstruction).not.toBeNull();
    expect(tick2[0].completedInstruction?.type).toBe('CPU');
    expect(cpu.getCore(0)?.instructionsExecuted).toBe(1);
  });

  it('VirtualRam allocates and frees physical frames correctly', () => {
    const ram = new VirtualRam(1024, 32); // 32 frames
    expect(ram.getFreeFrames().length).toBe(32);

    const success = ram.allocateFrame(0, 42, 0, 100);
    expect(success).toBe(true);
    expect(ram.getFrame(0)?.isFree).toBe(false);
    expect(ram.getFrame(0)?.allocatedPid).toBe(42);
    expect(ram.getFreeFrames().length).toBe(31);

    ram.freeProcessFrames(42);
    expect(ram.getFrame(0)?.isFree).toBe(true);
    expect(ram.getFreeFrames().length).toBe(32);
  });

  it('VirtualDisk schedules requests according to SCAN and SSTF algorithms', () => {
    const disk = new VirtualDisk(20, 50); // initial head at track 50
    disk.setAlgorithm('SSTF');

    disk.queueRequest(1, 100, 0, 'READ', 0);
    disk.queueRequest(2, 60, 0, 'READ', 0); // Closer to 50!
    disk.queueRequest(3, 10, 0, 'READ', 0);

    // First selected request should be track 60 (distance 10 vs 50 vs 40)
    // Tick until first request completes
    let completed = null;
    for (let i = 0; i < 20; i++) {
      completed = disk.tick(i * 10);
      if (completed) break;
    }

    expect(completed).not.toBeNull();
    expect(completed?.track).toBe(60);
  });

  it('VirtualNetworkAdapter transmits packets and tracks stats', () => {
    const net = new VirtualNetworkAdapter();
    const packet = net.sendPacket('ICMP', '8.8.8.8', 'PING test', 0);
    expect(packet.status).toBe('QUEUED');
    expect(net.getState().txPackets).toBe(1);

    // Simulate 50ms passing
    const delivered = net.tick(50);
    expect(delivered.length).toBe(1);
    expect(delivered[0].status).toBe('DELIVERED');
  });
});
