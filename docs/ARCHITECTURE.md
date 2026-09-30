# NOVA OS — Architectural Specification & Systems Design

## 1. System Overview & Philosophy

**NOVA OS** is a fully deterministic, self-contained virtual computer and operating system simulation. It is designed to model real operating system principles — process scheduling, virtual memory management, paged address spaces, page faults, disk scheduling, hierarchical virtual file systems with permission enforcement, inter-process communication, system calls, signals, and concurrency deadlocks.

### 1.1 Strict Three-Tier Separation
```
+-------------------------------------------------------------------------+
|                         NOVA OS USER SPACE                              |
|  Shell (Bash-like), Terminal, GUI Apps, Daemons, User Processes         |
+-------------------------------------------------------------------------+
                                    |  System Calls (trap / syscall)
                                    v
+-------------------------------------------------------------------------+
|                         NOVA OS KERNEL CORE                             |
|  Process Manager, Scheduler (RR/SJF/MLFQ), Memory Manager (Paging),     |
|  VFS & Inodes, Disk Controller, Network Stack, Signal & IPC Subsystem   |
+-------------------------------------------------------------------------+
                                    |  Simulated Hardware Control
                                    v
+-------------------------------------------------------------------------+
|                      NOVA OS VIRTUAL HARDWARE                           |
|  Virtual Multi-Core CPU, Physical RAM Frames, Virtual Cylinder Disk,   |
|  Virtual Network Interface (eth0), Interrupt Controller, Virtual Clock  |
+-------------------------------------------------------------------------+
                                    |  Pure Application Host
                                    v
+-------------------------------------------------------------------------+
|                  HOST ENVIRONMENT (Browser / Web Runtime)               |
|  Vite, React 19, TypeScript, Canvas / SVG Renderer, Zustand Store       |
+-------------------------------------------------------------------------+
```

No UI element displays synthetic placeholder data. If the UI indicates that a core is at 75% utilization, it is because 3 out of 4 virtual cycles executed active process instructions. If a page fault is rendered, an address translation miss occurred in the virtual page table and initiated a simulated frame allocation and disk block read.

---

## 2. Deterministic Virtual Clock & Event Runtime

NOVA OS decouples logical simulation time (`simulationTime`, in integer milliseconds) from real wall-clock time.
- **Clock Step**: Virtual time advances in discrete quanta (default `10ms` per tick).
- **Execution Speeds**:
  - `0.1x` (Ultra slow for instruction-level inspection)
  - `0.25x`, `0.5x` (Educational observation)
  - `1.0x` (Real-time baseline)
  - `2.0x`, `5.0x`, `10.0x` (Accelerated simulation)
  - `Step Mode` (Single tick or single event stepping)
- **Central Event Queue**: High-priority timer interrupts, I/O completions, and syscall returns are queued deterministically with timestamps.

---

## 3. Subsystem Breakdown

### 3.1 Virtual Hardware
- **CPU**: Configurable 1 to 8 virtual cores. Each core has private registers (`rax`, `rbx`, `rcx`, `rdx`, `rsi`, `rdi`, `rbp`, `rsp`, `rip`, `flags`), execution pipeline, and cycle utilization tracking.
- **Physical RAM**: Divided into fixed-size physical frames (e.g. 4KB pages; configurable 512MB to 8192MB total virtual RAM).
- **Virtual Disk**: 200 concentric tracks/cylinders with 32 sectors per track, movable magnetic head assembly, and head position telemetry.
- **Network Interface**: Virtual `eth0` with MAC address, IP (`192.168.1.10`), gateway, packet queues, and transmission latency.

### 3.2 Process Management & Instruction Model
Processes are represented by a complete Process Control Block (`PCB`):
- States: `NEW`, `READY`, `RUNNING`, `BLOCKED`, `SUSPENDED`, `TERMINATED`, `ZOMBIE`.
- Instruction Stream: Real discrete instructions (`CPU`, `MEMORY_READ`, `MEMORY_WRITE`, `IO_REQUEST`, `WAIT`, `YIELD`, `SYSCALL`, `EXIT`).
- Workload Profiles:
  - `CPU_BOUND`: Compute-dense instructions.
  - `IO_BOUND`: Frequent simulated disk and terminal operations.
  - `MEMORY_INTENSIVE`: Random address space accesses prompting page allocations and evictions.
  - `MIXED`: Realistic general-purpose workload.

