// ============================================================================
// NOVA OS — VIRTUAL FILE SYSTEM (VFS)
// Inodes, Linux hierarchy, permissions, and dynamic /proc generation
// ============================================================================

import type {
  Inode,
  FileType,
  FilePermissions,
  SimulationTime,
  User,
} from '../types';
import type { EventBus } from '../runtime/EventBus';
import { prng } from '../runtime/Random';
import { PORTFOLIO_PROJECTS } from '../projects/ProjectsData';

export interface VfsNode {
  name: string;
  inodeId: number;
  children: Map<string, VfsNode>;
}

export function parseNumericPermissions(octal: number | string): FilePermissions {
  const str = String(octal).padStart(3, '0').slice(-3);
  const o = parseInt(str[0], 10);
  const g = parseInt(str[1], 10);
  const w = parseInt(str[2], 10);

  return {
    readOwner: (o & 4) !== 0,
    writeOwner: (o & 2) !== 0,
    execOwner: (o & 1) !== 0,
    readGroup: (g & 4) !== 0,
    writeGroup: (g & 2) !== 0,
    execGroup: (g & 1) !== 0,
    readOther: (w & 4) !== 0,
    writeOther: (w & 2) !== 0,
    execOther: (w & 1) !== 0,
  };
}

export function formatPermissionsString(
  type: FileType,
  p: FilePermissions
): string {
  const prefix = type === 'DIRECTORY' ? 'd' : type === 'DEVICE' ? 'c' : '-';
  const rOwner = p.readOwner ? 'r' : '-';
  const wOwner = p.writeOwner ? 'w' : '-';
  const xOwner = p.execOwner ? 'x' : '-';
  const rGroup = p.readGroup ? 'r' : '-';
  const wGroup = p.writeGroup ? 'w' : '-';
  const xGroup = p.execGroup ? 'x' : '-';
  const rOther = p.readOther ? 'r' : '-';
  const wOther = p.writeOther ? 'w' : '-';
  const xOther = p.execOther ? 'x' : '-';

  return `${prefix}${rOwner}${wOwner}${xOwner}${rGroup}${wGroup}${xGroup}${rOther}${wOther}${xOther}`;
}

export class VirtualFileSystem {
  private inodes: Map<number, Inode> = new Map();
  private rootNode: VfsNode;
  private nextInodeId: number = 1;
  private eventBus?: EventBus;

