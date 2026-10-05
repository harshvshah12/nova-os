// ============================================================================
// NOVA OS — VIRTUAL MEMORY & PAGING MANAGER
// Page tables, TLB cache, page fault trap handling, FIFO/LRU/Optimal replacement
// ============================================================================

import type {
  PageTableEntry,
  TlbEntry,
  PageReplacementAlgorithm,
  AllocationStrategy,
  MemoryMetrics,
  SimulationTime,
} from '../types';
import type { VirtualRam } from '../hardware/Ram';
import type { EventBus } from '../runtime/EventBus';
import type { ProcessManager } from '../processes/ProcessManager';

export class MemoryManager {
  private ram: VirtualRam;
  private eventBus?: EventBus;
  private processManager?: ProcessManager;

  // Process ID -> Map<virtualPageNumber, PageTableEntry>
  private pageTables: Map<number, Map<number, PageTableEntry>> = new Map();

  // Hardware TLB Cache (16 entries)
  private tlb: TlbEntry[] = [];
  private readonly tlbSize: number = 16;

  // Algorithms
  private replacementAlgorithm: PageReplacementAlgorithm = 'LRU';
  private allocationStrategy: AllocationStrategy = 'FIRST_FIT';

  // Metrics
  private totalPageFaults: number = 0;
  private tlbHits: number = 0;
  private tlbMisses: number = 0;
  private pageReplacements: number = 0;

  // Swap space abstraction (backing store on virtual disk)
  private swapSpace: Map<number, { pid: number; pageNumber: number }> = new Map();
  private nextSwapBlockId: number = 1;
  private readonly totalSwapSlots: number = 256;
  private swapIns: number = 0;
  private swapOuts: number = 0;

  // FIFO replacement queue of frame numbers
  private fifoQueue: number[] = [];

  constructor(
    ram: VirtualRam,
    eventBus?: EventBus,
    processManager?: ProcessManager
  ) {
    this.ram = ram;
    this.eventBus = eventBus;
    this.processManager = processManager;
  }

  public getReplacementAlgorithm(): PageReplacementAlgorithm {
    return this.replacementAlgorithm;
  }

  public setReplacementAlgorithm(algo: PageReplacementAlgorithm): void {
    this.replacementAlgorithm = algo;
  }

  public getAllocationStrategy(): AllocationStrategy {
    return this.allocationStrategy;
  }

  public setAllocationStrategy(strat: AllocationStrategy): void {
    this.allocationStrategy = strat;
  }

  public getMetrics(): MemoryMetrics {
    return {
      totalFrames: this.ram.getFrameCount(),
      usedFrames: this.ram.getUsedFrameCount(),
      freeFrames: this.ram.getFreeFrameCount(),
      totalPageFaults: this.totalPageFaults,
      tlbHits: this.tlbHits,
      tlbMisses: this.tlbMisses,
      pageReplacements: this.pageReplacements,
      pageSizeBytes: this.ram.frameSizeBytes,
      totalSwapSlots: this.totalSwapSlots,
      usedSwapSlots: this.swapSpace.size,
      swapIns: this.swapIns,
      swapOuts: this.swapOuts,
    };
  }

  public getPageTable(pid: number): Map<number, PageTableEntry> | undefined {
    return this.pageTables.get(pid);
  }

  public getTlb(): ReadonlyArray<TlbEntry> {
    return this.tlb;
  }

  /**
   * Initialize a new page table for a created process
   */
  public initProcessAddressSpace(pid: number, virtualPagesCount: number = 8): void {
    const table = new Map<number, PageTableEntry>();
    for (let page = 0; page < virtualPagesCount; page++) {
      table.set(page, {
        pageNumber: page,
        frameNumber: null,
        isPresent: false,
        isModified: false,
        isReferenced: false,
        protection: 'READ_WRITE',
      });
    }
    this.pageTables.set(pid, table);
  }

  /**
   * Release all frames and page table mappings for a terminated process
   */
  public freeProcessAddressSpace(pid: number, timestamp: SimulationTime): void {
    const freed = this.ram.freeProcessFrames(pid);
    this.pageTables.delete(pid);

    // Evict from TLB
    this.tlb = this.tlb.filter((e) => e.pid !== pid);
    this.fifoQueue = this.fifoQueue.filter((f) => {
      const frame = this.ram.getFrame(f);
      return frame && frame.allocatedPid !== null;
    });

    if (freed > 0) {
      this.eventBus?.emit(
        'MEMORY_FREE',
        'memory',
        'MemoryManager',
        `Reclaimed ${freed} physical frames from terminated PID ${pid}`,
        timestamp,
        { pid, metadata: { freedFrames: freed } }
      );
    }
  }

