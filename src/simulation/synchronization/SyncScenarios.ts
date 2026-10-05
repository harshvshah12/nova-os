// ============================================================================
// NOVA OS — CLASSICAL SYNCHRONIZATION LAB SCENARIOS
// 1. Bounded Buffer (Producer-Consumer)
// 2. Readers-Writers (Reader Preference vs. Writer Mutual Exclusion)
// 3. Dining Philosophers (Deadlock Simulation vs. Asymmetric Prevention)
// ============================================================================

import { Semaphore } from './Semaphore';
import { Mutex } from './Mutex';
import type { EventBus } from '../runtime/EventBus';
import type { SimulationTime } from '../types';

export interface BoundedBufferState {
  capacity: number;
  buffer: (string | null)[];
  head: number;
  tail: number;
  count: number;
  emptySem: number;
  fullSem: number;
  isMutexLocked: boolean;
  mutexOwner: number | null;
  producersBlocked: number[];
  consumersBlocked: number[];
  raceConditionOccurred: boolean;
  totalProduced: number;
  totalConsumed: number;
}

export class BoundedBufferLab {
  private capacity: number = 6;
  private buffer: (string | null)[] = [];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  public mutex: Mutex;
  public emptySem: Semaphore;
  public fullSem: Semaphore;
  private eventBus?: EventBus;

  public enableProtection: boolean = true;
  private raceConditionDetected: boolean = false;
  private totalProduced: number = 0;
  private totalConsumed: number = 0;

  constructor(capacity: number = 6, eventBus?: EventBus) {
    this.capacity = capacity;
    this.eventBus = eventBus;
    this.buffer = new Array(capacity).fill(null);
    this.mutex = new Mutex('bb_mutex', 'Buffer Mutex', eventBus);
    this.emptySem = new Semaphore('sem_empty', 'Empty Slots', capacity, eventBus);
    this.fullSem = new Semaphore('sem_full', 'Filled Slots', 0, eventBus);
  }

  public produce(pid: number, item: string, timestamp: SimulationTime): boolean {
    if (this.enableProtection) {
      if (!this.emptySem.wait(pid, timestamp)) {
        return false; // Blocked on empty slots semaphore
      }
      if (!this.mutex.acquire(pid, timestamp)) {
        return false; // Blocked on buffer mutex
      }
    } else {
      // Race condition vulnerability simulation (no locks)
      if (this.count >= this.capacity) {
        this.raceConditionDetected = true;
      }
    }

    // Critical Section: Insert item
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    this.totalProduced++;

    if (this.enableProtection) {
      this.mutex.release(pid, timestamp);
      this.fullSem.signal(timestamp);
    }

    return true;
  }

  public consume(pid: number, timestamp: SimulationTime): string | null {
    if (this.enableProtection) {
      if (!this.fullSem.wait(pid, timestamp)) {
        return null; // Blocked on filled slots semaphore
      }
      if (!this.mutex.acquire(pid, timestamp)) {
        return null; // Blocked on buffer mutex
      }
    } else {
      // Race condition vulnerability simulation
      if (this.count <= 0) {
        this.raceConditionDetected = true;
      }
    }

    // Critical Section: Remove item
    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.count = Math.max(0, this.count - 1);
    this.totalConsumed++;

    if (this.enableProtection) {
      this.mutex.release(pid, timestamp);
      this.emptySem.signal(timestamp);
    }

    return item;
  }

  public getState(): BoundedBufferState {
    return {
      capacity: this.capacity,
      buffer: [...this.buffer],
      head: this.head,
      tail: this.tail,
      count: this.count,
      emptySem: this.emptySem.getValue(),
      fullSem: this.fullSem.getValue(),
      isMutexLocked: this.mutex.isLocked(),
      mutexOwner: this.mutex.getOwner(),
      producersBlocked: this.emptySem.getWaitQueue(),
      consumersBlocked: this.fullSem.getWaitQueue(),
      raceConditionOccurred: this.raceConditionDetected,
      totalProduced: this.totalProduced,
      totalConsumed: this.totalConsumed,
    };
  }

  public reset(): void {
    this.buffer = new Array(this.capacity).fill(null);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.mutex.reset();
    this.emptySem.reset();
    this.fullSem.reset();
    this.raceConditionDetected = false;
    this.totalProduced = 0;
    this.totalConsumed = 0;
  }
}

// ----------------------------------------------------------------------------
// Readers-Writers Scenario
// ----------------------------------------------------------------------------
export interface ReadersWritersState {
  activeReaders: number[];
  activeWriter: number | null;
  waitingReaders: number[];
  waitingWriters: number[];
  sharedDocument: string;
  readCount: number;
}

export class ReadersWritersLab {
  private readCountMutex: Mutex;
  private writeLock: Mutex;
  private readCount: number = 0;

  private activeReaders: number[] = [];
  private activeWriter: number | null = null;
  private waitingReaders: number[] = [];
  private waitingWriters: number[] = [];
  private sharedDocument: string = 'NOVA Kernel v2.4.1 Config: Scheduler=MLFQ, Paging=4KB';

  constructor(eventBus?: EventBus) {
    this.readCountMutex = new Mutex('rw_mutex', 'ReadCount Mutex', eventBus);
    this.writeLock = new Mutex('rw_write', 'Resource Write Lock', eventBus);
  }

