// ============================================================================
// NOVA OS — SYNCHRONIZATION ENGINE
// Coordinates Semaphores, Mutexes, Bounded Buffer, Readers-Writers, and Dining Philosophers
// ============================================================================

import type { EventBus } from '../runtime/EventBus';
import { BoundedBufferLab } from './SyncScenarios';
import { ReadersWritersLab } from './SyncScenarios';
import { DiningPhilosophersLab } from './SyncScenarios';

export class SyncEngine {
  public boundedBuffer: BoundedBufferLab;
  public readersWriters: ReadersWritersLab;
  public diningPhilosophers: DiningPhilosophersLab;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.boundedBuffer = new BoundedBufferLab(6, eventBus);
    this.readersWriters = new ReadersWritersLab(eventBus);
    this.diningPhilosophers = new DiningPhilosophersLab();
  }

  public resetAll(): void {
    this.boundedBuffer.reset();
    this.readersWriters.reset();
    this.diningPhilosophers.reset();
  }
}