  /**
   * Translates virtual address to physical address with TLB and page fault simulation
   */
  public accessMemory(
    pid: number,
    virtualAddress: number,
    isWrite: boolean,
    timestamp: SimulationTime
  ): {
    physicalAddress: number | null;
    pageFault: boolean;
    tlbHit: boolean;
    frameNumber: number | null;
  } {
    const pageSize = 4096;
    const pageNumber = Math.floor(virtualAddress / pageSize);
    const offset = virtualAddress % pageSize;

    // 1. Check TLB Cache
    const tlbIndex = this.tlb.findIndex(
      (e) => e.pid === pid && e.pageNumber === pageNumber
    );

    if (tlbIndex !== -1) {
      this.tlbHits++;
      const tlbEntry = this.tlb[tlbIndex];
      tlbEntry.lastUsed = timestamp;
      this.ram.touchFrame(tlbEntry.frameNumber, timestamp, isWrite);

      this.eventBus?.emit(
        'TLB_HIT',
        'memory',
        'MMU',
        `TLB Hit for PID ${pid} virtual page ${pageNumber} -> Frame ${tlbEntry.frameNumber}`,
        timestamp,
        { pid, metadata: { pageNumber, frameNumber: tlbEntry.frameNumber } }
      );

      return {
        physicalAddress: tlbEntry.frameNumber * pageSize + offset,
        pageFault: false,
        tlbHit: true,
        frameNumber: tlbEntry.frameNumber,
      };
    }

    // TLB Miss
    this.tlbMisses++;

    // 2. Page Table Lookup
    let table = this.pageTables.get(pid);
    if (!table) {
      this.initProcessAddressSpace(pid, Math.max(pageNumber + 1, 8));
      table = this.pageTables.get(pid)!;
    }

    let pte = table.get(pageNumber);
    if (!pte) {
      pte = {
        pageNumber,
        frameNumber: null,
        isPresent: false,
        isModified: false,
        isReferenced: false,
        protection: 'READ_WRITE',
      };
      table.set(pageNumber, pte);
    }

    // 3. Check if page is present in RAM
    if (pte.isPresent && pte.frameNumber !== null) {
      // Page present! Update TLB and RAM touch
      this.updateTlb(pid, pageNumber, pte.frameNumber, timestamp);
      this.ram.touchFrame(pte.frameNumber, timestamp, isWrite);
      pte.isReferenced = true;
      if (isWrite) pte.isModified = true;

      return {
        physicalAddress: pte.frameNumber * pageSize + offset,
        pageFault: false,
        tlbHit: false,
        frameNumber: pte.frameNumber,
      };
    }

    // 4. PAGE FAULT OCCURRED!
    this.totalPageFaults++;

    this.eventBus?.emit(
      'PAGE_FAULT',
      'memory',
      'MMU',
      `Page Fault: PID ${pid} accessed unmapped virtual page ${pageNumber} (0x${virtualAddress.toString(16)})`,
      timestamp,
      {
        pid,
        metadata: { virtualAddress, pageNumber, isWrite },
        explanation: `Virtual page ${pageNumber} has present bit = 0 in PID ${pid}'s page table. The CPU triggered Interrupt 0x0E (Page Fault Exception) to load the page into a physical frame.`,
      }
    );

    // Resolve Page Fault by allocating/evicting a frame
    const frameNumber = this.handlePageFault(pid, pageNumber, timestamp);

    // Update Page Table
    pte.isPresent = true;
    pte.frameNumber = frameNumber;
    pte.isReferenced = true;
    if (isWrite) pte.isModified = true;

    // Update TLB
    this.updateTlb(pid, pageNumber, frameNumber, timestamp);

    // Update Process PCB
    const process = this.processManager?.getProcess(pid);
    if (process) {
      process.assignFrame(frameNumber);
    }

    this.eventBus?.emit(
      'PAGE_LOAD',
      'memory',
      'MemoryManager',
      `Page Loaded: PID ${pid} Page ${pageNumber} -> Frame ${frameNumber}`,
      timestamp,
      {
        pid,
        metadata: { pageNumber, frameNumber },
        explanation: `Kernel allocated Frame ${frameNumber} for PID ${pid} Page ${pageNumber} and updated page table present bit to 1.`,
      }
    );

    return {
      physicalAddress: frameNumber * pageSize + offset,
      pageFault: true,
      tlbHit: false,
      frameNumber,
    };
  }

