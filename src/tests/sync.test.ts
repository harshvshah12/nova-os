import { describe, it, expect } from 'vitest';
import { Semaphore } from '../simulation/synchronization/Semaphore';
import { Mutex } from '../simulation/synchronization/Mutex';
import { BoundedBufferLab, DiningPhilosophersLab } from '../simulation/synchronization/SyncScenarios';

describe('Phase 6 — Synchronization Lab Primitives', () => {
  it('Semaphore blocks when count <= 0 and wakes on signal', () => {
    const sem = new Semaphore('test_sem', 'Test', 1);

    expect(sem.wait(10, 100)).toBe(true); // Decrements to 0 -> acquired
    expect(sem.wait(11, 101)).toBe(false); // Decrements to -1 -> blocked!
    expect(sem.getWaitQueue()).toContain(11);

    const awakened = sem.signal(102); // Increments to 0, wakes head
    expect(awakened).toBe(11);
    expect(sem.getWaitQueue().length).toBe(0);
  });

  it('Mutex grants exclusive access and rejects non-owners', () => {
    const mutex = new Mutex('test_mutex', 'TestMutex');

    expect(mutex.acquire(10, 100)).toBe(true);
    expect(mutex.getOwner()).toBe(10);

    // Another PID tries to acquire -> blocked
    expect(mutex.acquire(11, 101)).toBe(false);
    expect(mutex.getWaitQueue()).toContain(11);

    // Non-owner tries to release -> fails
    expect(mutex.release(99, 102)).toBeNull();
    expect(mutex.isLocked()).toBe(true);

    // Owner releases -> hands off to PID 11
    const nextOwner = mutex.release(10, 103);
    expect(nextOwner).toBe(11);
    expect(mutex.getOwner()).toBe(11);
  });

  it('BoundedBuffer circular queue coordinates producers and consumers safely', () => {
    const bb = new BoundedBufferLab(3);

    expect(bb.produce(1, 'Item-1', 10)).toBe(true);
    expect(bb.produce(1, 'Item-2', 20)).toBe(true);
    expect(bb.produce(1, 'Item-3', 30)).toBe(true);

    // Buffer full -> 4th item blocks producer
    expect(bb.produce(1, 'Item-4', 40)).toBe(false);
    expect(bb.getState().producersBlocked).toContain(1);

    // Consumer consumes 1 item -> unblocks
    const consumed = bb.consume(2, 50);
    expect(consumed).toBe('Item-1');
  });

  it('DiningPhilosophers prevents deadlock under asymmetric pickup strategy', () => {
    const dp = new DiningPhilosophersLab();
    dp.preventionMode = 'ASYMMETRIC';

    // All 5 attempt to take forks
    for (let i = 0; i < 5; i++) {
      dp.takeForks(i);
    }

    // Must not be deadlocked because asymmetric pickup breaks circular wait!
    expect(dp.checkDeadlock()).toBe(false);
    const eating = dp.getState().philosophers.filter((p) => p.state === 'EATING');
    expect(eating.length).toBeGreaterThan(0);
  });
});
