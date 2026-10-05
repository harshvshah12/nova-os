// ============================================================================
// NOVA OS — WORKLOAD GENERATOR
// Synthetic and real-world instruction streams for CPU, I/O, Memory, and Portfolio Projects
// ============================================================================

import type { Instruction, WorkloadType } from '../types';
import { prng } from '../runtime/Random';

export class WorkloadGenerator {
  public static createInstructions(
    type: WorkloadType,
    length: number = 8
  ): Instruction[] {
    switch (type) {
      case 'CPU_BOUND':
        return this.createCpuBound(length);
      case 'IO_BOUND':
        return this.createIoBound(length);
      case 'MEMORY_INTENSIVE':
        return this.createMemoryIntensive(length);
      case 'MIXED':
      default:
        return this.createMixed(length);
    }
  }

  public static createCpuBound(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      const cycles = prng.nextInt(4, 7); // 4 to 7 cycles
      list.push({
        type: 'CPU',
        cycles,
        cyclesRemaining: cycles,
        description: `Compute loop #${i + 1} (matrix/vector)`,
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Process exit syscall',
    });
    return list;
  }

  public static createIoBound(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      list.push({
        type: 'CPU',
        cycles: 1,
        cyclesRemaining: 1,
        description: 'Prepare I/O buffer',
      });
      list.push({
        type: 'IO_REQUEST',
        cycles: 1,
        cyclesRemaining: 1,
        ioTrack: prng.nextInt(10, 190),
        description: `Disk seek track ${(i * 25) % 190}`,
      });
      list.push({
        type: 'WAIT',
        cycles: 3,
        cyclesRemaining: 3,
        description: 'Wait for disk controller interrupt',
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Exit syscall',
    });
    return list;
  }