  public startRead(pid: number, timestamp: SimulationTime): boolean {
    if (this.activeWriter !== null) {
      if (!this.waitingReaders.includes(pid)) this.waitingReaders.push(pid);
      return false;
    }

    this.waitingReaders = this.waitingReaders.filter((p) => p !== pid);
    if (!this.activeReaders.includes(pid)) {
      this.activeReaders.push(pid);
      this.readCount++;
    }
    return true;
  }

  public stopRead(pid: number): void {
    this.activeReaders = this.activeReaders.filter((p) => p !== pid);
    this.readCount = Math.max(0, this.readCount - 1);
  }

  public startWrite(pid: number, timestamp: SimulationTime): boolean {
    if (this.activeReaders.length > 0 || this.activeWriter !== null) {
      if (!this.waitingWriters.includes(pid)) this.waitingWriters.push(pid);
      return false;
    }

    this.waitingWriters = this.waitingWriters.filter((p) => p !== pid);
    this.activeWriter = pid;
    return true;
  }

  public stopWrite(pid: number, newContent?: string): void {
    if (this.activeWriter === pid) {
      if (newContent) this.sharedDocument = newContent;
      this.activeWriter = null;
    }
  }

  public getState(): ReadersWritersState {
    return {
      activeReaders: [...this.activeReaders],
      activeWriter: this.activeWriter,
      waitingReaders: [...this.waitingReaders],
      waitingWriters: [...this.waitingWriters],
      sharedDocument: this.sharedDocument,
      readCount: this.readCount,
    };
  }

  public reset(): void {
    this.activeReaders = [];
    this.activeWriter = null;
    this.waitingReaders = [];
    this.waitingWriters = [];
    this.readCount = 0;
  }
}

// ----------------------------------------------------------------------------
// Dining Philosophers Scenario
// ----------------------------------------------------------------------------
export type PhilosopherState = 'THINKING' | 'HUNGRY' | 'EATING';

export interface DiningPhilosophersState {
  philosophers: {
    id: number;
    name: string;
    state: PhilosopherState;
    mealsEaten: number;
    leftFork: number;
    rightFork: number;
  }[];
  forks: {
    id: number;
    isHeld: boolean;
    heldBy: number | null;
  }[];
  isDeadlocked: boolean;
  preventionMode: 'ASYMMETRIC' | 'DEADLOCK_PRONE';
}

export class DiningPhilosophersLab {
  private count: number = 5;
  private names: string[] = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];
  private states: PhilosopherState[] = ['THINKING', 'THINKING', 'THINKING', 'THINKING', 'THINKING'];
  private meals: number[] = [0, 0, 0, 0, 0];
  private forks: { id: number; heldBy: number | null }[] = [];
  public preventionMode: 'ASYMMETRIC' | 'DEADLOCK_PRONE' = 'ASYMMETRIC';

  constructor() {
    this.initForks();
  }

  private initForks(): void {
    this.forks = Array.from({ length: this.count }, (_, i) => ({
      id: i,
      heldBy: null,
    }));
  }

  public takeForks(id: number): boolean {
    const leftForkId = id;
    const rightForkId = (id + 1) % this.count;

    if (this.preventionMode === 'DEADLOCK_PRONE') {
      // Everyone picks up left fork first -> Deadlock when all are hungry!
      if (this.forks[leftForkId].heldBy === null) {
        this.forks[leftForkId].heldBy = id;
        this.states[id] = 'HUNGRY';
      }
      if (this.forks[rightForkId].heldBy === null && this.forks[leftForkId].heldBy === id) {
        this.forks[rightForkId].heldBy = id;
        this.states[id] = 'EATING';
        this.meals[id]++;
        return true;
      }
      return false;
    }

    // Asymmetric pickup: Odd philosophers pick up right first, even pick up left first
    const firstFork = id % 2 === 0 ? leftForkId : rightForkId;
    const secondFork = id % 2 === 0 ? rightForkId : leftForkId;

    if (
      this.forks[firstFork].heldBy === null &&
      this.forks[secondFork].heldBy === null
    ) {
      this.forks[firstFork].heldBy = id;
      this.forks[secondFork].heldBy = id;
      this.states[id] = 'EATING';
      this.meals[id]++;
      return true;
    }

    this.states[id] = 'HUNGRY';
    return false;
  }

  public releaseForks(id: number): void {
    const leftForkId = id;
    const rightForkId = (id + 1) % this.count;

    if (this.forks[leftForkId].heldBy === id) this.forks[leftForkId].heldBy = null;
    if (this.forks[rightForkId].heldBy === id) this.forks[rightForkId].heldBy = null;
    this.states[id] = 'THINKING';
  }

  public checkDeadlock(): boolean {
    // Deadlock occurs if all 5 philosophers are HUNGRY and each holds exactly 1 fork
    return (
      this.forks.every((f) => f.heldBy !== null) &&
      this.states.every((s) => s === 'HUNGRY')
    );
  }

  public getState(): DiningPhilosophersState {
    return {
      philosophers: this.names.map((name, i) => ({
        id: i,
        name,
        state: this.states[i],
        mealsEaten: this.meals[i],
        leftFork: i,
        rightFork: (i + 1) % this.count,
      })),
      forks: this.forks.map((f) => ({
        id: f.id,
        isHeld: f.heldBy !== null,
        heldBy: f.heldBy,
      })),
      isDeadlocked: this.checkDeadlock(),
      preventionMode: this.preventionMode,
    };
  }

  public reset(): void {
    this.states = ['THINKING', 'THINKING', 'THINKING', 'THINKING', 'THINKING'];
    this.meals = [0, 0, 0, 0, 0];
    this.initForks();
  }
}
