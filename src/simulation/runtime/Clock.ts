// ============================================================================
// NOVA OS — SIMULATION CLOCK
// Deterministic virtual time management with variable speed & step execution
// ============================================================================

import type { SimulationTime } from '../types';

export type ClockSpeed = 0.1 | 0.25 | 0.5 | 1.0 | 2.0 | 5.0 | 10.0;

export interface ClockListener {
  (time: SimulationTime, deltaTime: number): void;
}

export class SimulationClock {
  private currentTime: SimulationTime = 0;
  private isRunning: boolean = false;
  private speed: ClockSpeed = 1.0;
  private readonly baseTickMs: number = 10; // 10ms per logical tick
  private listeners: Set<ClockListener> = new Set();
  private intervalHandle: any = null;
  private totalTicks: number = 0;

  constructor() {
    this.reset();
  }

  public getTime(): SimulationTime {
    return this.currentTime;
  }

  public getFormattedTime(): string {
    const totalSeconds = Math.floor(this.currentTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = this.currentTime % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  public getTotalTicks(): number {
    return this.totalTicks;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getSpeed(): ClockSpeed {
    return this.speed;
  }

  public setSpeed(newSpeed: ClockSpeed): void {
    this.speed = newSpeed;
    if (this.isRunning) {
      this.restartTimer();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.restartTimer();
  }

  public pause(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  public reset(): void {
    this.pause();
    this.currentTime = 0;
    this.totalTicks = 0;
  }

  public stepTick(ticks: number = 1): void {
    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.pause();
    }
    for (let i = 0; i < ticks; i++) {
      this.advanceTick();
    }
  }

  public advanceTick(): void {
    this.currentTime += this.baseTickMs;
    this.totalTicks++;
    this.notifyListeners(this.currentTime, this.baseTickMs);
  }

  public subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(time: SimulationTime, deltaTime: number): void {
    for (const listener of this.listeners) {
      try {
        listener(time, deltaTime);
      } catch (err) {
        console.error('Error in clock listener:', err);
      }
    }
  }

  private restartTimer(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    // Interval duration inversely proportional to speed
    // At 1x: tick every 10ms
    // At 2x: tick every 5ms
    // At 0.5x: tick every 20ms
    const intervalMs = Math.max(1, Math.round(this.baseTickMs / this.speed));

    this.intervalHandle = setInterval(() => {
      this.advanceTick();
    }, intervalMs);
  }
}