### 3.3 CPU Scheduler
Multiple selectable and benchmarkable algorithms:
1. **First-Come, First-Served (FCFS)**: Non-preemptive FIFO queue.
2. **Shortest Job First (SJF)**: Greedy non-preemptive burst selection.
3. **Shortest Remaining Time First (SRTF)**: Preemptive SJF with arrival preemption.
4. **Round Robin (RR)**: Preemptive time-slice quantum (configurable 10ms - 100ms).
5. **Priority Scheduling**: Preemptive/non-preemptive with dynamic priority aging to prevent starvation.
6. **Multilevel Queue (MLQ)**: Distinct system, interactive, and batch queues.
7. **Multilevel Feedback Queue (MLFQ)**: Adaptive demographic queues with demotion on quantum exhaustion and periodic priority boosts.

### 3.4 Virtual Memory & Paging System
- **Two-Level Virtual Address Space**: Virtual pages mapped to physical frames via per-process Page Tables.
- **Translation Lookaside Buffer (TLB)**: Fast hardware cache simulation with hit/miss ratio telemetry.
- **Page Fault Trap**: Accessing an unmapped or evicted page triggers:
  1. Interrupt vector `0x0E` (Page Fault Exception).
  2. CPU core saves context and blocks process into `BLOCKED` state.
  3. Memory manager selects free frame or runs replacement algorithm.
  4. Disk read request issued for swapped page.
  5. On I/O complete, page table updated (`isPresent = true`) and process moved to `READY`.
- **Page Replacement**:
  - `FIFO`: First-In, First-Out queue of loaded frames.
  - `LRU`: Least Recently Used based on timestamp access telemetry.
  - `OPTIMAL`: Belady's optimal theoretical algorithm looking ahead into future instruction streams.

### 3.5 Virtual File System (VFS)
- Complete Linux directory hierarchy: `/bin`, `/boot`, `/dev`, `/etc`, `/home/nova`, `/lib`, `/proc`, `/tmp`, `/usr/bin`, `/var/log`.
- Inode table tracking permissions (`rwxr-xr--`), UID, GID, timestamps, and block maps.
- Dynamic `/proc` filesystem dynamically generating content on read:
  - `/proc/cpuinfo`, `/proc/meminfo`, `/proc/processes`, `/proc/uptime`, `/proc/scheduler`.
- Device files: `/dev/null`, `/dev/zero`, `/dev/random`.

### 3.6 Disk Scheduler
Simulates physical head movement across cylinders:
- `FCFS`: First-Come First-Served.
- `SSTF`: Shortest Seek Time First.
- `SCAN`: Elevator algorithm sweeping up to the boundary then down.
- `C-SCAN`: Circular SCAN sweeping in one direction and resetting.
- `LOOK` / `C-LOOK`: Optimized variants reversing direction at the last pending request.

### 3.7 Concurrency & Deadlock Engine
- **Resource Allocation Graph (RAG)**: Visualizes processes (circles) and resources (rectangles) with assignment and request edges.
- **Cycle Detection**: Tarjan's / DFS cycle detection identifying deadlocked sets.
- **Banker's Algorithm**: Evaluates allocation, maximum claim, and available resource vectors to compute safe sequences or reject unsafe requests.

---

## 4. User Space & Desktop Applications

NOVA OS features an authentic desktop window manager and suite of utility applications:
1. **Terminal**: Full shell supporting piping (`|`), file redirection (`>`, `>>`), command history, signals (`kill`), and standard GNU/Linux commands.
2. **System Monitor**: Real-time graphs for multi-core CPU load, memory breakdown, swap usage, and disk throughput.
3. **Process Manager**: Live process table, interactive kill/suspend, nice value adjustment, and process tree hierarchy.
4. **Memory Analyzer**: Physical RAM frame grid, virtual-to-physical address translation viewer, and TLB telemetry.
5. **Scheduler Visualizer**: Real-time ready/waiting queues, live scrolling Gantt chart, and algorithm comparison workbench.
6. **Disk Analyzer**: Animated disk platter and actuator arm, queue visualizer, and total head distance benchmarks.
7. **Network Monitor**: Virtual packet capture log, ping latency simulation, and network socket table.
8. **File Manager**: Interactive graphical filesystem tree navigation with file preview and permission inspector.
9. **Deadlock & Banker's Lab**: Interactive resource contention testbed with live cycle detection and safe-state verification.
10. **Package Manager (`pkg`)**: Simulated repository search, dependency resolution, installation, and removal.
11. **Settings**: Virtual hardware reconfiguration, scheduler parameter tuning, and theme customization.
12. **OS Scenarios**: One-click educational demonstrations (CPU scheduling race, thrashing under heavy memory load, deadlock trap, elevator sweep).
