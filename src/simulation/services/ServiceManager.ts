// ============================================================================
// NOVA OS — SERVICE MANAGER (DAEMONS)
// Background system daemons: init, schedulerd, memoryd, networkd, loggerd, filed
// ============================================================================

import type { SystemService, SimulationTime } from '../types';
import type { EventBus } from '../runtime/EventBus';

export class ServiceManager {
  private services: Map<string, SystemService> = new Map();
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.initDefaultServices();
  }

  public initDefaultServices(): void {
    const defaultServices: SystemService[] = [
      {
        name: 'init',
        description: 'System initialization and ancestor process daemon',
        pid: 1,
        state: 'RUNNING',
        autoStart: true,
      },
      {
        name: 'schedulerd',
        description: 'CPU scheduling dispatcher and load balancer',
        pid: 2,
        state: 'RUNNING',
        autoStart: true,
      },
      {
        name: 'memoryd',
        description: 'Page frame cleaner and virtual swap daemon',
        pid: 3,
        state: 'RUNNING',
        autoStart: true,
      },
      {
        name: 'networkd',
        description: 'Virtual ethernet stack and socket multiplexer',
        pid: 4,
        state: 'RUNNING',
        autoStart: true,
      },
      {
        name: 'loggerd',
        description: 'Kernel audit ring buffer and /var/log writer',
        pid: 5,
        state: 'RUNNING',
        autoStart: true,
      },
      {
        name: 'filed',
        description: 'Virtual file system inode cache synchronizer',
        pid: 6,
        state: 'RUNNING',
        autoStart: true,
      },
    ];

    for (const svc of defaultServices) {
      this.services.set(svc.name, { ...svc });
    }
  }

  public getServices(): SystemService[] {
    return Array.from(this.services.values());
  }

  public getService(name: string): SystemService | undefined {
    return this.services.get(name);
  }

  public startService(name: string, timestamp: SimulationTime = 0): boolean {
    const svc = this.services.get(name);
    if (!svc) return false;

    svc.state = 'RUNNING';
    svc.pid = svc.pid || Math.floor(Math.random() * 80) + 10;

    this.eventBus?.emit(
      'SERVICE_START',
      'service',
      'ServiceManager',
      `Daemon started: ${svc.name} (PID ${svc.pid})`,
      timestamp,
      { pid: svc.pid, metadata: { service: svc.name } }
    );

    return true;
  }

  public stopService(name: string, timestamp: SimulationTime = 0): boolean {
    const svc = this.services.get(name);
    if (!svc || svc.name === 'init') return false; // Cannot stop init

    svc.state = 'STOPPED';

    this.eventBus?.emit(
      'SERVICE_STOP',
      'service',
      'ServiceManager',
      `Daemon stopped: ${svc.name}`,
      timestamp,
      { metadata: { service: svc.name } }
    );

    return true;
  }

  public restartService(name: string, timestamp: SimulationTime = 0): boolean {
    this.stopService(name, timestamp);
    return this.startService(name, timestamp);
  }
}
