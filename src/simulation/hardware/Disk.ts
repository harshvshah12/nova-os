// ============================================================================
// NOVA OS — VIRTUAL HARD DISK & DISK SCHEDULER
// Realistic track/cylinder physical model with FCFS, SSTF, SCAN, LOOK algorithms
// ============================================================================

import type {
  DiskRequest,
  DiskState,
  DiskSchedulingAlgorithm,
  SimulationTime,
} from '../types';
import { prng } from '../runtime/Random';

export class VirtualDisk {
  private sizeGb: number = 20;
  private readonly totalTracks: number = 200; // 0 to 199 cylinders
  private currentTrack: number = 50;
  private headDirection: 'UP' | 'DOWN' = 'UP';
  private pendingRequests: DiskRequest[] = [];
  private completedRequests: DiskRequest[] = [];
  private totalHeadMovements: number = 0;
  private algorithm: DiskSchedulingAlgorithm = 'SCAN';
  private requestCounter: number = 1000;
  private currentActiveRequest: {
    request: DiskRequest;
    ticksRemaining: number;
  } | null = null;

  constructor(sizeGb: number = 20, initialTrack: number = 50) {
    this.sizeGb = sizeGb;
    this.currentTrack = initialTrack;
  }

  public getState(): DiskState {
    return {
      totalTracks: this.totalTracks,
      currentTrack: this.currentTrack,
      headDirection: this.headDirection,
      pendingRequests: [...this.pendingRequests],
      completedRequests: this.completedRequests.slice(-30),
      totalHeadMovements: this.totalHeadMovements,
      algorithm: this.algorithm,
    };
  }

  public getAlgorithm(): DiskSchedulingAlgorithm {
    return this.algorithm;
  }

  public setAlgorithm(algo: DiskSchedulingAlgorithm): void {
    this.algorithm = algo;
  }

  public getCurrentTrack(): number {
    return this.currentTrack;
  }

  public getTotalHeadMovements(): number {
    return this.totalHeadMovements;
  }

  public queueRequest(
    pid: number,
    track: number,
    sector: number,
    type: 'READ' | 'WRITE',
    timestamp: SimulationTime
  ): DiskRequest {
    const clampedTrack = Math.max(0, Math.min(this.totalTracks - 1, Math.round(track)));
    const clampedSector = Math.max(0, Math.min(31, Math.round(sector)));

    const request: DiskRequest = {
      id: `dreq-${timestamp}-${++this.requestCounter}`,
      track: clampedTrack,
      sector: clampedSector,
      pid,
      type,
      timestamp,
      completed: false,
    };

    this.pendingRequests.push(request);
    return request;
  }

  /**
   * Advance 1 simulation tick on the disk controller
   * Returns any request that completed during this tick
   */
  public tick(timestamp: SimulationTime): DiskRequest | null {
    // If we have an active request currently seeking / reading
    if (this.currentActiveRequest) {
      this.currentActiveRequest.ticksRemaining--;

      if (this.currentActiveRequest.ticksRemaining <= 0) {
        const completed = this.currentActiveRequest.request;
        completed.completed = true;
        this.completedRequests.push(completed);
        this.currentActiveRequest = null;
        return completed;
      }
      return null;
    }

    // No active request, pick next according to current scheduling algorithm
    if (this.pendingRequests.length === 0) {
      return null;
    }

    const nextIndex = this.selectNextRequestIndex();
    if (nextIndex === -1) return null;

    const [nextRequest] = this.pendingRequests.splice(nextIndex, 1);
    const distance = Math.abs(nextRequest.track - this.currentTrack);
    this.totalHeadMovements += distance;

    if (nextRequest.track > this.currentTrack) {
      this.headDirection = 'UP';
    } else if (nextRequest.track < this.currentTrack) {
      this.headDirection = 'DOWN';
    }

    this.currentTrack = nextRequest.track;

    // Simulated latency in ticks: 1 tick seek per 20 tracks + 2 ticks transfer
    const ticksRequired = Math.max(2, Math.ceil(distance / 20) + 2);
    this.currentActiveRequest = {
      request: nextRequest,
      ticksRemaining: ticksRequired,
    };

    return null;
  }

