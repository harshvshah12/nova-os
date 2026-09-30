import { describe, it, expect } from 'vitest';
import { VirtualRam } from '../simulation/hardware/Ram';
import { EventBus } from '../simulation/runtime/EventBus';
import { MemoryManager } from '../simulation/memory/MemoryManager';

describe('Phase 5 — Virtual Memory & Paging', () => {
  it('Accessing unmapped virtual page generates a PAGE FAULT and allocates a frame', () => {
    const ram = new VirtualRam(512, 16); // 16 frames
    const bus = new EventBus();
    const mm = new MemoryManager(ram, bus);

    const events: string[] = [];
    bus.subscribe('PAGE_FAULT', (e) => events.push(e.type));

    // Access virtual address 0x2000 (Page 2)
    const result1 = mm.accessMemory(1, 0x2000, false, 10);
    expect(result1.pageFault).toBe(true);
    expect(result1.frameNumber).not.toBeNull();
    expect(events).toContain('PAGE_FAULT');

    // Access virtual address 0x2010 (same Page 2) -> Should be TLB Hit, NO page fault!
    const result2 = mm.accessMemory(1, 0x2010, false, 20);
    expect(result2.pageFault).toBe(false);
    expect(result2.tlbHit).toBe(true);
    expect(result2.frameNumber).toBe(result1.frameNumber);
  });

  it('LRU page replacement evicts least recently accessed frame when RAM is full', () => {
    const ram = new VirtualRam(128, 4); // Only 4 physical frames!
    const bus = new EventBus();
    const mm = new MemoryManager(ram, bus);
    mm.setReplacementAlgorithm('LRU');

    const evictions: number[] = [];
    bus.subscribe('PAGE_EVICT', (e) => evictions.push(e.metadata?.evictedPage));

    // Fill all 4 frames: Pages 0, 1, 2, 3
    mm.accessMemory(1, 0 * 4096, false, 10);
    mm.accessMemory(1, 1 * 4096, false, 20);
    mm.accessMemory(1, 2 * 4096, false, 30);
    mm.accessMemory(1, 3 * 4096, false, 40);

    expect(ram.getFreeFrames().length).toBe(0);

    // Touch Page 0 again at time 50 so Page 1 becomes the oldest (LRU)!
    mm.accessMemory(1, 0 * 4096, false, 50);

    // Access Page 4 -> Should trigger eviction of Page 1!
    mm.accessMemory(1, 4 * 4096, false, 60);

    expect(evictions).toContain(1);
    expect(mm.getMetrics().pageReplacements).toBe(1);
  });
});
