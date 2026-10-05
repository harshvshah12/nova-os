// ============================================================================
// NOVA OS — COMPLETE SIMULATION TYPE DEFINITIONS
// Deterministic virtual computer & operating system data models
// ============================================================================

export type SimulationTime = number; // in simulated milliseconds
export type ClockSpeed = 0.1 | 0.25 | 0.5 | 1.0 | 2.0 | 5.0 | 10.0;
export type ProcessPriority = number;
export type OperatingMode = 'NORMAL' | 'LEARNING' | 'DEBUG';

// ----------------------------------------------------------------------------
// Events & Event Bus
// ----------------------------------------------------------------------------
export type EventCategory =
  | 'kernel'
  | 'cpu'
  | 'process'
  | 'scheduler'
  | 'memory'
  | 'disk'
  | 'filesystem'
  | 'network'
  | 'security'
  | 'deadlock'
  | 'service';

export type EventType =
  // Lifecycle
  | 'SYSTEM_BOOT'
  | 'KERNEL_INIT'
  | 'SYSTEM_SHUTDOWN'
  // Process Lifecycle
  | 'PROCESS_CREATE'
  | 'PROCESS_READY'
  | 'PROCESS_RUNNING'
  | 'PROCESS_BLOCK'
  | 'PROCESS_WAKE'
  | 'CONTEXT_SWITCH'
  | 'PROCESS_SUSPEND'
  | 'PROCESS_RESUME'
  | 'PROCESS_TERMINATE'
  | 'PROCESS_ZOMBIE'
  // CPU & Interrupts
  | 'CPU_TICK'
  | 'TIMER_INTERRUPT'
  | 'HARDWARE_INTERRUPT'
  | 'SYSTEM_CALL'
  // Memory Management
  | 'MEMORY_ALLOCATE'
  | 'MEMORY_FREE'
  | 'PAGE_FAULT'
  | 'PAGE_LOAD'
  | 'PAGE_EVICT'
  | 'SWAP_OUT'
  | 'SWAP_IN'
  | 'TLB_HIT'
  | 'TLB_MISS'
  // Storage & Disk
  | 'DISK_REQUEST'
  | 'DISK_SEEK'
  | 'DISK_COMPLETE'
  | 'IO_REQUEST'
  | 'IO_COMPLETE'
  // Signals & IPC
  | 'SIGNAL_SENT'
  | 'SIGNAL_RECEIVED'
  | 'PIPE_WRITE'
  | 'PIPE_READ'
  // Virtual Filesystem
  | 'FILE_CREATE'
  | 'FILE_DELETE'
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'PERMISSION_DENIED'
  // Network Stack
  | 'NETWORK_PACKET_SEND'
  | 'NETWORK_PACKET_RECEIVE'
  | 'SOCKET_OPEN'
  | 'SOCKET_CLOSE'
  // Concurrency & Deadlocks
  | 'RESOURCE_REQUEST'
  | 'RESOURCE_RELEASE'
  | 'DEADLOCK_DETECTED'
  | 'DEADLOCK_RESOLVED'
  // Services
  | 'SERVICE_START'
  | 'SERVICE_STOP';

