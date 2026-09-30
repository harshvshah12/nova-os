# NOVA OS — Simulation Engine Internals & Algorithms

This document provides technical documentation of the deterministic virtual computer engine powering NOVA OS.

---

## 1. Simulation Runtime & Virtual Clock

The logical simulation clock (`SimulationClock`) maintains an integer `currentTime` in milliseconds:
- Base tick resolution: `10ms` per logical cycle.
- The clock is completely decoupled from browser requestAnimationFrame or `Date.now()`.
- Supports pausing, resumption, single-tick stepping, and speed multipliers from `0.1x` to `10.0x`.
- Every subsystem updates deterministically on clock tick events.

---

## 2. Process Control Block (PCB) & State Machine

Each simulated process maintains a complete PCB:
- **States**:
  - `NEW`: Process allocated, not yet in ready queue.
  - `READY`: Ready to run on an available CPU core.
  - `RUNNING`: Actively executing instructions on a CPU core.
  - `BLOCKED`: Blocked waiting for disk I/O, sleep timer, or synchronization.
  - `SUSPENDED`: Paused via `SIGSTOP`.
  - `TERMINATED`: Finished execution; memory and resources reclaimed.
- **Instruction Execution Pipeline**:
  - Discrete instruction types: `CPU`, `MEMORY_READ`, `MEMORY_WRITE`, `IO_REQUEST`, `WAIT`, `SYSCALL`, `EXIT`.
  - Instruction cycles remaining decrements with each clock tick.

---

## 3. CPU Scheduling Algorithms

The scheduler supports 7 distinct algorithms:
1. **Round Robin (RR)**: Preemptive time quantum (10ms - 80ms). Tracks `lastReadyTime` to ensure newly preempted processes go to the back of the FIFO queue.
2. **First-Come, First-Served (FCFS)**: Non-preemptive queue ordered strictly by arrival into the Ready state.
3. **Shortest Job First (SJF)**: Greedy selection based on remaining instruction burst cycles.
4. **Shortest Remaining Time First (SRTF)**: Preemptive variant of SJF that preempts the running process if a newly arrived process has a shorter remaining burst.
5. **Priority Scheduling**: Processes have numeric priority (0-139, lower = higher priority). Includes dynamic aging to eliminate process starvation.
6. **Multilevel Queue (MLQ)**: Distinct queues for System, Interactive, and Batch processes.
7. **Multilevel Feedback Queue (MLFQ)**: Adaptive demographic queues where CPU-bound processes are demoted upon quantum expiration and periodically boosted.

---

## 4. Virtual Memory, Paging & Page Fault Traps

- **Address Translation**: Virtual Address -> (Page Number, Offset).
- **Translation Lookaside Buffer (TLB)**: 16-entry high-speed hardware cache.
- **Page Fault Trap Mechanism**:
  1. Virtual address accessed with `isPresent = false`.
  2. CPU raises Interrupt `0x0E`.
  3. Memory Manager searches for a free physical frame.
  4. If all 64 frames are occupied, victim frame is selected using `LRU`, `FIFO`, or `OPTIMAL`.
  5. Old page table entry invalidated; if dirty, contents swapped out.
  6. New frame assigned to requesting process, page table updated (`isPresent = true`), TLB updated.

---

## 5. Disk Scheduling Algorithms

The virtual disk models a physical magnetic platter with 200 tracks (0 to 199 cylinders):
- **FCFS**: First-Come First-Served.
- **SSTF**: Shortest Seek Time First based on cylinder distance to current head position.
- **SCAN**: Elevator algorithm sweeping across cylinders in one direction, reversing at boundary.
- **LOOK**: Reverses direction at the furthest pending request instead of travelling to boundary track 0 or 199.
- **C-SCAN & C-LOOK**: Circular sweeps that only service requests in one direction and jump back to the start.

---

## 6. Deadlock Detection & Banker's Algorithm

- **Resource Allocation Graph (RAG)**: Bipartite directed graph between Processes and Resources.
- **Cycle Detection**: Depth-First Search with recursion stack tracking identifying circular dependencies.
- **Banker's Safety Algorithm**:
  - `Need[i][j] = Max[i][j] - Allocation[i][j]`
  - Computes whether there exists a safe sequence of process executions such that all processes can terminate without deadlock.
  - Unsafe requests are rejected to maintain system safety.
