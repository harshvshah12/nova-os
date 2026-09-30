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
    this.mkdir('/home/guest', 750, 1001, 1001);
    this.mkdir('/lib', 755, 0, 0);
    this.mkdir('/proc', 555, 0, 0);
    this.mkdir('/tmp', 777, 0, 0);
    this.mkdir('/usr', 755, 0, 0);
    this.mkdir('/usr/bin', 755, 0, 0);
    this.mkdir('/var', 755, 0, 0);
    this.mkdir('/var/log', 755, 0, 0);

    // Initial files
    this.writeFile(
      '/etc/os-release',
      `NAME="NOVA OS"\nVERSION="1.0.0 LTS"\nID=nova\nPRETTY_NAME="NOVA OS (Virtual Systems Architecture)"\nKERNEL="0.1.0-simulated-x86_64"`,
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
      '/etc/passwd',
      `root:x:0:0:root:/root:/bin/bash\nnova:x:1000:1000:Nova User:/home/nova:/bin/bash\nguest:x:1001:1001:Guest User:/home/guest:/bin/bash\n`,
      0,
      0,
      644
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

    this.writeFile(
      '/var/log/kernel.log',
      `[00:00.000] kernel: Initializing virtual hardware and CPU cores...\n[00:00.010] kernel: VFS mounted root filesystem (ext4-sim)\n`,
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
      if (inode.deviceHandler === 'random') return Math.random().toString(36).substring(2);
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
