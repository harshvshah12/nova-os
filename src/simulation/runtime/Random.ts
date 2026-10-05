/**
 * Deterministic Pseudo-Random Number Generator (PRNG) for NOVA OS
 * Uses the Mulberry32 algorithm with 32-bit internal state.
 * Allows reproducible simulation runs and predictable academic debugging.
 */
export class DeterministicRandom {
  private initialSeed: number;
  private state: number;

  constructor(seed: number | string = 'NOVA-2026-001') {
    this.initialSeed = this.hashSeed(seed);
    this.state = this.initialSeed;
  }

  /**
   * Hashes string or numeric seed to a 32-bit unsigned integer
   */
  private hashSeed(seed: number | string): number {
    if (typeof seed === 'number') {
      return seed >>> 0;
    }
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  /**
   * Mulberry32 32-bit PRNG step
   * Returns a float in [0, 1)
   */
  public next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in range [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /**
   * Returns a random alphanumeric string
   */
  public nextString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars[this.nextInt(0, chars.length - 1)];
    }
    return res;
  }

  /**
   * Resets the PRNG state back to initial seed or sets a new seed
   */
  public reseed(seed?: number | string): void {
    if (seed !== undefined) {
      this.initialSeed = this.hashSeed(seed);
    }
    this.state = this.initialSeed;
  }

  /**
   * Returns current state integer for snapshotting/checkpoints
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Restores state integer from checkpoint
   */
  public setState(savedState: number): void {
    this.state = savedState >>> 0;
  }
}

// Global default instance for the simulation
export const prng = new DeterministicRandom('NOVA-2026-001');
