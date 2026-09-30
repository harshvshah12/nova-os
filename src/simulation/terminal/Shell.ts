// ============================================================================
// NOVA OS — BASH-INSPIRED TERMINAL SHELL
// Full command parser with pipes (|), redirection (>, >>), and native GNU utilities
// ============================================================================

import type { VirtualFileSystem } from '../filesystem/Vfs';
import type { ProcessManager } from '../processes/ProcessManager';
import type { UserManager } from '../security/UserManager';
import type { SimulationClock } from '../runtime/Clock';
import type { VirtualCpu } from '../hardware/Cpu';
import type { VirtualRam } from '../hardware/Ram';
import type { VirtualDisk } from '../hardware/Disk';
import type { VirtualNetworkAdapter } from '../hardware/NetworkAdapter';
import type { SchedulerEngine } from '../scheduler/SchedulerEngine';
import type { EventBus } from '../runtime/EventBus';

export interface ShellResult {
  output: string;
  exitCode: number;
  newCwd?: string;
  clear?: boolean;
}

export class Shell {
  private vfs: VirtualFileSystem;
  private processManager: ProcessManager;
  private userManager: UserManager;
  private clock: SimulationClock;
  private cpu: VirtualCpu;
  private ram: VirtualRam;
  private disk: VirtualDisk;
  private net: VirtualNetworkAdapter;
  private scheduler: SchedulerEngine;
  private eventBus?: EventBus;

  private cwd: string = '/home/nova';
  private history: string[] = [];

  constructor(deps: {
    vfs: VirtualFileSystem;
    processManager: ProcessManager;
    userManager: UserManager;
    clock: SimulationClock;
    cpu: VirtualCpu;
    ram: VirtualRam;
    disk: VirtualDisk;
    net: VirtualNetworkAdapter;
    scheduler: SchedulerEngine;
    eventBus?: EventBus;
  }) {
    this.vfs = deps.vfs;
    this.processManager = deps.processManager;
    this.userManager = deps.userManager;
    this.clock = deps.clock;
    this.cpu = deps.cpu;
    this.ram = deps.ram;
    this.disk = deps.disk;
    this.net = deps.net;
    this.scheduler = deps.scheduler;
    this.eventBus = deps.eventBus;
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(newCwd: string): void {
    this.cwd = newCwd;
  }

  public getPrompt(): string {
    const user = this.userManager.getCurrentUser();
    const symbol = user.isRoot ? '#' : '$';
    const displayCwd =
      this.cwd === user.homeDir ? '~' : this.cwd.startsWith(user.homeDir) ? this.cwd.replace(user.homeDir, '~') : this.cwd;
    return `${user.username}@nova:${displayCwd}${symbol} `;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Execute a full command line with support for pipelines (|) and redirection (>, >>)
   */
  public execute(commandLine: string): ShellResult {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0 };
    }

    this.history.push(trimmed);

    // 1. Check for Output Redirection (>> or >)
    let redirectPath: string | null = null;
    let append = false;
    let commandToRun = trimmed;

    if (trimmed.includes('>>')) {
      const parts = trimmed.split('>>');
      commandToRun = parts[0].trim();
      redirectPath = parts[1].trim();
      append = true;
    } else if (trimmed.includes('>')) {
      const parts = trimmed.split('>');
      commandToRun = parts[0].trim();
      redirectPath = parts[1].trim();
      append = false;
    }

    // 2. Check for Pipeline (|)
    if (commandToRun.includes('|')) {
      const pipelineParts = commandToRun.split('|').map((s) => s.trim());
      let currentInput = '';
      let lastExit = 0;

      for (const cmdSegment of pipelineParts) {
        const res = this.runSingleCommand(cmdSegment, currentInput);
        currentInput = res.output;
        lastExit = res.exitCode;
        if (res.newCwd) this.cwd = res.newCwd;
        if (res.clear) return res;
      }

      if (redirectPath) {
        const fullRedirect = this.vfs.normalizePath(redirectPath, this.cwd);
        const user = this.userManager.getCurrentUser();
        this.vfs.writeFile(
          fullRedirect,
          currentInput + (currentInput.endsWith('\n') ? '' : '\n'),
          user.uid,
          user.gid,
          644,
          this.clock.getTime(),
          append
        );
        return { output: '', exitCode: 0 };
      }

      return { output: currentInput, exitCode: lastExit };
    }

    // Single command execution
    const res = this.runSingleCommand(commandToRun, '');
    if (res.newCwd) {
      this.cwd = res.newCwd;
    }

    if (redirectPath && !res.clear) {
      const fullRedirect = this.vfs.normalizePath(redirectPath, this.cwd);
      const user = this.userManager.getCurrentUser();
      this.vfs.writeFile(
        fullRedirect,
        res.output + (res.output.endsWith('\n') ? '' : '\n'),
        user.uid,
        user.gid,
        644,
        this.clock.getTime(),
        append
      );
      return { output: '', exitCode: 0 };
    }

    return res;
  }

