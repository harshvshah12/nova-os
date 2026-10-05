// ============================================================================
// NOVA OS — 4KB PHYSICAL MEMORY & MMU MATH TESTS
// Strict verification of 524,288 physical frames, sparse storage,
// 20-bit VPN / 12-bit offset decomposition, and physical address calculation
// ============================================================================

import { describe, it, expect } from 'vitest';
import { VirtualRam } from '../simulation/hardware/Ram';
import { MemoryManager } from '../simulation/memory/MemoryManager';
import { EventBus } from '../simulation/runtime/EventBus';

describe('NOVA OS — 4KB Physical Memory Math & MMU Translation', () => {
  it('VirtualRam with 2048 MB RAM strictly calculates 524,288 physical frames', () => {
    const ram = new VirtualRam(2048);
    expect(ram.getTotalMb()).toBe(2048);
    expect(ram.getFrameSizeBytes()).toBe(4096);
    expect(ram.getFrameCount()).toBe(524288); // 2048 * 1024 * 1024 / 4096 = 524,288
    expect(ram.getFreeFrameCount()).toBe(524288);
    expect(ram.getUsedFrameCount()).toBe(0);
    expect(ram.getMemoryUtilization()).toBe(0);
  });

  it('Sparse Map storage allocates high frame indices without memory exhaustion', () => {
    const ram = new VirtualRam(2048);

    // Allocate frame 0 and highest frame 524287
    expect(ram.allocateFrame(0, 10, 0, 100)).toBe(true);
    expect(ram.allocateFrame(524287, 20, 1, 105)).toBe(true);

    expect(ram.getUsedFrameCount()).toBe(2);
    expect(ram.getFreeFrameCount()).toBe(524286);

    const frame0 = ram.getFrame(0);
    expect(frame0?.isFree).toBe(false);
    expect(frame0?.allocatedPid).toBe(10);

    const frameHigh = ram.getFrame(524287);
    expect(frameHigh?.isFree).toBe(false);
    expect(frameHigh?.allocatedPid).toBe(20);

    // Frame in between is sparse and free
    const frameMid = ram.getFrame(250000);
    expect(frameMid?.isFree).toBe(true);
    expect(frameMid?.allocatedPid).toBeNull();

    // Out of bounds frame returns undefined
    expect(ram.getFrame(524288)).toBeUndefined();
    expect(ram.getFrame(-1)).toBeUndefined();

    // Freeing works accurately
    ram.freeFrame(0);
    expect(ram.getFrame(0)?.isFree).toBe(true);
    expect(ram.getUsedFrameCount()).toBe(1);
    expect(ram.getFreeFrameCount()).toBe(524287);
  });

  it('MMU decomposes 32-bit Virtual Address into 20-bit VPN and 12-bit Offset', () => {
    const ram = new VirtualRam(2048);
    const bus = new EventBus();
    const mm = new MemoryManager(ram, bus);

    // Test Address 0x00003064 = 12,388 decimal
    // VPN = floor(12388 / 4096) = 3
    // Offset = 12388 % 4096 = 100 (0x64)
    const result1 = mm.translateVirtualAddress(0x00003064, 1);
    expect(result1.vpn).toBe(3);
    expect(result1.offset).toBe(0x64);
    expect(result1.isPresent).toBe(false);
    expect(result1.physicalAddress).toBeNull();

    // Trigger access to allocate frame
    const accessRes = mm.accessMemory(1, 0x00003064, false, 50);
    expect(accessRes.pageFault).toBe(true);
    const assignedFrame = accessRes.frameNumber!;

    // Now re-translate: Physical Address = (assignedFrame * 4096) + offset
    const result2 = mm.translateVirtualAddress(0x00003064, 1);
    expect(result2.isPresent).toBe(true);
    expect(result2.frameNumber).toBe(assignedFrame);
    expect(result2.physicalAddress).toBe(assignedFrame * 4096 + 0x64);
  });

  it('Bucket summaries split 524,288 frames into 64 segments of 8,192 frames (32 MB each)', () => {
    const ram = new VirtualRam(2048);
    const buckets = ram.getBucketSummaries(64);

    expect(buckets.length).toBe(64);
    expect(buckets[0].startFrame).toBe(0);
    expect(buckets[0].endFrame).toBe(8191);
    expect(buckets[0].totalFrames).toBe(8192);

    expect(buckets[63].endFrame).toBe(524287);

    // Allocate frame in bucket 2 (frame 17000)
    ram.allocateFrame(17000, 42, 0, 100);
    const updatedBuckets = ram.getBucketSummaries(64);
    const bucket2 = updatedBuckets[2];
    expect(bucket2.usedFrames).toBe(1);
    expect(bucket2.startFrame).toBe(16384);
  });
});