  public static createMemoryIntensive(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    // Access several virtual pages (some will trigger page faults)
    const pages = [0, 1, 4, 7, 2, 9, 12, 3, 14, 5];

    for (let i = 0; i < length; i++) {
      const page = pages[i % pages.length];
      const isWrite = i % 2 === 1;

      list.push({
        type: 'CPU',
        cycles: 1,
        cyclesRemaining: 1,
        description: 'Compute memory address pointer',
      });
      list.push({
        type: isWrite ? 'MEMORY_WRITE' : 'MEMORY_READ',
        cycles: 2,
        cyclesRemaining: 2,
        address: page * 4096 + (i * 64),
        description: `${isWrite ? 'Write' : 'Read'} Virtual Page ${page} (0x${(page * 4096).toString(16)})`,
      });
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Exit syscall',
    });
    return list;
  }

  public static createMixed(length: number = 8): Instruction[] {
    const list: Instruction[] = [];
    for (let i = 0; i < length; i++) {
      const mod = i % 3;
      if (mod === 0) {
        list.push({
          type: 'CPU',
          cycles: 3,
          cyclesRemaining: 3,
          description: `Computation step ${i + 1}`,
        });
      } else if (mod === 1) {
        list.push({
          type: 'MEMORY_READ',
          cycles: 2,
          cyclesRemaining: 2,
          address: (i % 6) * 4096,
          description: `Load cache from virtual page ${i % 6}`,
        });
      } else {
        list.push({
          type: 'IO_REQUEST',
          cycles: 1,
          cyclesRemaining: 1,
          ioTrack: (i * 30) % 199,
          description: 'Synchronize file descriptors',
        });
      }
    }
    list.push({
      type: 'EXIT',
      cycles: 1,
      cyclesRemaining: 1,
      description: 'Normal process exit',
    });
    return list;
  }

  /**
   * Project-specific deterministic instruction streams
   */
  public static createProjectWorkload(identifier: string): Instruction[] | null {
    const id = identifier.toLowerCase().replace(/_/g, '-');

    if (id.includes('deepfake')) {
      return [
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'ViT-B/16 patch embedding extraction (16x16)' },
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x1000, description: 'Read input frame RGB tensor buffer' },
        { type: 'CPU', cycles: 6, cyclesRemaining: 6, description: 'Multi-head self-attention transformer forward pass' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: '2D Discrete Fast Fourier Transform (FFT) high-freq spectrum' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Write fused feature embeddings to latent cache' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Softmax binary forgery classification logits' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'DeepFake detection pipeline complete' },
      ];
    }

    if (id.includes('pricing') || id.includes('hotel')) {
      return [
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 45, description: 'Read historical reservation lead-times from disk' },
        { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Await disk controller DMA transfer' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Calculate booking hazard rate & elasticity curve' },
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x3000, description: 'Read competitor scraping cache matrix' },
        { type: 'CPU', cycles: 5, cyclesRemaining: 5, description: 'XGBoost gradient boosted trees evaluation' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x4000, description: 'Commit dynamic RevPAR price vector to memory' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Pricing optimization run finalized' },
      ];
    }

    if (id.includes('vegapod') || id.includes('hyperloop')) {
      return [
        { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Decode 100Hz CAN bus frame header' },
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x1000, description: 'Read pneumatic brake pressure transducer' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Levitation air gap Kalman filter estimation' },
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 90, description: 'Log telemetry frame to blackbox flash storage' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Thermal threshold watchdog check (<55C)' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Update live WebSocket telemetry broadcast buffer' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Telemetry frame tick finished' },
      ];
    }

    if (id.includes('musically') || id.includes('audio')) {
      return [
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x1000, description: 'Read PCM audio byte chunks (44.1 kHz)' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Web Audio API 1024-point FFT frequency binning' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x5000, description: 'Write canvas frequency bar coordinates' },
        { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Interpolate 60 FPS spectrum smoothing decay' },
        { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for next audio hardware buffer interrupt' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Audio frame visualizer render done' },
      ];
    }

    if (id.includes('fraud') || id.includes('sentinel')) {
      return [
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 60, description: 'Ingest real-time transaction payload from socket' },
        { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for network packet descriptor' },
        { type: 'CPU', cycles: 5, cyclesRemaining: 5, description: 'Isolation Forest decision path tree traversal' },
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Query merchant fraud risk profile table' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Calculate ensemble anomaly score (0.0 - 1.0)' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x6000, description: 'Log decision status and fraud alert' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Fraud evaluation cycle complete' },
      ];
    }

    if (id.includes('penfight')) {
      return [
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Calculate swipe trajectory vector and initial impulse' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Run 2D rigid-body narrow-phase collision check' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x3000, description: 'Update pen position & angular momentum' },
        { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Apply table surface friction damping (mu = 0.15)' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Physics sub-step integrated' },
      ];
    }

    if (id.includes('parksense')) {
      return [
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 72, description: 'Receive ultrasonic sensor mesh MQTT packet' },
        { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for network buffer dequeue' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'YOLOv8 bounding box IoU parking slot overlap' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x4000, description: 'Update occupancy bitmask in shared memory' },
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 75, description: 'Broadcast slot status to mobile dashboard' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'ParkSense daemon tick completed' },
      ];
    }

    if (id.includes('gesture') || id.includes('tinyml') || id.includes('esp32')) {
      return [
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x3000, description: 'Fetch OV2640 96x96 grayscale image from PSRAM' },
        { type: 'CPU', cycles: 5, cyclesRemaining: 5, description: 'Depthwise separable int8 quantized convolution pass' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Softmax activation & gesture index argmax' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x3800, description: 'Write gesture enum to GPIO output register' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'TinyML inference cycle finished' },
      ];
    }

    if (id.includes('maze')) {
      return [
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x1000, description: 'Read 60x30 grid cell obstacle matrix' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Evaluate A* f(n) = g(n) + h(n) Manhattan heuristic' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Push neighboring unvisited nodes to priority queue' },
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Backtrack optimal shortest path parent pointers' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Graph traversal step complete' },
      ];
    }

    if (id.includes('connectsphere') || id.includes('connext')) {
      return [
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 110, description: 'Read CRDT operation delta from WebSocket connection' },
        { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for network socket' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Merge vector clocks and resolve concurrent edit conflict' },
        { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x4000, description: 'Commit document state change to memory buffer' },
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 115, description: 'Multicast operation delta to room peers' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'CRDT synchronization event settled' },
      ];
    }

    if (id.includes('nova')) {
      return [
        { type: 'CPU', cycles: 3, cyclesRemaining: 3, description: 'Context switch & quantum dispatch evaluation' },
        { type: 'MEMORY_READ', cycles: 2, cyclesRemaining: 2, address: 0x4000, description: 'MMU two-level page table directory walk' },
        { type: 'CPU', cycles: 4, cyclesRemaining: 4, description: 'Banker algorithm resource allocation matrix verification' },
        { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 10, description: 'Sync journal metadata block to virtual disk' },
        { type: 'EXIT', cycles: 1, cyclesRemaining: 1, description: 'Kernel supervisor tick complete' },
      ];
    }

    return null;
  }

  public static createAppWorkload(name: string): Instruction[] {
    const projectWorkload = this.createProjectWorkload(name);
    if (projectWorkload) {
      return projectWorkload;
    }

    switch (name.toLowerCase()) {
      case 'bash':
      case 'terminal':
        return [
          { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Poll terminal input' },
          { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Wait for user keystroke' },
          { type: 'CPU', cycles: 1, cyclesRemaining: 1, description: 'Echo stdout' },
        ];

      case 'editor':
      case 'text-editor':
        return [
          { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Render buffer' },
          { type: 'MEMORY_WRITE', cycles: 2, cyclesRemaining: 2, address: 0x2000, description: 'Update document text in memory' },
          { type: 'IO_REQUEST', cycles: 1, cyclesRemaining: 1, ioTrack: 40, description: 'Auto-save buffer to virtual disk' },
        ];

      case 'monitor':
      case 'system-monitor':
        return [
          { type: 'CPU', cycles: 2, cyclesRemaining: 2, description: 'Read /proc statistics' },
          { type: 'MEMORY_READ', cycles: 1, cyclesRemaining: 1, address: 0x1000, description: 'Inspect memory table' },
          { type: 'WAIT', cycles: 2, cyclesRemaining: 2, description: 'Sleep until next sample interval' },
        ];

      case 'compiler':
        return this.createCpuBound(12);

      default:
        return this.createMixed(6);
    }
  }
}
