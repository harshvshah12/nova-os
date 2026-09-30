// ============================================================================
// NOVA OS — VIRTUAL PHYSICAL RAM
// Frame buffer management, address space limits, and telemetry
// ============================================================================

import type { MemoryFrame, SimulationTime } from '../types';

export class VirtualRam {
  private frames: MemoryFrame[] = [];
  private totalMb: number = 2048;
  private frameCount: number = 64; // Visualized physical frames
  private frameSizeBytes: number;

  constructor(totalMb: number = 2048, frameCount: number = 64) {
    this.totalMb = totalMb;
    this.frameCount = frameCount;
    this.frameSizeBytes = Math.floor((this.totalMb * 1024 * 1024) / this.frameCount);
    this.initFrames();
  }

  public initFrames(): void {
    this.frames = [];
    for (let i = 0; i < this.frameCount; i++) {
      this.frames.push({
        frameNumber: i,
        isFree: true,
        allocatedPid: null,
        pageNumber: null,
        allocatedAt: 0,
        lastAccessedAt: 0,
        isDirty: false,
        referenceBit: false,
      });
    }
  }

  public getFrames(): MemoryFrame[] {
    return this.frames;
  }

  public getFrame(frameNumber: number): MemoryFrame | undefined {
    return this.frames[frameNumber];
  }

  public getTotalMb(): number {
    return this.totalMb;
  }

  public getFrameCount(): number {
    return this.frameCount;
  }

  public getFrameSizeBytes(): number {
    return this.frameSizeBytes;
  }

  public getFreeFrames(): MemoryFrame[] {
    return this.frames.filter((f) => f.isFree);
  }

  public getUsedFrames(): MemoryFrame[] {
    return this.frames.filter((f) => !f.isFree);
  }

  public getFramesByPid(pid: number): MemoryFrame[] {
    return this.frames.filter((f) => f.allocatedPid === pid);
  }

  public allocateFrame(
    frameNumber: number,
    pid: number,
    pageNumber: number,
    timestamp: SimulationTime
  ): boolean {
    const frame = this.frames[frameNumber];
    if (!frame) return false;

    frame.isFree = false;
    frame.allocatedPid = pid;
    frame.pageNumber = pageNumber;
    frame.allocatedAt = timestamp;
    frame.lastAccessedAt = timestamp;
    frame.isDirty = false;
    frame.referenceBit = true;
    return true;
  }

  public freeFrame(frameNumber: number): void {
    const frame = this.frames[frameNumber];
    if (!frame) return;

    frame.isFree = true;
    frame.allocatedPid = null;
    frame.pageNumber = null;
    frame.allocatedAt = 0;
    frame.lastAccessedAt = 0;
    frame.isDirty = false;
    frame.referenceBit = false;
  }

  public freeProcessFrames(pid: number): number {
    let freedCount = 0;
    for (const frame of this.frames) {
      if (frame.allocatedPid === pid) {
        this.freeFrame(frame.frameNumber);
        freedCount++;
      }
    }
    return freedCount;
  }

  public touchFrame(frameNumber: number, timestamp: SimulationTime, isWrite: boolean = false): void {
    const frame = this.frames[frameNumber];
    if (frame && !frame.isFree) {
      frame.lastAccessedAt = timestamp;
      frame.referenceBit = true;
      if (isWrite) {
        frame.isDirty = true;
      }
    }
  }

  public getUsedMemoryBytes(): number {
    const usedCount = this.getUsedFrames().length;
    return usedCount * this.frameSizeBytes;
  }

  public getMemoryUtilization(): number {
    if (this.frameCount === 0) return 0;
    return Math.round((this.getUsedFrames().length / this.frameCount) * 100);
  }
}