  /**
   * Allocates a free frame or evicts an existing frame according to replacement policy
   */
  private handlePageFault(
    pid: number,
    pageNumber: number,
    timestamp: SimulationTime
  ): number {
    const freeFrameNum = this.ram.findFreeFrame();

    if (freeFrameNum !== null) {
      // Free frame available!
      this.checkAndSwapIn(pid, pageNumber, freeFrameNum, timestamp);
      this.ram.allocateFrame(freeFrameNum, pid, pageNumber, timestamp);
      this.fifoQueue.push(freeFrameNum);
      return freeFrameNum;
    }

    // No free frame available -> Must EVICT a frame!
    this.pageReplacements++;
    const victimFrameNumber = this.selectVictimFrame(pid);
    const victimFrame = this.ram.getFrame(victimFrameNumber)!;

    const oldPid = victimFrame.allocatedPid;
    const oldPage = victimFrame.pageNumber;

    // Invalidate old page table entry and swap out if dirty
    if (oldPid !== null && oldPage !== null) {
      const oldTable = this.pageTables.get(oldPid);
      const oldPte = oldTable?.get(oldPage);
      if (oldPte) {
        oldPte.isPresent = false;
        oldPte.frameNumber = null;

        // If dirty, swap out to simulated disk swap partition
        if (oldPte.isModified || victimFrame.isDirty) {
          const swapSlot = this.nextSwapBlockId++;
          this.swapSpace.set(swapSlot, { pid: oldPid, pageNumber: oldPage });
          oldPte.swapBlockId = swapSlot;
          oldPte.isModified = false;
          this.swapOuts++;

          this.eventBus?.emit(
            'SWAP_OUT',
            'memory',
            'MemoryManager',
            `Dirty Page Swapped Out to Disk: PID ${oldPid} Page ${oldPage} -> Swap Slot #${swapSlot}`,
            timestamp,
            { pid: oldPid, metadata: { pageNumber: oldPage, swapSlot } }
          );
        }
      }

      // Remove from old process's PCB
      const oldProcess = this.processManager?.getProcess(oldPid);
      if (oldProcess) {
        oldProcess.removeFrame(victimFrameNumber);
      }

      // Evict from TLB
      this.tlb = this.tlb.filter(
        (e) => !(e.pid === oldPid && e.pageNumber === oldPage)
      );

      this.eventBus?.emit(
        'PAGE_EVICT',
        'memory',
        'MemoryManager',
        `Frame Eviction (${this.replacementAlgorithm}): Frame ${victimFrameNumber} (PID ${oldPid}, Page ${oldPage}) evicted`,
        timestamp,
        {
          pid,
          metadata: {
            victimFrameNumber,
            evictedPid: oldPid,
            evictedPage: oldPage,
            algorithm: this.replacementAlgorithm,
          },
          explanation: `Physical memory full. Kernel evicted Frame ${victimFrameNumber} using ${this.replacementAlgorithm} replacement to satisfy memory allocation for PID ${pid}.`,
        }
      );
    }

    // Check if new page is being brought in from swap
    this.checkAndSwapIn(pid, pageNumber, victimFrameNumber, timestamp);

    // Allocate frame for the new page
    this.ram.allocateFrame(victimFrameNumber, pid, pageNumber, timestamp);
    this.fifoQueue.push(victimFrameNumber);

    return victimFrameNumber;
  }

  /**
   * Selects victim frame using FIFO, LRU, or Optimal replacement
   */
  private selectVictimFrame(currentPid: number): number {
    const usedFrames = this.ram.getUsedFrames();
    if (usedFrames.length === 0) return 0;

    switch (this.replacementAlgorithm) {
      case 'FIFO': {
        // Pop first frame from FIFO queue that is currently valid
        while (this.fifoQueue.length > 0) {
          const candidate = this.fifoQueue.shift()!;
          const frame = this.ram.getFrame(candidate);
          if (frame && !frame.isFree) {
            return candidate;
          }
        }
        return usedFrames[0].frameNumber;
      }

      case 'LRU': {
        // Find frame with oldest lastAccessedAt timestamp
        let oldestFrame = usedFrames[0];
        let minAccess = oldestFrame.lastAccessedAt;

        for (let i = 1; i < usedFrames.length; i++) {
          if (usedFrames[i].lastAccessedAt < minAccess) {
            minAccess = usedFrames[i].lastAccessedAt;
            oldestFrame = usedFrames[i];
          }
        }
        return oldestFrame.frameNumber;
      }

      case 'OPTIMAL': {
        // Look ahead in process instruction stream for furthest referenced page
        const process = this.processManager?.getProcess(currentPid);
        if (!process) return usedFrames[0].frameNumber;

        const pcb = process.getPcb();
        const futureInstructions = pcb.instructions.slice(pcb.programCounter);

        let furthestFrame = usedFrames[0].frameNumber;
        let furthestDistance = -1;

        for (const frame of usedFrames) {
          if (frame.allocatedPid !== currentPid) {
            // Favor evicting frames belonging to other processes first
            return frame.frameNumber;
          }

          const pageNum = frame.pageNumber;
          let distance = Infinity;

          for (let i = 0; i < futureInstructions.length; i++) {
            const inst = futureInstructions[i];
            if (
              (inst.type === 'MEMORY_READ' || inst.type === 'MEMORY_WRITE') &&
              inst.address !== undefined
            ) {
              const instPage = Math.floor(inst.address / 4096);
              if (instPage === pageNum) {
                distance = i;
                break;
              }
            }
          }

          if (distance > furthestDistance) {
            furthestDistance = distance;
            furthestFrame = frame.frameNumber;
          }
        }

        return furthestFrame;
      }

      default:
        return usedFrames[0].frameNumber;
    }
  }

