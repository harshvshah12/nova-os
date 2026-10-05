// ============================================================================
// NOVA OS — VIRTUAL PHYSICAL RAM
// 4KB Paged Physical Memory (524,288 frames for 2048 MB), Sparse Buffer,
// Address Space Limits, Frame Allocation, and Telemetry
// ============================================================================

import type { MemoryFrame, SimulationTime } from '../types';

export class VirtualRam {
  private totalMb: number = 2048;
  public readonly frameSizeBytes: number = 4096; // Strictly 4 KB standard frame size (x86_64)
  private frameCount: number = 524288; // 2048 MB / 4 KB = 524,288 physical frames
  private allocatedFrames: Map<number, MemoryFrame> = new Map();
  private nextFreeFrame: number = 0;
  private recycledFrames: number[] = [];

  constructor(totalMb: number = 2048, frameCount?: number) {
    this.totalMb = totalMb;
    this.frameCount =
      frameCount !== undefined
        ? frameCount
        : Math.floor((totalMb * 1024 * 1024) / this.frameSizeBytes);
    this.initFrames();
  }

  public initFrames(): void {
    this.allocatedFrames.clear();
    this.nextFreeFrame = 0;
    this.recycledFrames = [];
  }

  public getFrame(frameNumber: number): MemoryFrame | undefined {
    if (frameNumber < 0 || frameNumber >= this.frameCount) {
      return undefined;
    }
    const allocated = this.allocatedFrames.get(frameNumber);
    if (allocated) return allocated;

    return {
      frameNumber,
      isFree: true,
      allocatedPid: null,
      pageNumber: null,
      allocatedAt: 0,
      lastAccessedAt: 0,
      isDirty: false,
      referenceBit: false,
    };
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

  public getFreeFrameCount(): number {
    return Math.max(0, this.frameCount - this.allocatedFrames.size);
  }

  public getUsedFrameCount(): number {
    return this.allocatedFrames.size;
  }

  public findFreeFrame(): number | null {
    if (this.allocatedFrames.size >= this.frameCount) {
      return null;
    }
    while (this.recycledFrames.length > 0) {
      const candidate = this.recycledFrames.pop()!;
      if (!this.allocatedFrames.has(candidate) && candidate < this.frameCount) {
        return candidate;
      }
    }
    if (this.nextFreeFrame < this.frameCount) {
      return this.nextFreeFrame++;
    }
    for (let i = 0; i < this.frameCount; i++) {
      if (!this.allocatedFrames.has(i)) {
        return i;
      }
    }
    return null;
  }

  public getFreeFrames(limit?: number): MemoryFrame[] {
    const max = limit ?? (this.frameCount <= 1024 ? this.frameCount : 1024);
    const result: MemoryFrame[] = [];
    for (let i = 0; i < this.frameCount && result.length < max; i++) {
      if (!this.allocatedFrames.has(i)) {
        result.push(this.getFrame(i)!);
      }
    }
    return result;
  }

  public getUsedFrames(): MemoryFrame[] {
    return Array.from(this.allocatedFrames.values());
  }

  public getFrames(): MemoryFrame[] {
    const limit = this.frameCount <= 64 ? this.frameCount : 64;
    return this.getFrameWindow(0, limit);
  }

  public getFrameWindow(startFrame: number, count: number): MemoryFrame[] {
    const frames: MemoryFrame[] = [];
    const end = Math.min(this.frameCount, Math.max(0, startFrame) + count);
    for (let i = Math.max(0, startFrame); i < end; i++) {
      frames.push(this.getFrame(i)!);
    }
    return frames;
  }

  public getBucketSummaries(numBuckets: number = 64): {
    bucketIndex: number;
    startFrame: number;
    endFrame: number;
    totalFrames: number;
    usedFrames: number;
    utilizationPercent: number;
  }[] {
    const buckets: {
      bucketIndex: number;
      startFrame: number;
      endFrame: number;
      totalFrames: number;
      usedFrames: number;
      utilizationPercent: number;
    }[] = [];

    const framesPerBucket = Math.ceil(this.frameCount / numBuckets);
    const bucketCounts = new Uint32Array(numBuckets);

    for (const frameNum of this.allocatedFrames.keys()) {
      const idx = Math.min(numBuckets - 1, Math.floor(frameNum / framesPerBucket));
      bucketCounts[idx]++;
    }

    for (let b = 0; b < numBuckets; b++) {
      const start = b * framesPerBucket;
      const end = Math.min(this.frameCount - 1, (b + 1) * framesPerBucket - 1);
      const total = Math.max(0, end - start + 1);
      const used = bucketCounts[b] || 0;
      const utilizationPercent = total > 0 ? Math.round((used / total) * 100) : 0;
      buckets.push({
        bucketIndex: b,
        startFrame: start,
        endFrame: end,
        totalFrames: total,
        usedFrames: used,
        utilizationPercent,
      });
    }

    return buckets;
  }

  public getFramesByPid(pid: number): MemoryFrame[] {
    const results: MemoryFrame[] = [];
    for (const frame of this.allocatedFrames.values()) {
      if (frame.allocatedPid === pid) {
        results.push(frame);
      }
    }
    return results;
  }

  public allocateFrame(
    frameNumber: number,
    pid: number,
    pageNumber: number,
    timestamp: SimulationTime
  ): boolean {
    if (frameNumber < 0 || frameNumber >= this.frameCount) return false;

    const frame: MemoryFrame = {
      frameNumber,
      isFree: false,
      allocatedPid: pid,
      pageNumber,
      allocatedAt: timestamp,
      lastAccessedAt: timestamp,
      isDirty: false,
      referenceBit: true,
    };
    this.allocatedFrames.set(frameNumber, frame);
    return true;
  }

  public freeFrame(frameNumber: number): void {
    if (this.allocatedFrames.has(frameNumber)) {
      this.allocatedFrames.delete(frameNumber);
      this.recycledFrames.push(frameNumber);
    }
  }

  public freeProcessFrames(pid: number): number {
    let freedCount = 0;
    const toFree: number[] = [];
    for (const [frameNum, frame] of this.allocatedFrames.entries()) {
      if (frame.allocatedPid === pid) {
        toFree.push(frameNum);
      }
    }
    for (const frameNum of toFree) {
      this.freeFrame(frameNum);
      freedCount++;
    }
    return freedCount;
  }

  public touchFrame(frameNumber: number, timestamp: SimulationTime, isWrite: boolean = false): void {
    const frame = this.allocatedFrames.get(frameNumber);
    if (frame) {
      frame.lastAccessedAt = timestamp;
      frame.referenceBit = true;
      if (isWrite) {
        frame.isDirty = true;
      }
    }
  }

  public getUsedMemoryBytes(): number {
    return this.allocatedFrames.size * this.frameSizeBytes;
  }

  public getMemoryUtilization(): number {
    if (this.frameCount === 0) return 0;
    return Math.round((this.allocatedFrames.size / this.frameCount) * 100);
  }
}
