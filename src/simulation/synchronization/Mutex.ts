// ============================================================================
// NOVA OS — MUTEX (MUTUAL EXCLUSION LOCK)
// Strict ownership verification, recursive prevention, and waiting queues
// ============================================================================

import type { SimulationTime } from '../types';
import type { EventBus } from '../runtime/EventBus';

export class Mutex {
  public readonly id: string;
  public readonly name: string;
  private locked: boolean = false;
  private ownerPid: number | null = null;
  private waitQueue: number[] = [];
  private eventBus?: EventBus;

  constructor(id: string, name: string, eventBus?: EventBus) {
    this.id = id;
    this.name = name;
    this.eventBus = eventBus;
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public getOwner(): number | null {
    return this.ownerPid;
  }

  public getWaitQueue(): number[] {
    return [...this.waitQueue];
  }

  /**
   * Acquire mutex lock.
   * Returns true if lock acquired, false if blocked in wait queue.
   */
  public acquire(pid: number, timestamp: SimulationTime): boolean {
    if (!this.locked) {
      this.locked = true;
      this.ownerPid = pid;
      this.eventBus?.emit(
        'SYSTEM_CALL',
        'kernel',
        'Mutex',
        `PID ${pid} acquired Mutex '${this.name}'`,
        timestamp,
        { pid, metadata: { mutex: this.name, state: 'LOCKED', owner: pid } }
      );
      return true;
    }

    if (this.ownerPid === pid) {
      return true; // Already owns the lock
    }

    this.waitQueue.push(pid);
    this.eventBus?.emit(
      'PROCESS_BLOCK',
      'process',
      'Mutex',
      `PID ${pid} blocked waiting for Mutex '${this.name}' (Held by PID ${this.ownerPid})`,
      timestamp,
      { pid, metadata: { mutex: this.name, owner: this.ownerPid } }
    );
    return false;
  }

  /**
   * Release mutex lock.
   * Transfers lock to the next waiting PID or clears lock.
   */
  public release(pid: number, timestamp: SimulationTime): number | null {
    if (!this.locked || this.ownerPid !== pid) {
      return null; // Cannot release a mutex you do not own
    }

    if (this.waitQueue.length > 0) {
      const nextOwner = this.waitQueue.shift()!;
      this.ownerPid = nextOwner;
      this.eventBus?.emit(
        'PROCESS_WAKE',
        'process',
        'Mutex',
        `Mutex '${this.name}' ownership handed off from PID ${pid} to PID ${nextOwner}`,
        timestamp,
        { pid: nextOwner, metadata: { mutex: this.name, previousOwner: pid, newOwner: nextOwner } }
      );
      return nextOwner;
    }

    this.locked = false;
    this.ownerPid = null;
    this.eventBus?.emit(
      'SYSTEM_CALL',
      'kernel',
      'Mutex',
      `PID ${pid} unlocked Mutex '${this.name}'`,
      timestamp,
      { pid, metadata: { mutex: this.name, state: 'UNLOCKED' } }
    );
    return null;
  }

  public reset(): void {
    this.locked = false;
    this.ownerPid = null;
    this.waitQueue = [];
  }
}