  private updateTlb(
    pid: number,
    pageNumber: number,
    frameNumber: number,
    timestamp: SimulationTime
  ): void {
    const existingIndex = this.tlb.findIndex(
      (e) => e.pid === pid && e.pageNumber === pageNumber
    );

    if (existingIndex !== -1) {
      this.tlb[existingIndex].frameNumber = frameNumber;
      this.tlb[existingIndex].lastUsed = timestamp;
      return;
    }

    if (this.tlb.length >= this.tlbSize) {
      // LRU eviction in TLB
      let lruIndex = 0;
      let minTime = this.tlb[0].lastUsed;
      for (let i = 1; i < this.tlb.length; i++) {
        if (this.tlb[i].lastUsed < minTime) {
          minTime = this.tlb[i].lastUsed;
          lruIndex = i;
        }
      }
      this.tlb.splice(lruIndex, 1);
    }

    this.tlb.push({
      pid,
      pageNumber,
      frameNumber,
      lastUsed: timestamp,
    });
  }

  private checkAndSwapIn(
    pid: number,
    pageNumber: number,
    frameNumber: number,
    timestamp: SimulationTime
  ): void {
    const table = this.pageTables.get(pid);
    const pte = table?.get(pageNumber);
    if (pte && pte.swapBlockId != null) {
      const slot = pte.swapBlockId;
      this.swapSpace.delete(slot);
      pte.swapBlockId = null;
      this.swapIns++;

      this.eventBus?.emit(
        'SWAP_IN',
        'memory',
        'MemoryManager',
        `Page Swapped In from Disk: PID ${pid} Page ${pageNumber} (Slot #${slot}) -> Frame ${frameNumber}`,
        timestamp,
        { pid, metadata: { pageNumber, swapSlot: slot, frameNumber } }
      );
    }
  }

  /**
   * Educational address breakdown: calculates Virtual Page Number (VPN),
   * offset, TLB presence, physical frame number (PFN), and physical address.
   */
  public translateVirtualAddress(
    virtualAddress: number,
    pid: number
  ): {
    virtualAddress: number;
    vpn: number;
    offset: number;
    frameNumber: number | null;
    physicalAddress: number | null;
    isPresent: boolean;
    inTlb: boolean;
    isDirty: boolean;
    protection: string;
    swapBlockId: number | null;
  } {
    const pageSize = this.ram.frameSizeBytes;
    const vpn = Math.floor(virtualAddress / pageSize);
    const offset = virtualAddress % pageSize;

    const inTlb = this.tlb.some((e) => e.pid === pid && e.pageNumber === vpn);
    const table = this.pageTables.get(pid);
    const pte = table?.get(vpn);

    const frameNumber = pte?.isPresent ? pte.frameNumber : null;
    const physicalAddress = frameNumber !== null ? frameNumber * pageSize + offset : null;

    return {
      virtualAddress,
      vpn,
      offset,
      frameNumber,
      physicalAddress,
      isPresent: pte?.isPresent ?? false,
      inTlb,
      isDirty: pte?.isModified ?? false,
      protection: pte?.protection ?? 'READ_WRITE',
      swapBlockId: pte?.swapBlockId ?? null,
    };
  }

  public reset(): void {
    this.ram.initFrames();
    this.pageTables.clear();
    this.tlb = [];
    this.fifoQueue = [];
    this.swapSpace.clear();
    this.totalPageFaults = 0;
    this.tlbHits = 0;
    this.tlbMisses = 0;
    this.pageReplacements = 0;
    this.swapIns = 0;
    this.swapOuts = 0;
  }
}
