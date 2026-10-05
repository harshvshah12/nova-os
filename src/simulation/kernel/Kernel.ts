// ============================================================================
// NOVA OS — MASTER KERNEL & VIRTUAL COMPUTER COORDINATOR
// Coordinates hardware, bootloader, interrupts, syscalls, and simulation tick loop
// ============================================================================

import { SimulationClock } from '../runtime/Clock';
import { EventBus } from '../runtime/EventBus';
import { VirtualCpu } from '../hardware/Cpu';
import { VirtualRam } from '../hardware/Ram';
import { VirtualDisk } from '../hardware/Disk';
import { VirtualNetworkAdapter } from '../hardware/NetworkAdapter';
import { ProcessManager } from '../processes/ProcessManager';
import { SchedulerEngine } from '../scheduler/SchedulerEngine';
import { MemoryManager } from '../simulation/../memory/MemoryManager';
import { VirtualFileSystem } from '../filesystem/Vfs';
import { UserManager } from '../security/UserManager';
import { ServiceManager } from '../services/ServiceManager';
import { DeadlockDetector } from '../deadlock/DeadlockDetector';
import { Shell } from '../terminal/Shell';
import { SyncEngine } from '../synchronization/SyncEngine';

import type {
  HardwareConfig,
  KernelEvent,
  SimulationTime,
  Instruction,
} from '../types';

export type BootState = 'OFF' | 'BOOTING' | 'RUNNING' | 'SHUTDOWN';

export interface BootStep {
  message: string;
  status: 'PENDING' | 'OK' | 'FAIL';
}

export class Kernel {
  // Virtual Hardware
  public readonly clock: SimulationClock;
  public readonly eventBus: EventBus;
  public readonly cpu: VirtualCpu;
  public readonly ram: VirtualRam;
  public readonly disk: VirtualDisk;
  public readonly net: VirtualNetworkAdapter;

  // OS Subsystems
  public readonly processManager: ProcessManager;
  public readonly scheduler: SchedulerEngine;
  public readonly memoryManager: MemoryManager;
  public readonly vfs: VirtualFileSystem;
  public readonly userManager: UserManager;
  public readonly serviceManager: ServiceManager;
  public readonly deadlockDetector: DeadlockDetector;
  public readonly syncEngine: SyncEngine;
  public readonly shell: Shell;

  // Boot & System State
  private bootState: BootState = 'OFF';
  private bootSteps: BootStep[] = [];
  private hardwareConfig: HardwareConfig;

  constructor(customConfig?: Partial<HardwareConfig>) {
    this.hardwareConfig = {
      cores: customConfig?.cores ?? 4,
      coreFrequencyMhz: customConfig?.coreFrequencyMhz ?? 2400,
      ramTotalMb: customConfig?.ramTotalMb ?? 2048,
      pageSizeKb: customConfig?.pageSizeKb ?? 4,
      diskSizeGb: customConfig?.diskSizeGb ?? 20,
      networkInterface: 'eth0',
      ipAddress: '192.168.1.10',
      macAddress: '02:00:00:1A:2B:3C',
      gateway: '192.168.1.1',
    };

    // 1. Initialize Runtime & Hardware
    this.clock = new SimulationClock();
    this.eventBus = new EventBus();
    this.cpu = new VirtualCpu(this.hardwareConfig.cores, this.hardwareConfig.coreFrequencyMhz);
    this.ram = new VirtualRam(this.hardwareConfig.ramTotalMb);
    this.disk = new VirtualDisk(this.hardwareConfig.diskSizeGb, 50);
    this.net = new VirtualNetworkAdapter(this.hardwareConfig.ipAddress, this.hardwareConfig.gateway);

    // 2. Initialize Core Subsystems
    this.processManager = new ProcessManager(this.eventBus);
    this.memoryManager = new MemoryManager(this.ram, this.eventBus, this.processManager);
    this.scheduler = new SchedulerEngine(this.processManager, this.cpu, this.eventBus, 'RR');
    this.vfs = new VirtualFileSystem(this.eventBus);
    this.userManager = new UserManager(this.eventBus);
    this.serviceManager = new ServiceManager(this.eventBus);
    this.deadlockDetector = new DeadlockDetector(this.eventBus);
    this.syncEngine = new SyncEngine(this.eventBus);

    // 3. Initialize Shell
    this.shell = new Shell({
      vfs: this.vfs,
      processManager: this.processManager,
      userManager: this.userManager,
      clock: this.clock,
      cpu: this.cpu,
      ram: this.ram,
      disk: this.disk,
      net: this.net,
      scheduler: this.scheduler,
      eventBus: this.eventBus,
    });

    // 4. Hook clock tick to master kernel cycle
    this.clock.subscribe((time, delta) => {
      if (this.bootState === 'RUNNING') {
        this.tick(time, delta);
      }
    });

    // 5. Connect Dynamic /proc Handlers
    this.setupProcFiles();
  }

  public getBootState(): BootState {
    return this.bootState;
  }

  public getBootSteps(): BootStep[] {
    return [...this.bootSteps];
  }

