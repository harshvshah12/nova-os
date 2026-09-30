// ============================================================================
// NOVA OS — DEADLOCK & BANKER'S ALGORITHM ENGINE
// Resource Allocation Graph (RAG), Cycle Detection, and Safe Sequence Evaluation
// ============================================================================

import type { ResourceType, DeadlockState, SimulationTime } from '../types';
import type { EventBus } from '../runtime/EventBus';

export class DeadlockDetector {
  private resources: ResourceType[] = [];
  private eventBus?: EventBus;

  // Process ID -> Allocation array [resourceIndex]
  private allocationMap: Map<number, number[]> = new Map();
  // Process ID -> Max demand array [resourceIndex]
  private maxMap: Map<number, number[]> = new Map();
  // Process ID -> Current pending request [resourceIndex]
  private requestMap: Map<number, number[]> = new Map();

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.initDefaultResources();
  }

  public initDefaultResources(): void {
    this.resources = [
      { id: 'R1', name: 'GPU Compute Shaders', totalInstances: 3, availableInstances: 3, color: '#38BDF8' },
      { id: 'R2', name: 'Magnetic Disk Channel', totalInstances: 2, availableInstances: 2, color: '#FBBF24' },
      { id: 'R3', name: 'Virtual Sound Card', totalInstances: 2, availableInstances: 2, color: '#34D399' },
      { id: 'R4', name: 'Network Sockets Bus', totalInstances: 4, availableInstances: 4, color: '#A78BFA' },
    ];
    this.allocationMap.clear();
    this.maxMap.clear();
    this.requestMap.clear();
  }

  public getResources(): ResourceType[] {
    return this.resources;
  }

  public registerProcess(pid: number, maxDemand: number[]): void {
    const zeros = new Array(this.resources.length).fill(0);
    this.allocationMap.set(pid, [...zeros]);
    this.requestMap.set(pid, [...zeros]);
    this.maxMap.set(pid, [...maxDemand]);
  }

  public unregisterProcess(pid: number): void {
    // Release all allocations
    const alloc = this.allocationMap.get(pid);
    if (alloc) {
      for (let i = 0; i < alloc.length; i++) {
        this.resources[i].availableInstances += alloc[i];
      }
    }
    this.allocationMap.delete(pid);
    this.maxMap.delete(pid);
    this.requestMap.delete(pid);
  }

  /**
   * Request resources using Banker's Algorithm safety check
   */
  public requestResources(
    pid: number,
    request: number[],
    timestamp: SimulationTime = 0
  ): { granted: boolean; reason: string; safeSequence?: number[] } {
    let alloc = this.allocationMap.get(pid);
    let max = this.maxMap.get(pid);

    if (!alloc || !max) {
      this.registerProcess(pid, request);
      alloc = this.allocationMap.get(pid)!;
      max = this.maxMap.get(pid)!;
    }

    // 1. Check if Request <= Need
    for (let i = 0; i < request.length; i++) {
      const need = max[i] - alloc[i];
      if (request[i] > need) {
        return {
          granted: false,
          reason: `Process PID ${pid} exceeded its declared maximum claim for resource ${this.resources[i].id}`,
        };
      }
    }

    // 2. Check if Request <= Available
    for (let i = 0; i < request.length; i++) {
      if (request[i] > this.resources[i].availableInstances) {
        // Record pending request edge
        const reqMap = this.requestMap.get(pid)!;
        reqMap[i] = request[i];

        return {
          granted: false,
          reason: `Insufficient instances of ${this.resources[i].id}. Process PID ${pid} must wait.`,
        };
      }
    }

    // 3. Pretend to allocate and run Banker's Safety Algorithm
    for (let i = 0; i < request.length; i++) {
      this.resources[i].availableInstances -= request[i];
      alloc[i] += request[i];
    }

    const safetyResult = this.checkSafety();

    if (safetyResult.isSafe) {
      // Safe state: grant allocation
      this.eventBus?.emit(
        'RESOURCE_REQUEST',
        'deadlock',
        'BankerEngine',
        `PID ${pid} granted resources [${request.join(', ')}]. System remains in SAFE state.`,
        timestamp,
        {
          pid,
          metadata: { request, safeSequence: safetyResult.safeSequence },
          explanation: `Banker's Algorithm proved system safety: Safe execution sequence [${safetyResult.safeSequence.join(' -> ')}] guarantees no circular wait deadlock can occur.`,
        }
      );

      return {
        granted: true,
        reason: 'Granted in safe state',
        safeSequence: safetyResult.safeSequence,
      };
    } else {
      // Unsafe state: Rollback allocation!
      for (let i = 0; i < request.length; i++) {
        this.resources[i].availableInstances += request[i];
        alloc[i] -= request[i];
      }

      // Record pending request edge in graph
      const reqMap = this.requestMap.get(pid)!;
      for (let i = 0; i < request.length; i++) {
        reqMap[i] = request[i];
      }

      this.eventBus?.emit(
        'DEADLOCK_DETECTED',
        'deadlock',
        'BankerEngine',
        `Request by PID ${pid} denied: Would lead to an UNSAFE state (Deadlock vulnerability)!`,
        timestamp,
        {
          pid,
          metadata: { request },
          explanation: `Banker's algorithm detected that granting this request would leave available resources below the threshold required to guarantee process completion, risking deadlock.`,
        }
      );

      return {
        granted: false,
        reason: 'Unsafe state: Request denied to prevent deadlock',
      };
    }
  }

  /**
   * Banker's Safety Algorithm
   */
  public checkSafety(): { isSafe: boolean; safeSequence: number[] } {
    const pids = Array.from(this.allocationMap.keys());
    const m = this.resources.length;
    const work = this.resources.map((r) => r.availableInstances);
    const finish = new Map<number, boolean>();
    pids.forEach((p) => finish.set(p, false));

    const safeSequence: number[] = [];
    let progress = true;

    while (progress) {
      progress = false;

      for (const pid of pids) {
        if (!finish.get(pid)) {
          const alloc = this.allocationMap.get(pid)!;
          const max = this.maxMap.get(pid)!;

          let canProceed = true;
          for (let j = 0; j < m; j++) {
            const need = max[j] - alloc[j];
            if (need > work[j]) {
              canProceed = false;
              break;
            }
          }

          if (canProceed) {
            for (let j = 0; j < m; j++) {
              work[j] += alloc[j];
            }
            finish.set(pid, true);
            safeSequence.push(pid);
            progress = true;
          }
        }
      }
    }

    const isSafe = safeSequence.length === pids.length;
    return { isSafe, safeSequence };
  }

  /**
   * Release resources held by a process
   */
  public releaseResources(pid: number, release: number[], timestamp: SimulationTime = 0): void {
    const alloc = this.allocationMap.get(pid);
    if (!alloc) return;

    for (let i = 0; i < release.length; i++) {
      const amount = Math.min(release[i], alloc[i]);
      alloc[i] -= amount;
      this.resources[i].availableInstances += amount;
    }

    this.eventBus?.emit(
      'RESOURCE_RELEASE',
      'deadlock',
      'BankerEngine',
      `PID ${pid} released resources [${release.join(', ')}]`,
      timestamp,
      { pid, metadata: { release } }
    );
  }

  /**
   * Evaluates the Resource Allocation Graph (RAG) and finds cycles
   */
  public getDeadlockState(): DeadlockState {
    const safety = this.checkSafety();
    const cycleEdges: [string, string][] = [];

    // Construct adjacency list
    // Nodes: 'P_<pid>' and 'R_<resIndex>'
    const adj = new Map<string, string[]>();

    const addEdge = (u: string, v: string) => {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u)!.push(v);
    };

    // Assignment edges: Resource -> Process
    for (const [pid, alloc] of this.allocationMap.entries()) {
      for (let r = 0; r < alloc.length; r++) {
        if (alloc[r] > 0) {
          addEdge(`R_${r}`, `P_${pid}`);
        }
      }
    }

    // Request edges: Process -> Resource
    for (const [pid, req] of this.requestMap.entries()) {
      for (let r = 0; r < req.length; r++) {
        if (req[r] > 0) {
          addEdge(`P_${pid}`, `R_${r}`);
        }
      }
    }

    // Cycle detection using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const deadlockedPids: number[] = [];

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          if (dfs(next, [...path, node])) return true;
        } else if (recStack.has(next)) {
          // Cycle found!
          cycleEdges.push([node, next]);
          for (const item of [...path, node, next]) {
            if (item.startsWith('P_')) {
              const pid = parseInt(item.replace('P_', ''), 10);
              if (!deadlockedPids.includes(pid)) deadlockedPids.push(pid);
            }
          }
          return true;
        }
      }

      recStack.delete(node);
      return false;
    }

    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return {
      isDeadlocked: !safety.isSafe || deadlockedPids.length > 0,
      deadlockedPids,
      safeSequence: safety.safeSequence,
      hasCycle: cycleEdges.length > 0,
      cycleEdges,
    };
  }

  /**
   * Injects a controlled classic circular wait deadlock
   * (e.g. Dining Philosophers / 2-process circular lock)
   */
  public injectClassicDeadlock(pid1: number = 10, pid2: number = 11): void {
    // R0 (GPU) and R1 (Disk)
    this.registerProcess(pid1, [1, 1, 0, 0]);
    this.registerProcess(pid2, [1, 1, 0, 0]);

    // P1 holds R0
    this.resources[0].availableInstances -= 1;
    this.allocationMap.get(pid1)![0] = 1;

    // P2 holds R1
    this.resources[1].availableInstances -= 1;
    this.allocationMap.get(pid2)![1] = 1;

    // P1 requests R1 (held by P2)
    this.requestMap.get(pid1)![1] = 1;

    // P2 requests R0 (held by P1)
    this.requestMap.get(pid2)![0] = 1;

    this.eventBus?.emit(
      'DEADLOCK_DETECTED',
      'deadlock',
      'DeadlockDetector',
      `Circular Wait Deadlock Injected: PID ${pid1} <-> PID ${pid2} holding R0/R1`,
      0,
      {
        metadata: { pid1, pid2 },
        explanation: `Classic Coffman Deadlock: PID ${pid1} holds R0 and requests R1. PID ${pid2} holds R1 and requests R0. Both processes are blocked indefinitely in circular wait.`,
      }
    );
  }

  public reset(): void {
    this.initDefaultResources();
  }
}
