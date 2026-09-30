import { describe, it, expect } from 'vitest';
import { Shell } from '../simulation/terminal/Shell';
import { VirtualFileSystem } from '../simulation/filesystem/Vfs';
import { ProcessManager } from '../simulation/processes/ProcessManager';
import { UserManager } from '../simulation/security/UserManager';
import { SimulationClock } from '../simulation/runtime/Clock';
import { VirtualCpu } from '../simulation/hardware/Cpu';
import { VirtualRam } from '../simulation/hardware/Ram';
import { VirtualDisk } from '../simulation/hardware/Disk';
import { VirtualNetworkAdapter } from '../simulation/hardware/NetworkAdapter';
import { SchedulerEngine } from '../simulation/scheduler/SchedulerEngine';
import { EventBus } from '../simulation/runtime/EventBus';

function createTestShell() {
  const bus = new EventBus();
  const vfs = new VirtualFileSystem(bus);
  const pm = new ProcessManager(bus);
  const userManager = new UserManager(bus);
  const clock = new SimulationClock();
  const cpu = new VirtualCpu(4, 2400);
  const ram = new VirtualRam(2048, 64);
  const disk = new VirtualDisk(20, 50);
  const net = new VirtualNetworkAdapter();
  const scheduler = new SchedulerEngine(pm, cpu, bus);

  const shell = new Shell({
    vfs,
    processManager: pm,
    userManager,
    clock,
    cpu,
    ram,
    disk,
    net,
    scheduler,
    eventBus: bus,
  });

  return { shell, vfs, pm, userManager };
}

describe('Phase 7 & 8 — Terminal Shell & Commands', () => {
  it('executes basic Linux commands: pwd, whoami, echo, uname', () => {
    const { shell } = createTestShell();

    expect(shell.execute('pwd').output).toBe('/home/nova');
    expect(shell.execute('whoami').output).toBe('nova');
    expect(shell.execute('echo hello world').output).toBe('hello world');
    expect(shell.execute('uname -a').output).toContain('Linux nova-system');
  });

  it('supports file redirection > and >>', () => {
    const { shell, vfs } = createTestShell();

    // echo test > myfile.txt
    shell.execute('echo "line 1" > myfile.txt');
    expect(vfs.readFile('/home/nova/myfile.txt')?.trim()).toBe('line 1');

    // append >>
    shell.execute('echo "line 2" >> myfile.txt');
    const read = vfs.readFile('/home/nova/myfile.txt');
    expect(read).toContain('line 1');
    expect(read).toContain('line 2');
  });

  it('supports command pipelines (|)', () => {
    const { shell } = createTestShell();

    // Create a multi-line file
    shell.execute('echo "apple\nbanana\napricot\ncherry" > fruits.txt');

    // Pipeline: cat fruits.txt | grep ap
    const res = shell.execute('cat fruits.txt | grep ap');
    expect(res.output).toContain('apple');
    expect(res.output).toContain('apricot');
    expect(res.output).not.toContain('cherry');
  });

  it('handles user switching (su) and privilege changes', () => {
    const { shell, userManager } = createTestShell();

    expect(userManager.getCurrentUser().username).toBe('nova');
    expect(userManager.isRoot()).toBe(false);

    shell.execute('su root');
    expect(userManager.getCurrentUser().username).toBe('root');
    expect(userManager.isRoot()).toBe(true);
    expect(shell.getPrompt()).toContain('#');
  });
});
