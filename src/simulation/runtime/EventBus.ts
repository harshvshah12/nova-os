// ============================================================================
// NOVA OS — EVENT BUS & AUDIT TIMELINE
// Central event dispatcher with category filtering and educational explanations
// ============================================================================

import type {
  KernelEvent,
  EventType,
  EventCategory,
  SimulationTime,
} from '../types';

export type EventSubscriber = (event: KernelEvent) => void;

export class EventBus {
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private allSubscribers: Set<EventSubscriber> = new Set();
  private eventHistory: KernelEvent[] = [];
  private readonly maxHistoryLength: number = 2000;
  private eventCounter: number = 0;

  constructor() {
    this.reset();
  }

  public emit(
    type: EventType,
    category: EventCategory,
    source: string,
    message: string,
    timestamp: SimulationTime,
    extra?: {
      target?: string;
      pid?: number;
      coreId?: number;
      metadata?: Record<string, any>;
      explanation?: string;
    }
  ): KernelEvent {
    this.eventCounter++;
    const id = `ev-${this.eventCounter}-${Date.now()}`;

    // Generate educational explanation if not explicitly supplied
    const explanation = extra?.explanation || this.generateExplanation(type, source, extra);

    const event: KernelEvent = {
      id,
      timestamp,
      type,
      category,
      source,
      target: extra?.target,
      pid: extra?.pid,
      coreId: extra?.coreId,
      message,
      explanation,
      metadata: extra?.metadata,
    };

    // Store in ring buffer
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory.shift();
    }

    // Notify all-event subscribers
    for (const sub of this.allSubscribers) {
      try {
        sub(event);
      } catch (err) {
        console.error('Error in general event subscriber:', err);
      }
    }

    // Notify category subscribers
    const catSubs = this.subscribers.get(category);
    if (catSubs) {
      for (const sub of catSubs) {
        try {
          sub(event);
        } catch (err) {
          console.error(`Error in category (${category}) subscriber:`, err);
        }
      }
    }

    // Notify type subscribers
    const typeSubs = this.subscribers.get(type);
    if (typeSubs) {
      for (const sub of typeSubs) {
        try {
          sub(event);
        } catch (err) {
          console.error(`Error in type (${type}) subscriber:`, err);
        }
      }
    }

    return event;
  }

  public subscribe(
    filter: 'ALL' | EventCategory | EventType,
    callback: EventSubscriber
  ): () => void {
    if (filter === 'ALL') {
      this.allSubscribers.add(callback);
      return () => this.allSubscribers.delete(callback);
    }

    if (!this.subscribers.has(filter)) {
      this.subscribers.set(filter, new Set());
    }
    const set = this.subscribers.get(filter)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  public getHistory(categoryFilter?: EventCategory): KernelEvent[] {
    if (!categoryFilter || categoryFilter === ('ALL' as any)) {
      return [...this.eventHistory];
    }
    return this.eventHistory.filter((e) => e.category === categoryFilter);
  }

  public getRecentEvents(count: number = 50): KernelEvent[] {
    return this.eventHistory.slice(-count);
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }

  public reset(): void {
    this.eventHistory = [];
    this.eventCounter = 0;
  }

  /**
   * Generates academic explanation for OS concepts (used by Learning Mode)
   */
  private generateExplanation(
    type: EventType,
    source: string,
    extra?: { pid?: number; coreId?: number; metadata?: Record<string, any> }
  ): string {
    const meta = extra?.metadata || {};
    const pid = extra?.pid;
    const core = extra?.coreId !== undefined ? `Core ${extra.coreId}` : 'CPU';

    switch (type) {
      case 'CONTEXT_SWITCH':
        return `Context Switch occurred on ${core}. The CPU saved the process control block registers of PID ${meta.prevPid ?? 'Idle'} and restored PID ${meta.nextPid ?? 'Idle'}. Reason: ${meta.reason || 'Scheduler decision'}.`;

      case 'PAGE_FAULT':
        return `Virtual Memory Page Fault: Process PID ${pid} attempted to reference virtual page ${meta.virtualPage ?? 'N/A'}, which is not mapped in physical RAM (present bit = 0). A page fault trap (Interrupt 0x0E) was raised to allocate or swap in a physical frame.`;

      case 'PAGE_EVICT':
        return `Frame Replacement: Physical Frame ${meta.frameNumber} was evicted using the ${meta.algorithm || 'LRU'} algorithm to satisfy memory demand. If dirty, contents were written to virtual swap.`;

      case 'PROCESS_BLOCK':
        return `Process PID ${pid} transitioned from RUNNING to BLOCKED. Reason: ${meta.reason || 'I/O request or wait synchronization'}. The process will remain off CPU until the hardware interrupt completes.`;

      case 'PROCESS_WAKE':
        return `Process PID ${pid} was unblocked and placed back into the READY queue following completion of its pending ${meta.reason || 'I/O event'}.`;

      case 'DEADLOCK_DETECTED':
        return `Deadlock Condition Encountered! Circular wait detected among processes [${meta.cycle?.join(', ') || 'N/A'}] contending for non-preemptible resources.`;

      case 'SYSTEM_CALL':
        return `User space execution transitioned to Kernel space via software trap (int 0x80 / syscall): ${meta.syscall || 'unknown'}(). The kernel performs parameter validation and privileged resource access.`;

      case 'DISK_REQUEST':
        return `I/O Request queued for disk cylinder/track ${meta.track ?? 'N/A'}, sector ${meta.sector ?? 'N/A'}. The disk scheduler will prioritize this using ${meta.algorithm || 'SCAN'}.`;

      default:
        return `Subsystem [${source}] emitted event ${type}.`;
    }
  }
}