  // Dynamic /proc handlers (path -> generator function)
  private procHandlers: Map<string, () => string> = new Map();

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.rootNode = {
      name: '',
      inodeId: 0,
      children: new Map(),
    };
    this.initFileSystem();
  }

  public registerProcHandler(filename: string, generator: () => string): void {
    this.procHandlers.set(filename, generator);
  }

  public initFileSystem(): void {
    this.inodes.clear();
    this.nextInodeId = 1;

    // Create root inode (Inode 1)
    const rootInode = this.createInodeRecord(
      'DIRECTORY',
      parseNumericPermissions(755),
      0, // root
      0,
      0,
      ''
    );
    this.rootNode = {
      name: '',
      inodeId: rootInode.id,
      children: new Map(),
    };

    // Standard Linux structure
    this.mkdir('/bin', 755, 0, 0);
    this.mkdir('/boot', 755, 0, 0);
    this.mkdir('/dev', 755, 0, 0);
    this.mkdir('/etc', 755, 0, 0);
    this.mkdir('/home', 755, 0, 0);
    this.mkdir('/home/nova', 750, 1000, 1000);
    this.mkdir('/home/nova/Desktop', 755, 1000, 1000);
    this.mkdir('/home/nova/Documents', 755, 1000, 1000);
    this.mkdir('/home/nova/Downloads', 755, 1000, 1000);
    this.mkdir('/home/nova/Music', 755, 1000, 1000);
    this.mkdir('/home/nova/Pictures', 755, 1000, 1000);
    this.mkdir('/home/nova/Videos', 755, 1000, 1000);
    this.mkdir('/home/nova/Templates', 755, 1000, 1000);
    this.mkdir('/home/nova/Workspace', 755, 1000, 1000);
    this.mkdir('/home/nova/.Trash', 700, 1000, 1000);
    this.mkdir('/home/guest', 750, 1001, 1001);
    this.mkdir('/lib', 755, 0, 0);
    this.mkdir('/mnt', 755, 0, 0);
    this.mkdir('/mnt/usb', 777, 0, 0);
    this.mkdir('/proc', 555, 0, 0);
    this.mkdir('/tmp', 777, 0, 0);
    this.mkdir('/usr', 755, 0, 0);
    this.mkdir('/usr/bin', 755, 0, 0);
    this.mkdir('/var', 755, 0, 0);
    this.mkdir('/var/log', 755, 0, 0);

    // Initial files in /etc
    this.writeFile(
      '/etc/os-release',
      `NAME="NOVA OS"\nVERSION="2.4.0 LTS"\nID=nova\nPRETTY_NAME="NOVA OS (Virtual Systems Architecture)"\nKERNEL="0.1.0-simulated-x86_64"\nHOME_URL="https://github.com/harshvshah12/nova-os"`,
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/hostname',
      'nova-system\n',
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/hosts',
      `127.0.0.1   localhost localhost.localdomain\n192.168.1.10 nova-system nova\n192.168.1.1  gateway.local\n`,
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/resolv.conf',
      `nameserver 1.1.1.1\nnameserver 8.8.8.8\noptions edns0\n`,
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/fstab',
      `# /etc/fstab: static file system information\n# <file system> <mount point>   <type>  <options>       <dump>  <pass>\n/dev/vda1       /               ext4    errors=remount-ro 0       1\n/dev/vda2       none            swap    sw              0       0\n/dev/vdb1       /mnt/usb        vfat    noauto,user,rw  0       0\n`,
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/group',
      `root:x:0:\nbin:x:1:\ndaemon:x:2:\nsys:x:3:\nadm:x:4:\nwheel:x:10:root,nova\nnova:x:1000:\nguest:x:1001:\n`,
      0,
      0,
      644
    );

    this.writeFile(
      '/etc/passwd',
      `root:x:0:0:root:/root:/bin/bash\nnova:x:1000:1000:Nova User:/home/nova:/bin/bash\nguest:x:1001:1001:Guest User:/home/guest:/bin/bash\n`,
      0,
      0,
      644
    );

    // Initial files in /home/nova/Desktop
    this.writeFile(
      '/home/nova/Desktop/Welcome.txt',
      `Welcome to NOVA OS Desktop Environment!\nDouble-click any file to open it in its default associated application:\n- Text files -> Text Editor\n- Images -> Image Viewer\n- Documents -> Document Viewer\n- Audio -> Media Player\n- Web links -> NOVA Browser\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Desktop/Harsh_Portfolio.url',
      `https://github.com/harshvshah12/nova-os\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Documents
    this.writeFile(
      '/home/nova/Documents/welcome.txt',
      `=======================================================\nWELCOME TO NOVA OS\nA Full-Scale Virtual Operating System Simulation\n=======================================================\n\nFeatures:\n- Deterministic Multi-Core CPU & Event Clock\n- Real CPU Schedulers: RR, FCFS, SJF, SRTF, Priority, MLFQ\n- 4KB Paged Virtual Memory (524,288 Physical Frames for 2048 MB)\n- MMU Address Translation & 8-Stage Page Fault Pipeline\n- Elevator Disk Platter Seek Scheduler (SCAN, LOOK, SSTF)\n- Authentic Linux VFS with Unix permissions and dynamic /proc\n- Concurrency Deadlock Detection & Banker's Algorithm\n- Integrated NOVA Browser with network packet simulation\n\nTry running 'help' or 'run' in the terminal!\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Documents/NOVA_OS_Guide.md',
      `# NOVA OS Comprehensive Architecture & User Manual

## 1. Virtual Hardware Specification
- **CPU**: 4 Cores @ 2400 MHz (Configurable 1 to 8 Cores)
- **RAM**: 2048 MB (524,288 Physical Frames x 4KB standard x86_64 paged memory)
- **Disk**: 20 GB Virtual Cylinder Disk (200 tracks, SCAN/LOOK/SSTF algorithms)
- **Network**: eth0 (192.168.1.10, Gateway 192.168.1.1)

## 2. Core Subsystems
- **CPU Scheduling**: Preemptive Round Robin (quantum 10 ticks), SJF, SRTF, MLFQ.
- **Virtual Memory & MMU**: 32-bit address space decomposed into 20-bit VPN and 12-bit offset. Hardware TLB cache (16 slots).
- **Concurrency**: Classical Dijkstra Counting Semaphores and Mutex locks.
- **Deadlock Prevention**: Edsger Dijkstra Banker's Algorithm and Tarjan's cycle detection.
`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Documents/system-notes.txt',
      `Meeting notes: Review scheduling quantum benchmarks. RR quantum of 10 ticks delivers optimal responsiveness without excessive context switch overhead.\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Documents/notes.txt',
      `Quick ideas for upcoming kernel enhancements:\n- Add shared memory IPC segment\n- Integrate dynamic packet filter table\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Downloads
    this.writeFile(
      '/home/nova/Downloads/dataset_sample.csv',
      `transaction_id,amount,merchant_category,is_fraud,latency_ms\nTX1001,42.50,dining,0,12\nTX1002,1250.00,electronics,1,45\nTX1003,15.20,grocery,0,8\nTX1004,890.00,travel,0,22\nTX1005,4200.00,crypto_transfer,1,38\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Downloads/kernel_patch_v1.0.tar.gz',
      `[SIMULATED BINARY ARCHIVE: NOVA Kernel Patch v1.0.4 - gzip compressed data]\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Pictures
    this.writeFile(
      '/home/nova/Pictures/nova_logo.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="45" fill="#0D1322" stroke="#38BDF8" stroke-width="4"/>
  <polygon points="50,20 75,70 25,70" fill="none" stroke="#34D399" stroke-width="4"/>
  <circle cx="50" cy="50" r="10" fill="#38BDF8"/>
</svg>`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Pictures/wallpaper_dark_obsidian.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <radialGradient id="grad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#0E3854" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#070A11" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad)"/>
  <circle cx="400" cy="300" r="180" fill="none" stroke="#38BDF8" stroke-opacity="0.15" stroke-dasharray="10 5"/>
</svg>`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Music
    this.writeFile(
      '/home/nova/Music/ambient_cyberpunk_synth.wav',
      `[SIMULATED WAV AUDIO FILE: Sample Rate 44.1kHz, Channels 2, Bits 16, Duration 03:24, Artist: Harsh Shah]\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Music/lofi_kernel_beats.mp3',
      `[SIMULATED MP3 AUDIO FILE: 320 kbps CBR, ID3v2 Track "Lofi Kernel Scheduling Beats", Album "NOVA OS Sessions"]\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Videos
    this.writeFile(
      '/home/nova/Videos/deepfake_detection_demo.mp4',
      `[SIMULATED MP4 VIDEO: Codec H.264/AAC, Resolution 1920x1080, Duration 01:15, Title: Dual-Domain ViT Detection Demo]\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/Templates
    this.writeFile(
      '/home/nova/Templates/c_program_template.c',
      `#include <stdio.h>\n#include <unistd.h>\n\nint main(int argc, char *argv[]) {\n    printf("Hello from NOVA OS process (PID: %d)\\n", getpid());\n    return 0;\n}\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Templates/bash_script_template.sh',
      `#!/bin/bash\n# NOVA OS Automation Script\necho "Running system diagnostics..."\ntop\ncat /proc/cpuinfo\n`,
      1000,
      1000,
      755
    );

    // Initial files in /home/nova/Workspace
    this.writeFile(
      '/home/nova/Workspace/hello_world.c',
      `#include <stdio.h>\n\nint main() {\n    printf("NOVA OS Virtual Computer online.\\n");\n    return 0;\n}\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/Workspace/scratch.txt',
      `Active tasks for the semester viva:\n1. Demonstrate 4KB paging and 8-stage page fault pipeline\n2. Show dining philosophers asymmetric vs greedy deadlock\n3. Launch verified external project from Project Hub\n`,
      1000,
      1000,
      644
    );

    // Initial files in /home/nova/.Trash (Supporting Trash & Recovery)
    this.writeFile(
      '/home/nova/.Trash/deprecated_config.bak',
      `# Deprecated configuration backup\nSCHEDULER_OLD="FCFS"\nRAM_FRAMES_OLD="64"\n`,
      1000,
      1000,
      600
    );

    this.writeFile(
      '/home/nova/.Trash/debug_trace.log',
      `[DEBUG TRACE] Early boot test log entry - safely marked for deletion.\n`,
      1000,
      1000,
      600
    );

    this.writeFile(
      '/home/nova/README.txt',
      `=======================================================\nWELCOME TO NOVA OS\nA Full-Scale Virtual Operating System Simulation\n=======================================================\n\nFeatures:\n- Deterministic Multi-Core CPU & Event Clock\n- Real CPU Schedulers: RR, FCFS, SJF, SRTF, Priority, MLFQ\n- Paged Virtual Memory with LRU / FIFO Frame Replacement\n- Elevator Disk Platter Seek Scheduler (SCAN, LOOK, SSTF)\n- Authentic Linux VFS with permissions and dynamic /proc\n- Concurrency Deadlock Detection & Banker's Algorithm\n\nTry running 'help' or 'run' in the terminal!\n`,
      1000,
      1000,
      644
    );

    this.writeFile(
      '/home/nova/demo.sh',
      `#!/bin/bash\necho "Running CPU burst simulation..."\nrun cpu-demo\necho "Inspecting memory state:"\ncat /proc/meminfo\n`,
      1000,
      1000,
      755
    );

    // Populate /home/nova/projects with Harsh's real project portfolio
    this.mkdir('/home/nova/projects', 755, 1000, 1000);
    for (const project of PORTFOLIO_PROJECTS) {
      const projDir = `/home/nova/projects/${project.slug}`;
      this.mkdir(projDir, 755, 1000, 1000);

      // Write code / markdown files
      for (const file of project.files) {
        this.writeFile(`${projDir}/${file.name}`, file.content, 1000, 1000, 644);
      }

      // Write meta.json
      const meta = {
        id: project.id,
        title: project.title,
        category: project.category,
        tagline: project.tagline,
        stack: project.stack,
        metrics: project.metrics,
        processName: project.processName,
        workloadType: project.workloadType,
        memoryMb: project.memoryMb,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        launchUrl: project.launchUrl,
        launchType: project.launchType,
      };
      this.writeFile(
        `${projDir}/meta.json`,
        JSON.stringify(meta, null, 2),
        1000,
        1000,
        644
      );
    }

    // System logs in /var/log
    this.writeFile(
      '/var/log/kernel.log',
      `[00:00.000] kernel: Initializing virtual hardware and CPU cores...\n[00:00.010] kernel: VFS mounted root filesystem (ext4-sim)\n[00:00.020] kernel: MMU 4KB paged virtual memory initialized (524,288 physical frames)\n[00:00.030] kernel: Preemptive scheduler active (RR quantum = 10 ticks)\n`,
      0,
      0,
      640
    );

    this.writeFile(
      '/var/log/system.log',
      `[00:00.040] systemd[1]: Starting system daemons (loggerd, networkd, schedulerd)...\n[00:00.050] systemd[1]: Reached target Graphical Interface.\n`,
      0,
      0,
      640
    );

    this.writeFile(
      '/var/log/auth.log',
      `[00:00.060] login[102]: User nova logged in on tty1 (UID 1000, GID 1000)\n`,
      0,
      0,
      600
    );

    this.writeFile(
      '/var/log/scheduler.log',
      `[00:00.070] sched: Algorithm initialized to Round Robin (RR)\n`,
      0,
      0,
      640
    );

    this.writeFile(
      '/var/log/memory.log',
      `[00:00.080] mmu: Hardware TLB cache enabled (16 slots, LRU replacement)\n`,
      0,
      0,
      640
    );

    this.writeFile(
      '/var/log/network.log',
      `[00:00.090] net: Virtual interface eth0 link UP (192.168.1.10/24)\n`,
      0,
      0,
      640
    );

    // Simulated device nodes in /dev
    this.createSpecialDevice('/dev/null', 'null');
    this.createSpecialDevice('/dev/zero', 'zero');
    this.createSpecialDevice('/dev/random', 'random');

    // Default dynamic /proc files
    this.createProcFile('cpuinfo');
    this.createProcFile('meminfo');
    this.createProcFile('processes');
    this.createProcFile('uptime');
    this.createProcFile('scheduler');
    this.createProcFile('version');
    this.createProcFile('net');
  }

  private createInodeRecord(
    type: FileType,
    permissions: FilePermissions,
    uid: number,
    gid: number,
    timestamp: SimulationTime,
    content: string = '',
    deviceHandler?: string
  ): Inode {
    const id = this.nextInodeId++;
    const inode: Inode = {
      id,
      type,
      size: content.length,
      permissions,
      uid,
      gid,
      createdAt: timestamp,
      modifiedAt: timestamp,
      content,
      blocks: [id],
      deviceHandler,
    };
    this.inodes.set(id, inode);
    return inode;
  }

  private createSpecialDevice(path: string, deviceHandler: string): void {
    const parsed = this.resolvePath(path);
    if (!parsed || !parsed.parent) return;

    const inode = this.createInodeRecord(
      'DEVICE',
      parseNumericPermissions(666),
      0,
      0,
      0,
      '',
      deviceHandler
    );

    parsed.parent.children.set(parsed.baseName, {
      name: parsed.baseName,
      inodeId: inode.id,
      children: new Map(),
    });
  }

  private createProcFile(name: string): void {
    const procDir = this.findNode('/proc');
    if (!procDir) return;

    const inode = this.createInodeRecord(
      'FILE',
      parseNumericPermissions(444),
      0,
      0,
      0,
      `[Dynamic /proc/${name}]`,
      name
    );

    procDir.children.set(name, {
      name,
      inodeId: inode.id,
      children: new Map(),
    });
  }

  public normalizePath(path: string, cwd: string = '/'): string {
    if (!path.startsWith('/')) {
      path = `${cwd === '/' ? '' : cwd}/${path}`;
    }

    const segments = path.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return `/${resolved.join('/')}`;
  }

  public findNode(path: string): VfsNode | null {
    const normalized = this.normalizePath(path);
    if (normalized === '/') return this.rootNode;

    const segments = normalized.split('/').filter(Boolean);
    let current: VfsNode = this.rootNode;

    for (const seg of segments) {
      const next = current.children.get(seg);
      if (!next) return null;
      current = next;
    }

    return current;
  }

  private resolvePath(
    path: string
  ): { parent: VfsNode | null; baseName: string; target: VfsNode | null } | null {
    const normalized = this.normalizePath(path);
    if (normalized === '/') {
      return { parent: null, baseName: '', target: this.rootNode };
    }

    const segments = normalized.split('/').filter(Boolean);
    const baseName = segments.pop()!;
    const parentPath = `/${segments.join('/')}`;
    const parent = this.findNode(parentPath);

    if (!parent) return null;

    const target = parent.children.get(baseName) || null;
    return { parent, baseName, target };
  }

  public getInode(inodeId: number): Inode | undefined {
    return this.inodes.get(inodeId);
  }

  public checkPermission(
    inode: Inode,
    user: { uid: number; gid: number; isRoot: boolean },
    mode: 'r' | 'w' | 'x'
  ): boolean {
    if (user.isRoot) return true; // root has full bypass

    const p = inode.permissions;
    if (user.uid === inode.uid) {
      // Owner
      if (mode === 'r') return p.readOwner;
      if (mode === 'w') return p.writeOwner;
      if (mode === 'x') return p.execOwner;
    } else if (user.gid === inode.gid) {
      // Group
      if (mode === 'r') return p.readGroup;
      if (mode === 'w') return p.writeGroup;
      if (mode === 'x') return p.execGroup;
    } else {
      // Other
      if (mode === 'r') return p.readOther;
      if (mode === 'w') return p.writeOther;
      if (mode === 'x') return p.execOther;
    }

    return false;
  }

  public mkdir(
    path: string,
    permissionsOctal: number = 755,
    uid: number = 0,
    gid: number = 0,
    timestamp: SimulationTime = 0
  ): boolean {
    const resolved = this.resolvePath(path);
    if (!resolved || !resolved.parent || resolved.target) {
      return false; // Parent doesn't exist or directory already exists
    }

    const inode = this.createInodeRecord(
      'DIRECTORY',
      parseNumericPermissions(permissionsOctal),
      uid,
      gid,
      timestamp,
      ''
    );

    resolved.parent.children.set(resolved.baseName, {
      name: resolved.baseName,
      inodeId: inode.id,
      children: new Map(),
    });

    return true;
  }

  public writeFile(
    path: string,
    content: string,
    uid: number = 0,
    gid: number = 0,
    permissionsOctal: number = 644,
    timestamp: SimulationTime = 0,
    append: boolean = false
  ): boolean {
    const resolved = this.resolvePath(path);
    if (!resolved || !resolved.parent) return false;

    if (resolved.target) {
      // File exists: update content
      const inode = this.inodes.get(resolved.target.inodeId);
      if (!inode || inode.type !== 'FILE') return false;

      inode.content = append ? inode.content + content : content;
      inode.size = inode.content.length;
      inode.modifiedAt = timestamp;
      return true;
    }

    // File doesn't exist: create new inode
    const inode = this.createInodeRecord(
      'FILE',
      parseNumericPermissions(permissionsOctal),
      uid,
      gid,
      timestamp,
      content
    );

    resolved.parent.children.set(resolved.baseName, {
      name: resolved.baseName,
      inodeId: inode.id,
      children: new Map(),
    });

    this.eventBus?.emit(
      'FILE_CREATE',
      'filesystem',
      'VFS',
      `File created: ${path} (${inode.size} bytes)`,
      timestamp,
      { metadata: { path, size: inode.size } }
    );

    return true;
  }

  public readFile(
    path: string,
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true }
  ): string | null {
    const node = this.findNode(path);
    if (!node) return null;

    const inode = this.inodes.get(node.inodeId);
    if (!inode) return null;

    if (!this.checkPermission(inode, user, 'r')) {
      this.eventBus?.emit(
        'PERMISSION_DENIED',
        'security',
        'VFS',
        `Permission denied: Read access denied on ${path} for UID ${user.uid}`,
        0,
        { metadata: { path, uid: user.uid } }
      );
      return null;
    }

    // Dynamic /proc handling
    if (path.startsWith('/proc/')) {
      const procKey = path.replace('/proc/', '');
      const handler = this.procHandlers.get(procKey);
      if (handler) {
        return handler();
      }
    }

    // Special device handling
    if (inode.type === 'DEVICE') {
      if (inode.deviceHandler === 'null') return '';
      if (inode.deviceHandler === 'zero') return '\0\0\0\0';
      if (inode.deviceHandler === 'random') return prng.nextString(16);
    }

    return inode.content;
  }

  public deleteFile(
    path: string,
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true },
    timestamp: SimulationTime = 0
  ): boolean {
    const resolved = this.resolvePath(path);
    if (!resolved || !resolved.parent || !resolved.target) return false;

    const inode = this.inodes.get(resolved.target.inodeId);
    if (!inode) return false;

    // Check parent directory write permission
    const parentInode = this.inodes.get(resolved.parent.inodeId);
    if (parentInode && !this.checkPermission(parentInode, user, 'w')) {
      return false;
    }

    // Remove child
    resolved.parent.children.delete(resolved.baseName);
    this.inodes.delete(inode.id);

    this.eventBus?.emit(
      'FILE_DELETE',
      'filesystem',
      'VFS',
      `File deleted: ${path}`,
      timestamp,
      { metadata: { path } }
    );

    return true;
  }

  public moveFile(
    srcPath: string,
    destPath: string,
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true },
    timestamp: SimulationTime = 0
  ): boolean {
    const src = this.resolvePath(srcPath);
    const dest = this.resolvePath(destPath);
    if (!src || !src.parent || !src.target || !dest || !dest.parent) return false;

    const srcInode = this.inodes.get(src.target.inodeId);
    const srcParentInode = this.inodes.get(src.parent.inodeId);
    const destParentInode = this.inodes.get(dest.parent.inodeId);

    if (srcParentInode && !this.checkPermission(srcParentInode, user, 'w')) return false;
    if (destParentInode && !this.checkPermission(destParentInode, user, 'w')) return false;

    src.parent.children.delete(src.baseName);
    src.target.name = dest.baseName;
    dest.parent.children.set(dest.baseName, src.target);

    if (srcInode) {
      srcInode.modifiedAt = timestamp;
    }

    this.eventBus?.emit(
      'FILE_CREATE',
      'filesystem',
      'VFS',
      `Moved ${srcPath} to ${destPath}`,
      timestamp,
      { metadata: { srcPath, destPath } }
    );

    return true;
  }

  public createDirectory(
    path: string,
    uid: number = 0,
    gid: number = 0,
    permissionsOctal: number = 755,
    timestamp: SimulationTime = 0
  ): boolean {
    return this.mkdir(path, permissionsOctal, uid, gid, timestamp);
  }

  public trashFile(
    path: string,
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true },
    timestamp: SimulationTime = 0
  ): boolean {
    const resolved = this.resolvePath(path);
    if (!resolved || !resolved.target) return false;

    // Ensure .Trash directory exists
    if (!this.findNode('/home/nova/.Trash')) {
      this.mkdir('/home/nova/.Trash', 700, 1000, 1000);
    }

    const trashDest = `/home/nova/.Trash/${resolved.baseName}`;
    return this.moveFile(path, trashDest, user, timestamp);
  }

  public restoreTrashFile(
    trashFileName: string,
    destDir: string = '/home/nova/Documents',
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true },
    timestamp: SimulationTime = 0
  ): boolean {
    const srcPath = `/home/nova/.Trash/${trashFileName}`;
    const destPath = `${destDir}/${trashFileName}`;
    return this.moveFile(srcPath, destPath, user, timestamp);
  }

  public emptyTrash(
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true },
    timestamp: SimulationTime = 0
  ): number {
    const trashNode = this.findNode('/home/nova/.Trash');
    if (!trashNode) return 0;

    let deletedCount = 0;
    const names = Array.from(trashNode.children.keys());
    for (const name of names) {
      if (this.deleteFile(`/home/nova/.Trash/${name}`, user, timestamp)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public listDirectory(
    path: string,
    user: { uid: number; gid: number; isRoot: boolean } = { uid: 0, gid: 0, isRoot: true }
  ): { name: string; type: FileType; permissions: string; size: number; uid: number; gid: number; inodeId: number }[] | null {
    const node = this.findNode(path);
    if (!node) return null;

    const dirInode = this.inodes.get(node.inodeId);
    if (!dirInode || dirInode.type !== 'DIRECTORY') return null;

    if (!this.checkPermission(dirInode, user, 'r')) {
      return null;
    }

    const result: {
      name: string;
      type: FileType;
      permissions: string;
      size: number;
      uid: number;
      gid: number;
      inodeId: number;
    }[] = [];

    // Current directory . and parent ..
    result.push({
      name: '.',
      type: 'DIRECTORY',
      permissions: formatPermissionsString('DIRECTORY', dirInode.permissions),
      size: 4096,
      uid: dirInode.uid,
      gid: dirInode.gid,
      inodeId: dirInode.id,
    });

    for (const [name, child] of node.children.entries()) {
      const childInode = this.inodes.get(child.inodeId);
      if (childInode) {
        result.push({
          name,
          type: childInode.type,
          permissions: formatPermissionsString(childInode.type, childInode.permissions),
          size: childInode.size,
          uid: childInode.uid,
          gid: childInode.gid,
          inodeId: childInode.id,
        });
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public chmod(path: string, octal: number | string): boolean {
    const node = this.findNode(path);
    if (!node) return false;

    const inode = this.inodes.get(node.inodeId);
    if (!inode) return false;

    inode.permissions = parseNumericPermissions(octal);
    return true;
  }

  public chown(path: string, uid: number, gid?: number): boolean {
    const node = this.findNode(path);
    if (!node) return false;

    const inode = this.inodes.get(node.inodeId);
    if (!inode) return false;

    inode.uid = uid;
    if (gid !== undefined) {
      inode.gid = gid;
    }
    return true;
  }

  public tree(path: string = '/', maxDepth: number = 3): string[] {
    const lines: string[] = [];
    const root = this.findNode(path);
    if (!root) return ['Invalid path'];

    lines.push(path);

    const traverse = (node: VfsNode, prefix: string, depth: number) => {
      if (depth >= maxDepth) return;

      const entries = Array.from(node.children.entries());
      entries.forEach(([name, childNode], index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const childPrefix = isLast ? '    ' : '│   ';

        lines.push(`${prefix}${connector}${name}`);
        if (childNode.children.size > 0) {
          traverse(childNode, `${prefix}${childPrefix}`, depth + 1);
        }
      });
    };

    traverse(root, '', 0);
    return lines;
  }
}
