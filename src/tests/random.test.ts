import { describe, it, expect } from 'vitest';
import { DeterministicRandom } from '../simulation/runtime/Random';

describe('DeterministicRandom PRNG', () => {
  it('produces identical sequences given identical seeds', () => {
    const rng1 = new DeterministicRandom('NOVA-TEST-SEED');
    const rng2 = new DeterministicRandom('NOVA-TEST-SEED');

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces bounded integers correctly', () => {
    const rng = new DeterministicRandom(42);
    for (let i = 0; i < 50; i++) {
      const val = rng.nextInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('can reset and reproduce sequence', () => {
    const rng = new DeterministicRandom('SEEDED');
    const firstRun = [rng.next(), rng.next(), rng.next()];

    rng.reseed('SEEDED');
    const secondRun = [rng.next(), rng.next(), rng.next()];

    expect(firstRun).toEqual(secondRun);
  });
});