  public getHardwareConfig(): Readonly<HardwareConfig> {
    return this.hardwareConfig;
  }

  /**
   * Set up dynamic content generators for Linux-like /proc virtual filesystem
   */
  private setupProcFiles(): void {
    // /proc/cpuinfo
    this.vfs.registerProcHandler('cpuinfo', () => {
      const cores = this.cpu.getCores();
      return cores
        .map(
          (c) =>
            `processor\t: ${c.id}\nmodel name\t: NOVA Virtual Core x86_64\ncpu MHz\t\t: ${this.cpu.getFrequencyMhz()}\nutilization\t: ${c.utilization}%\ninstructions\t: ${c.instructionsExecuted}\n`
        )
        .join('\n');
    });

    // /proc/meminfo
    this.vfs.registerProcHandler('meminfo', () => {
      const metrics = this.memoryManager.getMetrics();
      const totalKb = this.ram.getTotalMb() * 1024;
      const freeKb = metrics.freeFrames * (totalKb / metrics.totalFrames);
      const usedKb = totalKb - freeKb;
      return `MemTotal:\t${totalKb} kB\nMemFree:\t${freeKb} kB\nMemAvailable:\t${freeKb} kB\nBuffers:\t32768 kB\nCached:\t\t65536 kB\nPageFaults:\t${metrics.totalPageFaults}\nTLBHits:\t${metrics.tlbHits}\nTLBMisses:\t${metrics.tlbMisses}\nPageReplaces:\t${metrics.pageReplacements}\n`;
    });

    // /proc/processes
    this.vfs.registerProcHandler('processes', () => {
      const all = this.processManager.getAllProcesses();
      return all
        .map(
          (p) =>
            `PID: ${p.getPid()}\tState: ${p.getState()}\tName: ${p.getName()}\tCPU Time: ${p.getPcb().cpuTime}ms\tTurnaround: ${p.getPcb().turnaroundTime}ms`
        )
        .join('\n');
    });

    // /proc/uptime
    this.vfs.registerProcHandler('uptime', () => {
      const sec = (this.clock.getTime() / 1000).toFixed(2);
      return `${sec} ${(this.clock.getTime() / 1500).toFixed(2)}\n`;
    });

    // /proc/scheduler
    this.vfs.registerProcHandler('scheduler', () => {
      const config = this.scheduler.getConfig();
      const metrics = this.scheduler.getMetrics();
      return `Algorithm:\t${config.algorithm}\nTimeQuantum:\t${config.timeQuantum}ms\nPreemptive:\t${config.preemptive}\nContextSwitches:\t${metrics.totalContextSwitches}\nAvgWaitingTime:\t${metrics.averageWaitingTime}ms\nAvgTurnaround:\t${metrics.averageTurnaroundTime}ms\nCPU Utilization:\t${metrics.cpuUtilization}%\n`;
    });

    // /proc/version
    this.vfs.registerProcHandler('version', () => {
      return `Linux version 0.1.0-simulated-x86_64 (nova@build-env) (gcc version 12.2.0) #1 SMP PREEMPT_DYNAMIC\n`;
    });
  }

  /**
   * Boot the virtual machine with sequential hardware & subsystem initialization
   */
  public async boot(onStepUpdate?: (steps: BootStep[]) => void): Promise<void> {
    this.bootState = 'BOOTING';
    this.bootSteps = [];

    const addStep = (msg: string) => {
      this.bootSteps.push({ message: msg, status: 'OK' });
      onStepUpdate?.([...this.bootSteps]);
    };

    this.eventBus.emit(
      'SYSTEM_BOOT',
      'kernel',
      'Bootloader',
      'NOVA OS virtual computer powering on...',
      0
    );

    // Bootloader sequence
    addStep('NOVA Bootloader 0.1.0 Initializing...');
    addStep(`Detecting virtual hardware (${this.hardwareConfig.cores} CPU Cores, ${this.hardwareConfig.ramTotalMb}MB RAM)...`);
    this.cpu.initCores();
    this.ram.initFrames();

    addStep('Initializing interrupt controller & virtual clock...');
    this.clock.reset();

    addStep('Mounting virtual root file system (/bin, /etc, /proc, /dev)...');
    this.vfs.initFileSystem();

    addStep('Starting Virtual Memory Manager & Frame Allocator...');
    this.memoryManager.reset();

    addStep('Starting CPU Scheduler engine (Round Robin quantum 20ms)...');
    this.scheduler.reset();

    addStep('Initializing Process Manager & spawning init (PID 1)...');
    this.processManager.reset();
    this.spawnSystemProcesses();

    addStep('Starting system background services (networkd, loggerd, filed)...');
    this.serviceManager.initDefaultServices();

    addStep('Bringing up network interface eth0 (192.168.1.10)...');
    this.net.reset();

    addStep('Starting user desktop session (user: nova)...');

    this.bootState = 'RUNNING';
    this.clock.start();

    this.eventBus.emit(
      'KERNEL_INIT',
      'kernel',
      'Kernel',
      'Kernel initialization complete. User space ready.',
      this.clock.getTime()
    );
  }