  /**
   * Implements the 6 classical disk scheduling algorithms
   */
  private selectNextRequestIndex(): number {
    if (this.pendingRequests.length === 0) return -1;
    if (this.pendingRequests.length === 1) return 0;

    switch (this.algorithm) {
      case 'FCFS':
        return 0; // First-come first-served

      case 'SSTF': {
        // Shortest Seek Time First
        let minDistance = Infinity;
        let bestIndex = 0;
        for (let i = 0; i < this.pendingRequests.length; i++) {
          const dist = Math.abs(this.pendingRequests[i].track - this.currentTrack);
          if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i;
          }
        }
        return bestIndex;
      }

      case 'SCAN': {
        // Elevator algorithm
        let bestIndex = -1;
        let minDiff = Infinity;

        // Try in current direction
        for (let i = 0; i < this.pendingRequests.length; i++) {
          const req = this.pendingRequests[i];
          if (this.headDirection === 'UP' && req.track >= this.currentTrack) {
            const diff = req.track - this.currentTrack;
            if (diff < minDiff) {
              minDiff = diff;
              bestIndex = i;
            }
          } else if (this.headDirection === 'DOWN' && req.track <= this.currentTrack) {
            const diff = this.currentTrack - req.track;
            if (diff < minDiff) {
              minDiff = diff;
              bestIndex = i;
            }
          }
        }

        // If no request in current direction, reverse direction and search
        if (bestIndex === -1) {
          this.headDirection = this.headDirection === 'UP' ? 'DOWN' : 'UP';
          minDiff = Infinity;
          for (let i = 0; i < this.pendingRequests.length; i++) {
            const req = this.pendingRequests[i];
            if (this.headDirection === 'UP' && req.track >= this.currentTrack) {
              const diff = req.track - this.currentTrack;
              if (diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
              }
            } else if (this.headDirection === 'DOWN' && req.track <= this.currentTrack) {
              const diff = this.currentTrack - req.track;
              if (diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
              }
            }
          }
        }

        return bestIndex !== -1 ? bestIndex : 0;
      }

      case 'C-SCAN': {
        // Circular SCAN (only serves in UP direction, jumps to lowest request when done)
        let bestIndex = -1;
        let minDiff = Infinity;

        for (let i = 0; i < this.pendingRequests.length; i++) {
          const req = this.pendingRequests[i];
          if (req.track >= this.currentTrack) {
            const diff = req.track - this.currentTrack;
            if (diff < minDiff) {
              minDiff = diff;
              bestIndex = i;
            }
          }
        }

        // Wrap around to smallest track
        if (bestIndex === -1) {
          let minTrack = Infinity;
          for (let i = 0; i < this.pendingRequests.length; i++) {
            if (this.pendingRequests[i].track < minTrack) {
              minTrack = this.pendingRequests[i].track;
              bestIndex = i;
            }
          }
        }

        return bestIndex !== -1 ? bestIndex : 0;
      }

      case 'LOOK': {
        // Similar to SCAN but doesn't travel to disk limits 0 and 199 if not requested
        return this.selectNextLookIndex(false);
      }

      case 'C-LOOK': {
        // Circular LOOK
        return this.selectNextLookIndex(true);
      }

      default:
        return 0;
    }
  }

  private selectNextLookIndex(circular: boolean): number {
    let bestIndex = -1;
    let minDiff = Infinity;

    for (let i = 0; i < this.pendingRequests.length; i++) {
      const req = this.pendingRequests[i];
      if (this.headDirection === 'UP' && req.track >= this.currentTrack) {
        const diff = req.track - this.currentTrack;
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      } else if (!circular && this.headDirection === 'DOWN' && req.track <= this.currentTrack) {
        const diff = this.currentTrack - req.track;
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      }
    }

    if (bestIndex !== -1) return bestIndex;

    if (circular) {
      // Jump to lowest track requested
      let minTrack = Infinity;
      for (let i = 0; i < this.pendingRequests.length; i++) {
        if (this.pendingRequests[i].track < minTrack) {
          minTrack = this.pendingRequests[i].track;
          bestIndex = i;
        }
      }
      return bestIndex !== -1 ? bestIndex : 0;
    } else {
      // Reverse direction
      this.headDirection = this.headDirection === 'UP' ? 'DOWN' : 'UP';
      return this.selectNextLookIndex(false);
    }
  }

  public reset(): void {
    this.currentTrack = 50;
    this.headDirection = 'UP';
    this.pendingRequests = [];
    this.completedRequests = [];
    this.totalHeadMovements = 0;
    this.currentActiveRequest = null;
  }
}