export interface KernelEvent {
  id: string;
  timestamp: SimulationTime;
  type: EventType;
  category: EventCategory;
  source: string;
  target?: string;
  pid?: number;
  coreId?: number;
  message: string;
  explanation?: string; // Academic explanation for Learning Mode
  metadata?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// Virtual Hardware
// ----------------------------------------------------------------------------
export interface HardwareConfig {
  cores: number; // 1, 2, 4, 8
  coreFrequencyMhz: number; // e.g. 2400
  ramTotalMb: number; // 512, 1024, 2048, 4096, 8192
  pageSizeKb: number; // default 4KB
  diskSizeGb: number; // 5, 10, 20, 50
  networkInterface: string; // 'eth0'
  ipAddress: string; // e.g. '192.168.1.10'
  macAddress: string; // e.g. '02:00:00:A1:B2:C3'
  gateway: string; // e.g. '192.168.1.1'
}

export type CpuCoreState = 'IDLE' | 'RUNNING' | 'INTERRUPTED' | 'WAITING';

export interface CpuRegisters {
  rax: number;
  rbx: number;
  rcx: number;
  rdx: number;
  rsi: number;
  rdi: number;
  rbp: number;
  rsp: number;
  rip: number; // Program counter
  flags: number;
}

export interface CpuCore {
  id: number;
  state: CpuCoreState;
  currentPid: number | null;
  registers: CpuRegisters;
  currentInstruction: Instruction | null;
  utilization: number; // 0 - 100 percentage
  instructionsExecuted: number;
  ticksSinceLastSwitch: number;
}

// ----------------------------------------------------------------------------
// Instructions & Workloads
// ----------------------------------------------------------------------------
export type InstructionType =
  | 'CPU'
  | 'MEMORY_READ'
  | 'MEMORY_WRITE'
  | 'IO_REQUEST'
  | 'WAIT'
  | 'YIELD'
  | 'SYSCALL'
  | 'EXIT';

export interface Instruction {
  type: InstructionType;
  cycles: number; // total cycles needed
  cyclesRemaining: number;
  address?: number; // for memory read/write (virtual address)
  ioTrack?: number; // for disk I/O track
  syscallName?: string;
  description?: string;
}

export type WorkloadType =
  | 'CPU_BOUND'
  | 'IO_BOUND'
  | 'MEMORY_INTENSIVE'
  | 'MIXED';

// ----------------------------------------------------------------------------
// Process & PCB
// ----------------------------------------------------------------------------
export type ProcessState =
  | 'NEW'
  | 'READY'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'ZOMBIE';

export interface ProcessOpenFile {
  fd: number;
  path: string;
  mode: 'r' | 'w' | 'rw';
  cursor: number;
}

export interface PCB {
  pid: number;
  ppid: number;
  uid: number;
  gid: number;
  name: string;
  command: string;
  state: ProcessState;
  priority: number; // 0 - 139 (lower = higher priority)
  nice: number; // -20 to +19
  dynamicPriority: number; // for aging / MLFQ
  cpuTime: number; // total simulated time running on CPU
  memoryUsageBytes: number;
  programCounter: number;
  registers: CpuRegisters;
  instructions: Instruction[];
  parentPid: number | null;
  childrenPids: number[];
  openFiles: ProcessOpenFile[];
  pendingSignals: number[];
  creationTime: SimulationTime;
  firstScheduledTime: SimulationTime | null;
  lastReadyTime: SimulationTime;
  waitingTime: SimulationTime;
  turnaroundTime: SimulationTime;
  responseTime: SimulationTime;
  completionTime: SimulationTime | null;
  exitCode: number | null;
  allocatedFrames: number[];
  virtualPages: number[];
  blockedReason?: string;
  blockedUntil?: SimulationTime;
  workloadType: WorkloadType;
  color: string;
}

// ----------------------------------------------------------------------------
// CPU Scheduling
// ----------------------------------------------------------------------------
export type SchedulerAlgorithm =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'RR'
  | 'PRIORITY'
  | 'MLQ'
  | 'MLFQ';

export interface GanttSlice {
  pid: number;
  processName: string;
  coreId: number;
  startTime: SimulationTime;
  endTime: SimulationTime;
  color: string;
}

export interface MlfqQueueConfig {
  level: number;
  quantum: number; // in ms
  priority: number;
}

export interface SchedulerConfig {
  algorithm: SchedulerAlgorithm;
  timeQuantum: number; // in ms
  preemptive: boolean;
  agingInterval: number; // in ticks
  mlfqQueues: MlfqQueueConfig[];
}

export interface SchedulerMetrics {
  totalContextSwitches: number;
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number; // processes completed per simulated minute
}

// ----------------------------------------------------------------------------
// Virtual Memory & Paging
// ----------------------------------------------------------------------------
export type PageReplacementAlgorithm = 'FIFO' | 'LRU' | 'OPTIMAL';
export type AllocationStrategy = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT';

export interface MemoryFrame {
  frameNumber: number;
  isFree: boolean;
  allocatedPid: number | null;
  pageNumber: number | null;
  allocatedAt: SimulationTime;
  lastAccessedAt: SimulationTime;
  isDirty: boolean;
  referenceBit: boolean;
}

export interface PageTableEntry {
  pageNumber: number;
  frameNumber: number | null;
  isPresent: boolean;
  isModified: boolean;
  isReferenced: boolean;
  protection: 'READ_ONLY' | 'READ_WRITE' | 'EXECUTE';
  swapBlockId?: number | null;
}

export interface TlbEntry {
  pid: number;
  pageNumber: number;
  frameNumber: number;
  lastUsed: SimulationTime;
}

export interface MemoryMetrics {
  totalFrames: number;
  usedFrames: number;
  freeFrames: number;
  totalPageFaults: number;
  tlbHits: number;
  tlbMisses: number;
  pageReplacements: number;
  pageSizeBytes: number;
  totalSwapSlots: number;
  usedSwapSlots: number;
  swapIns: number;
  swapOuts: number;
}

// ----------------------------------------------------------------------------
// Virtual Disk & Storage
// ----------------------------------------------------------------------------
export type DiskSchedulingAlgorithm =
  | 'FCFS'
  | 'SSTF'
  | 'SCAN'
  | 'C-SCAN'
  | 'LOOK'
  | 'C-LOOK';

export interface DiskRequest {
  id: string;
  track: number; // cylinder/track 0 - 199
  sector: number; // sector 0 - 31
  pid: number;
  type: 'READ' | 'WRITE';
  timestamp: SimulationTime;
  completed: boolean;
}

export interface DiskState {
  totalTracks: number;
  currentTrack: number;
  headDirection: 'UP' | 'DOWN';
  pendingRequests: DiskRequest[];
  completedRequests: DiskRequest[];
  totalHeadMovements: number;
  algorithm: DiskSchedulingAlgorithm;
}

// ----------------------------------------------------------------------------
// Virtual File System (VFS)
// ----------------------------------------------------------------------------
export type FileType = 'FILE' | 'DIRECTORY' | 'DEVICE' | 'PIPE';

export interface FilePermissions {
  readOwner: boolean;
  writeOwner: boolean;
  execOwner: boolean;
  readGroup: boolean;
  writeGroup: boolean;
  execGroup: boolean;
  readOther: boolean;
  writeOther: boolean;
  execOther: boolean;
}

export interface Inode {
  id: number;
  type: FileType;
  size: number;
  permissions: FilePermissions;
  uid: number;
  gid: number;
  createdAt: SimulationTime;
  modifiedAt: SimulationTime;
  content: string;
  blocks: number[];
  deviceHandler?: string; // e.g. 'null', 'zero', 'random', 'cpuinfo'
}

export interface VfsEntry {
  name: string;
  inodeId: number;
}

// ----------------------------------------------------------------------------
// Concurrency & Deadlocks (Banker's Algorithm & RAG)
// ----------------------------------------------------------------------------
export interface ResourceType {
  id: string;
  name: string;
  totalInstances: number;
  availableInstances: number;
  color: string;
}

export interface DeadlockState {
  isDeadlocked: boolean;
  deadlockedPids: number[];
  safeSequence: number[];
  hasCycle: boolean;
  cycleEdges: [string, string][]; // [fromNode, toNode]
}

// ----------------------------------------------------------------------------
// Network Stack
// ----------------------------------------------------------------------------
export type PacketProtocol = 'ICMP' | 'TCP' | 'UDP' | 'ARP';

export interface NetworkPacket {
  id: string;
  protocol: PacketProtocol;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  payload: string;
  timestamp: SimulationTime;
  status: 'QUEUED' | 'TRANSMITTING' | 'DELIVERED' | 'DROPPED';
  ttl: number;
  latencyMs: number;
}

export interface NetworkState {
  interfaceName: string;
  ip: string;
  netmask: string;
  gateway: string;
  mac: string;
  txPackets: number;
  rxPackets: number;
  txBytes: number;
  rxBytes: number;
  activeSockets: { id: string; protocol: string; localPort: number; remoteIp: string; remotePort: number; state: string }[];
  packetLog: NetworkPacket[];
}

// ----------------------------------------------------------------------------
// Security, Users & Groups
// ----------------------------------------------------------------------------
export interface User {
  uid: number;
  username: string;
  gid: number;
  homeDir: string;
  shell: string;
  isRoot: boolean;
}

export interface Group {
  gid: number;
  name: string;
  memberUids: number[];
}

// ----------------------------------------------------------------------------
// System Services (Daemons)
// ----------------------------------------------------------------------------
export interface SystemService {
  name: string;
  description: string;
  pid: number | null;
  state: 'RUNNING' | 'STOPPED' | 'FAILED';
  autoStart: boolean;
}

// ----------------------------------------------------------------------------
// UI Window & Desktop
// ----------------------------------------------------------------------------
export type AppId =
  | 'terminal'
  | 'system-monitor'
  | 'process-manager'
  | 'memory-analyzer'
  | 'scheduler-visualizer'
  | 'file-manager'
  | 'disk-analyzer'
  | 'network-monitor'
  | 'text-editor'
  | 'calculator'
  | 'settings'
  | 'package-manager'
  | 'deadlock-lab'
  | 'event-timeline'
  | 'os-scenarios'
  | 'project-hub'
  | 'sync-lab';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  associatedPid?: number;
  customData?: any;
}