  private spawnSystemProcesses(): void {
    // PID 1: systemd / init
    this.processManager.createProcess('systemd', '/sbin/init', 'MIXED', {
      ppid: 0,
      uid: 0,
      priority: 50,
      instructions: [
        { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Monitor system tree' },
        { type: 'WAIT', cycles: 10, cyclesRemaining: 10, description: 'Wait for signals' },
      ],
    });

    // PID 2: kthreadd
    this.processManager.createProcess('kthreadd', '[kthreadd]', 'CPU_BOUND', {
      ppid: 1,
      uid: 0,
      priority: 20,
      instructions: [
        { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Kernel thread manager' },
        { type: 'WAIT', cycles: 5, cyclesRemaining: 5, description: 'Sleep' },
      ],
    });

    // PID 3: syslogd
    this.processManager.createProcess('syslogd', '/sbin/syslogd', 'IO_BOUND', {
      ppid: 1,
      uid: 0,
      priority: 80,
      instructions: [
        { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Format log buffer' },
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 20, description: 'Sync /var/log/system.log' },
        { type: 'WAIT', cycles: 8, cyclesRemaining: 8, description: 'Sleep' },
      ],
    });
  }

  /**
   * Master Kernel Simulation Tick
   * Executed on every logical clock cycle
   */
  public tick(currentTime: SimulationTime, deltaTime: number): void {
    // 1. Tick Virtual CPU: Advance instruction execution on all cores
    const coreResults = this.cpu.tick();

    for (const res of coreResults) {
      if (res.pid !== null) {
        const process = this.processManager.getProcess(res.pid);
        if (!process) continue;

        // If an instruction completed on this core during this tick
        if (res.completedInstruction) {
          const finishedInst = res.completedInstruction;

          // Handle special instruction types
          if (finishedInst.type === 'EXIT') {
            this.processManager.terminateProcess(res.pid, 0, currentTime);
            this.memoryManager.freeProcessAddressSpace(res.pid, currentTime);
            this.cpu.releaseCore(res.coreId);
            continue;
          }

          // Advance to next instruction
          const nextInst = process.advanceInstruction();

          if (!nextInst) {
            // Reached end of instruction stream -> Process Exited
            this.processManager.terminateProcess(res.pid, 0, currentTime);
            this.memoryManager.freeProcessAddressSpace(res.pid, currentTime);
            this.cpu.releaseCore(res.coreId);
            continue;
          }

          // Inspect next instruction
          if (nextInst.type === 'MEMORY_READ' || nextInst.type === 'MEMORY_WRITE') {
            // Memory access: perform virtual address translation
            const addr = nextInst.address ?? 0x1000;
            const isWrite = nextInst.type === 'MEMORY_WRITE';
            this.memoryManager.accessMemory(res.pid, addr, isWrite, currentTime);
          } else if (nextInst.type === 'IO_REQUEST') {
            // I/O Request: queue disk operation and BLOCK process
            const track = nextInst.ioTrack ?? 50;
            this.disk.queueRequest(res.pid, track, 0, 'READ', currentTime);
            this.processManager.blockProcess(res.pid, `Waiting for Disk Cylinder ${track}`, undefined, currentTime);
            this.cpu.releaseCore(res.coreId);
          } else if (nextInst.type === 'WAIT') {
            // Wait / Sleep: block process for duration
            const sleepMs = nextInst.cycles * 10;
            this.processManager.blockProcess(res.pid, 'Sleeping', currentTime + sleepMs, currentTime);
            this.cpu.releaseCore(res.coreId);
          }
        }
      }
    }

    // 2. Tick Disk Controller: Advance head movement & complete requests
    const completedDiskReq = this.disk.tick(currentTime);
    if (completedDiskReq) {
      // Unblock the process waiting for this disk request
      this.processManager.wakeProcess(completedDiskReq.pid, currentTime);
      this.eventBus.emit(
        'IO_COMPLETE',
        'disk',
        'DiskController',
        `I/O Complete: Cylinder ${completedDiskReq.track} sector ${completedDiskReq.sector} read for PID ${completedDiskReq.pid}`,
        currentTime,
        { pid: completedDiskReq.pid, metadata: { track: completedDiskReq.track } }
      );
    }

    // 3. Tick Network Interface
    this.net.tick(currentTime);

    // 4. Check Blocked Process Timeouts (wake up sleeping processes)
    this.processManager.checkBlockedTimeouts(currentTime);

    // 5. Run CPU Scheduler: Evaluate ready queue, dispatch to cores, handle preemption
    this.scheduler.tick(currentTime);
  }

  public shutdown(): void {
    this.clock.pause();
    this.bootState = 'SHUTDOWN';
    this.eventBus.emit(
      'SYSTEM_SHUTDOWN',
      'kernel',
      'Kernel',
      'NOVA OS cleanly shut down.',
      this.clock.getTime()
    );
  }

  public restart(): void {
    this.shutdown();
    this.boot();
  }
}