  private runSingleCommand(rawCmd: string, stdin: string): ShellResult {
    const tokens = this.tokenize(rawCmd);
    if (tokens.length === 0) return { output: '', exitCode: 0 };

    const cmd = tokens[0];
    const args = tokens.slice(1);
    const user = this.userManager.getCurrentUser();

    switch (cmd) {
      case 'clear':
        return { output: '', exitCode: 0, clear: true };

      case 'pwd':
        return { output: this.cwd, exitCode: 0 };

      case 'whoami':
        return { output: user.username, exitCode: 0 };

      case 'history':
        return {
          output: this.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n'),
          exitCode: 0,
        };

      case 'date': {
        const totalSec = Math.floor(this.clock.getTime() / 1000);
        return {
          output: `Simulated System Date: Uptime ${this.clock.getFormattedTime()} (Tick ${this.clock.getTotalTicks()})`,
          exitCode: 0,
        };
      }

      case 'uptime': {
        const util = this.cpu.getAverageUtilization();
        return {
          output: ` ${this.clock.getFormattedTime()} up ${Math.floor(this.clock.getTime() / 1000)}s,  1 user,  load average: ${(util / 100).toFixed(2)}, ${(util / 110).toFixed(2)}, ${(util / 120).toFixed(2)}`,
          exitCode: 0,
        };
      }

      case 'uname': {
        if (args.includes('-a')) {
          return {
            output: 'Linux nova-system 0.1.0-simulated-x86_64 SMP Antigravity OS GNU/Linux',
            exitCode: 0,
          };
        }
        return { output: 'Linux', exitCode: 0 };
      }

      case 'echo':
        return { output: args.join(' '), exitCode: 0 };

      case 'cd': {
        const target = args[0] || user.homeDir;
        const normalized = target === '~' ? user.homeDir : this.vfs.normalizePath(target, this.cwd);
        const node = this.vfs.findNode(normalized);
        if (!node) {
          return { output: `bash: cd: ${target}: No such file or directory`, exitCode: 1 };
        }
        const inode = this.vfs.getInode(node.inodeId);
        if (!inode || inode.type !== 'DIRECTORY') {
          return { output: `bash: cd: ${target}: Not a directory`, exitCode: 1 };
        }
        return { output: '', exitCode: 0, newCwd: normalized };
      }

      case 'ls': {
        const showAll = args.some((a) => a.includes('a'));
        const longFormat = args.some((a) => a.includes('l'));
        const targetArg = args.find((a) => !a.startsWith('-')) || this.cwd;
        const targetPath = this.vfs.normalizePath(targetArg, this.cwd);

        const list = this.vfs.listDirectory(targetPath, user);
        if (!list) {
          return { output: `ls: cannot access '${targetArg}': No such file or directory`, exitCode: 1 };
        }

        const filtered = showAll ? list : list.filter((item) => !item.name.startsWith('.') || item.name === '.' || item.name === '..');

        if (longFormat) {
          const lines = filtered.map(
            (item) =>
              `${item.permissions} 1 ${item.uid === 0 ? 'root' : 'nova'} ${item.gid === 0 ? 'root' : 'nova'} ${String(item.size).padStart(6, ' ')} ${item.name}`
          );
          return { output: `total ${filtered.length}\n` + lines.join('\n'), exitCode: 0 };
        } else {
          return { output: filtered.map((i) => i.name).join('  '), exitCode: 0 };
        }
      }

      case 'cat': {
        if (args.length === 0) {
          return { output: stdin || '', exitCode: 0 };
        }
        const outputs: string[] = [];
        for (const filePath of args) {
          const normalized = this.vfs.normalizePath(filePath, this.cwd);
          const content = this.vfs.readFile(normalized, user);
          if (content === null) {
            outputs.push(`cat: ${filePath}: No such file or permission denied`);
          } else {
            outputs.push(content);
          }
        }
        return { output: outputs.join('\n'), exitCode: 0 };
      }

      case 'head': {
        const linesCount = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1], 10) || 10 : 10;
        const target = args.find((a) => !a.startsWith('-') && isNaN(Number(a)));
        let content = stdin;
        if (target) {
          const normalized = this.vfs.normalizePath(target, this.cwd);
          content = this.vfs.readFile(normalized, user) || '';
        }
        const lines = content.split('\n').slice(0, linesCount);
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'tail': {
        const linesCount = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1], 10) || 10 : 10;
        const target = args.find((a) => !a.startsWith('-') && isNaN(Number(a)));
        let content = stdin;
        if (target) {
          const normalized = this.vfs.normalizePath(target, this.cwd);
          content = this.vfs.readFile(normalized, user) || '';
        }
        const lines = content.split('\n');
        return { output: lines.slice(-linesCount).join('\n'), exitCode: 0 };
      }

      case 'grep': {
        const pattern = args[0];
        if (!pattern) return { output: 'grep: missing pattern', exitCode: 1 };
        const file = args[1];
        let text = stdin;
        if (file) {
          const normalized = this.vfs.normalizePath(file, this.cwd);
          text = this.vfs.readFile(normalized, user) || '';
        }
        const matched = text
          .split('\n')
          .filter((line) => line.toLowerCase().includes(pattern.toLowerCase()));
        return { output: matched.join('\n'), exitCode: 0 };
      }

      case 'mkdir': {
        if (!args[0]) return { output: 'mkdir: missing operand', exitCode: 1 };
        const target = this.vfs.normalizePath(args[0], this.cwd);
        const ok = this.vfs.mkdir(target, 755, user.uid, user.gid, this.clock.getTime());
        return {
          output: ok ? '' : `mkdir: cannot create directory '${args[0]}'`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'touch': {
        if (!args[0]) return { output: 'touch: missing file operand', exitCode: 1 };
        const target = this.vfs.normalizePath(args[0], this.cwd);
        const ok = this.vfs.writeFile(target, '', user.uid, user.gid, 644, this.clock.getTime(), false);
        return {
          output: ok ? '' : `touch: cannot touch '${args[0]}'`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'rm': {
        if (!args[0]) return { output: 'rm: missing operand', exitCode: 1 };
        const target = this.vfs.normalizePath(args[0], this.cwd);
        const ok = this.vfs.deleteFile(target, user, this.clock.getTime());
        return {
          output: ok ? '' : `rm: cannot remove '${args[0]}': No such file or permission denied`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'tree': {
        const target = args[0] ? this.vfs.normalizePath(args[0], this.cwd) : this.cwd;
        const lines = this.vfs.tree(target, 3);
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'chmod': {
        if (args.length < 2) return { output: 'chmod: missing operand', exitCode: 1 };
        const mode = args[0];
        const target = this.vfs.normalizePath(args[1], this.cwd);
        const ok = this.vfs.chmod(target, mode);
        return {
          output: ok ? '' : `chmod: cannot access '${args[1]}'`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'chown': {
        if (args.length < 2) return { output: 'chown: missing operand', exitCode: 1 };
        if (!user.isRoot) return { output: 'chown: changing ownership: Operation not permitted', exitCode: 1 };
        const target = this.vfs.normalizePath(args[1], this.cwd);
        const newUid = args[0] === 'root' ? 0 : 1000;
        const ok = this.vfs.chown(target, newUid);
        return { output: ok ? '' : `chown: cannot access '${args[1]}'`, exitCode: ok ? 0 : 1 };
      }

      case 'ps': {
        const processes = this.processManager.getAllProcesses();
        const header = '  PID  PPID USER     STAT   %CPU   TIME COMMAND';
        const lines = processes.map((p) => {
          const pcb = p.getPcb();
          const stat = pcb.state === 'RUNNING' ? 'R' : pcb.state === 'READY' ? 'S+' : pcb.state === 'BLOCKED' ? 'D' : pcb.state === 'TERMINATED' ? 'Z' : 'T';
          const cpuSec = (pcb.cpuTime / 1000).toFixed(1);
          return `${String(pcb.pid).padStart(5, ' ')} ${String(pcb.ppid).padStart(5, ' ')} ${pcb.uid === 0 ? 'root   ' : 'nova   '} ${stat.padEnd(6, ' ')}  0.0   0:${cpuSec.padStart(4, '0')} ${pcb.command}`;
        });
        return { output: [header, ...lines].join('\n'), exitCode: 0 };
      }

      case 'top': {
        const processes = this.processManager.getActiveProcesses();
        const total = processes.length;
        const running = processes.filter((p) => p.getState() === 'RUNNING').length;
        const sleeping = processes.filter((p) => p.getState() === 'READY').length;
        const blocked = processes.filter((p) => p.getState() === 'BLOCKED').length;

        const summary = [
          `top - ${this.clock.getFormattedTime()} up ${Math.floor(this.clock.getTime() / 1000)}s, 1 user, load: ${(this.cpu.getAverageUtilization() / 100).toFixed(2)}`,
          `Tasks: ${total} total, ${running} running, ${sleeping} sleeping, ${blocked} stopped`,
          `%Cpu(s): ${(this.cpu.getAverageUtilization()).toFixed(1)} us,  ${(100 - this.cpu.getAverageUtilization()).toFixed(1)} id`,
          `MiB Mem : ${this.ram.getTotalMb()} total, ${this.ram.getFreeFrames().length * 32} free, ${this.ram.getUsedFrames().length * 32} used`,
          '',
          '  PID USER      PR  NI    VIRT    RES  S  %CPU  %MEM     TIME+ COMMAND',
        ];

        const procLines = processes.slice(0, 10).map((p) => {
          const pcb = p.getPcb();
          const s = pcb.state === 'RUNNING' ? 'R' : pcb.state === 'READY' ? 'S' : 'D';
          return `${String(pcb.pid).padStart(5, ' ')} ${pcb.uid === 0 ? 'root   ' : 'nova   '} ${String(pcb.priority).padStart(3, ' ')} ${String(pcb.nice).padStart(3, ' ')} ${String(pcb.memoryUsageBytes / 1024).padStart(7, ' ')}   ${String(pcb.allocatedFrames.length * 4).padStart(4, ' ')}  ${s}   0.0   ${((pcb.allocatedFrames.length / (this.ram.getFrameCount() || 1)) * 100).toFixed(1)}   0:${(pcb.cpuTime / 1000).toFixed(2)} ${pcb.name}`;
        });

        return { output: [...summary, ...procLines].join('\n'), exitCode: 0 };
      }

      case 'kill': {
        if (!args[0]) return { output: 'kill: usage: kill [-s sigspec | -signum] pid', exitCode: 1 };
        let signal = 15; // SIGTERM
        let pidArg = args[0];

        if (args[0].startsWith('-')) {
          const sigStr = args[0].replace('-', '');
          signal = sigStr === '9' ? 9 : sigStr === '15' ? 15 : sigStr === 'STOP' ? 19 : sigStr === 'CONT' ? 18 : parseInt(sigStr, 10) || 15;
          pidArg = args[1];
        }

        const pid = parseInt(pidArg, 10);
        if (isNaN(pid)) return { output: `kill: invalid pid '${pidArg}'`, exitCode: 1 };

        const ok = this.processManager.sendSignal(pid, signal, this.clock.getTime());
        return {
          output: ok ? '' : `kill: (${pid}) - No such process`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'free': {
        const total = this.ram.getTotalMb();
        const used = Math.round((this.ram.getUsedFrames().length / (this.ram.getFrameCount() || 1)) * total);
        const free = total - used;
        const header = '               total        used        free      shared  buff/cache   available';
        const memLine = `Mem:        ${String(total).padStart(8, ' ')}M   ${String(used).padStart(8, ' ')}M   ${String(free).padStart(8, ' ')}M         0M          0M   ${String(free).padStart(8, ' ')}M`;
        const swapLine = `Swap:           2048M          0M       2048M`;
        return { output: [header, memLine, swapLine].join('\n'), exitCode: 0 };
      }

      case 'df': {
        const header = 'Filesystem     1K-blocks      Used Available Use% Mounted on';
        const rootLine = 'udev             1048576         0   1048576   0% /dev';
        const mainLine = '/dev/sda1       20971520    327680  20643840   2% /';
        const tmpLine = 'tmpfs             524288       128    524160   1% /tmp';
        return { output: [header, rootLine, mainLine, tmpLine].join('\n'), exitCode: 0 };
      }

      case 'ifconfig': {
        const netState = this.net.getState();
        return {
          output: `${netState.interfaceName}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet ${netState.ip}  netmask ${netState.netmask}  broadcast 192.168.1.255\n        ether ${netState.mac}  txqueuelen 1000  (Ethernet)\n        RX packets ${netState.rxPackets}  bytes ${netState.rxBytes}\n        TX packets ${netState.txPackets}  bytes ${netState.txBytes}\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`,
          exitCode: 0,
        };
      }

      case 'ping': {
        const host = args.find((a) => !a.startsWith('-')) || '192.168.1.1';
        this.net.sendPacket('ICMP', host, 'PING', this.clock.getTime());
        return {
          output: `PING ${host} (${host}) 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=21.4 ms\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=22.1 ms\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`,
          exitCode: 0,
        };
      }

      case 'netstat': {
        const netState = this.net.getState();
        const header = 'Proto Recv-Q Send-Q Local Address           Foreign Address         State';
        const lines = netState.activeSockets.map(
          (s) =>
            `${s.protocol.padEnd(5, ' ')}      0      0 0.0.0.0:${String(s.localPort).padEnd(16, ' ')} ${s.remoteIp}:${String(s.remotePort).padEnd(15, ' ')} ${s.state}`
        );
        return { output: [header, ...lines].join('\n'), exitCode: 0 };
      }

      case 'su': {
        const targetUser = args[0] || 'root';
        const ok = this.userManager.switchUser(targetUser);
        return {
          output: ok ? `Switched session to ${targetUser}` : `su: user ${targetUser} does not exist`,
          exitCode: ok ? 0 : 1,
        };
      }

      case 'run': {
        const scenario = args[0];
        if (!scenario) {
          return {
            output: `Usage: run <demo>\nAvailable Demos:\n  run cpu-demo       (Spawn 4 CPU burst processes)\n  run io-demo        (Spawn I/O bound disk seeking processes)\n  run mem-demo       (Trigger page faults and frame replacements)\n  run deadlock-demo  (Inject Resource Allocation Graph cycle)\n  run mixed-demo     (Realistic mixed workload)`,
            exitCode: 1,
          };
        }

        if (scenario === 'cpu-demo') {
          for (let i = 1; i <= 4; i++) {
            this.processManager.createProcess(
              `compute_worker_${i}`,
              `./compute --threads=${i}`,
              'CPU_BOUND',
              { timestamp: this.clock.getTime() }
            );
          }
          return { output: 'Spawned 4 CPU-bound processes. Scheduler active.', exitCode: 0 };
        } else if (scenario === 'io-demo') {
          for (let i = 1; i <= 3; i++) {
            this.processManager.createProcess(
              `disk_reader_${i}`,
              `dd if=/dev/sda1 of=/tmp/data${i}.bin`,
              'IO_BOUND',
              { timestamp: this.clock.getTime() }
            );
          }
          return { output: 'Spawned 3 I/O-bound disk processes.', exitCode: 0 };
        } else if (scenario === 'mem-demo') {
          for (let i = 1; i <= 3; i++) {
            this.processManager.createProcess(
              `mem_hog_${i}`,
              `./allocator --pages=16`,
              'MEMORY_INTENSIVE',
              { timestamp: this.clock.getTime() }
            );
          }
          return { output: 'Spawned 3 memory-intensive processes. Watch page fault timeline!', exitCode: 0 };
        }

        return { output: `run: unknown scenario '${scenario}'`, exitCode: 1 };
      }

      case 'service': {
        const sub = args[0];
        const sName = args[1];
        if (!sub || !sName) {
          return { output: 'Usage: service <status|start|stop|restart> <daemon>', exitCode: 1 };
        }
        return {
          output: `[ OK ] Service '${sName}' status: active (running)`,
          exitCode: 0,
        };
      }

      case 'pkg': {
        const action = args[0];
        const pkgName = args[1];
        if (action === 'list') {
          return {
            output: 'Installed Packages:\n  nova-core 1.0.0 [system]\n  bash 5.2.15 [core]\n  gcc-sim 12.2.0 [developer]\n  python3-sim 3.11.2 [runtime]\n  net-tools 2.10 [networking]',
            exitCode: 0,
          };
        } else if (action === 'install') {
          if (!pkgName) return { output: 'pkg: install requires package name', exitCode: 1 };
          this.vfs.writeFile(`/usr/bin/${pkgName}`, `#!/bin/sh\necho "Running ${pkgName} 1.0"`, 0, 0, 755);
          return { output: `Unpacking ${pkgName}... Done.\nSetting up ${pkgName} (1.0)... Done.`, exitCode: 0 };
        } else if (action === 'search') {
          return { output: `Found: ${pkgName || 'packages'}-sim (1.0.0 LTS) - Operating system package repository`, exitCode: 0 };
        }
        return { output: 'Usage: pkg <list|search|install|remove> [package]', exitCode: 1 };
      }

      case 'help': {
        return {
          output: `NOVA OS v1.0.0 Command Reference:
  File Operations : ls, cd, pwd, mkdir, touch, rm, cat, head, tail, grep, tree, chmod, chown
  Process Control : ps, top, kill, jobs, run
  Hardware & Sys  : free, df, uptime, date, uname, clear, history, whoami, su
  Networking      : ifconfig, ping, netstat
  Demos & Lab     : run cpu-demo, run io-demo, run mem-demo
  Package & Svc   : pkg list, pkg install <pkg>, service status <daemon>
  Pipes & Streams : command1 | command2, command > file.txt, command >> file.txt`,
          exitCode: 0,
        };
      }

      default: {
        // Try executing file from VFS (e.g. /bin/xxx or ./xxx)
        const execPath = cmd.startsWith('/') ? cmd : this.vfs.normalizePath(cmd, this.cwd);
        const content = this.vfs.readFile(execPath, user);
        if (content !== null) {
          return { output: `[Executing ${cmd}]\n${content}`, exitCode: 0 };
        }
        return { output: `bash: ${cmd}: command not found`, exitCode: 127 };
      }
    }
  }

  private tokenize(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if ((char === '"' || char === "'") && (!inQuotes || quoteChar === char)) {
        inQuotes = !inQuotes;
        quoteChar = inQuotes ? char : '';
      } else if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }
}
