// ============================================================================
// NOVA OS — SEMAPHORE SYNCHRONIZATION PRIMITIVE
// Classical Dijkstra counting & binary semaphores with FIFO wait queues
// ============================================================================

import type { SimulationTime } from '../types';
import type { EventBus } from '../runtime/EventBus';

export class Semaphore {
  public readonly id: string;
  public readonly name: string;
  public readonly initialValue: number;
  private value: number;
  private waitQueue: number[] = []; // Blocked PIDs
  private eventBus?: EventBus;

  constructor(
    id: string,
    name: string,
    initialValue: number = 1,
    eventBus?: EventBus
  ) {
    this.id = id;
    this.name = name;
    this.initialValue = initialValue;
    this.value = initialValue;
    this.eventBus = eventBus;
  }

  public getValue(): number {
    return this.value;
  }

  public getWaitQueue(): number[] {
    return [...this.waitQueue];
  }

  /**
   * Classical Dijkstra wait() / P() operation:
   * Decrements value. If value < 0, caller PID is blocked and enqueued.
   * Returns true if acquired immediately, false if blocked.
   */
  public wait(pid: number, timestamp: SimulationTime): boolean {
    this.value--;
    if (this.value < 0) {
      this.waitQueue.push(pid);
      this.eventBus?.emit(
        'PROCESS_BLOCK',
        'process',
        'Semaphore',
        `PID ${pid} blocked on Semaphore '${this.name}' (value=${this.value})`,
        timestamp,
        { pid, metadata: { semaphore: this.name, value: this.value } }
      );
      return false; // Blocked
    }
    return true; // Acquired
  }

  /**
   * Classical Dijkstra signal() / V() operation:
   * Increments value. If waitQueue not empty, unblocks the head process.
   * Returns unblocked PID if one was waiting, else null.
   */
  public signal(timestamp: SimulationTime): number | null {
    this.value++;
    if (this.waitQueue.length > 0) {
      const unblockedPid = this.waitQueue.shift()!;
      this.eventBus?.emit(
        'PROCESS_WAKE',
        'process',
        'Semaphore',
        `PID ${unblockedPid} awakened by Semaphore '${this.name}' signal (value=${this.value})`,
        timestamp,
        { pid: unblockedPid, metadata: { semaphore: this.name, value: this.value } }
      );
      return unblockedPid;
    }
    return null;
  }

  public reset(): void {
    this.value = this.initialValue;
    this.waitQueue = [];
  }
}
