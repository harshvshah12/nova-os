import { describe, it, expect } from 'vitest';
import { VirtualFileSystem, parseNumericPermissions, formatPermissionsString } from '../simulation/filesystem/Vfs';

describe('Phase 6 — Virtual File System (VFS)', () => {
  it('parses octal permissions and formats Unix permission strings', () => {
    const perm755 = parseNumericPermissions(755);
    expect(perm755.readOwner).toBe(true);
    expect(perm755.writeOwner).toBe(true);
    expect(perm755.execOwner).toBe(true);
    expect(perm755.writeGroup).toBe(false);
    expect(formatPermissionsString('FILE', perm755)).toBe('-rwxr-xr-x');

    const perm644 = parseNumericPermissions(644);
    expect(formatPermissionsString('FILE', perm644)).toBe('-rw-r--r--');

    const perm700 = parseNumericPermissions(700);
    expect(formatPermissionsString('DIRECTORY', perm700)).toBe('drwx------');
  });

  it('manages standard Linux file system tree and read/write operations', () => {
    const vfs = new VirtualFileSystem();

    // Verify root directories exist
    expect(vfs.findNode('/bin')).not.toBeNull();
    expect(vfs.findNode('/etc')).not.toBeNull();
    expect(vfs.findNode('/home/nova')).not.toBeNull();

    // Create file
    const success = vfs.writeFile('/home/nova/notes.txt', 'Hello NOVA OS', 1000, 1000, 644);
    expect(success).toBe(true);

    // Read file
    const content = vfs.readFile('/home/nova/notes.txt');
    expect(content).toBe('Hello NOVA OS');
  });

  it('enforces file permissions correctly for non-root users', () => {
    const vfs = new VirtualFileSystem();

    // Root-only file (600: read/write owner only)
    vfs.writeFile('/etc/secret.key', 'SUPER_SECRET', 0, 0, 600);

    const rootUser = { uid: 0, gid: 0, isRoot: true };
    const guestUser = { uid: 1001, gid: 1001, isRoot: false };

    // Root should read successfully
    expect(vfs.readFile('/etc/secret.key', rootUser)).toBe('SUPER_SECRET');

    // Guest should be blocked
    expect(vfs.readFile('/etc/secret.key', guestUser)).toBeNull();
  });

  it('generates dynamic /proc file content on read', () => {
    const vfs = new VirtualFileSystem();
    vfs.registerProcHandler('cpuinfo', () => 'model name: NOVA Virtual CPU @ 2.40GHz\ncores: 4\n');

    const content = vfs.readFile('/proc/cpuinfo');
    expect(content).toContain('NOVA Virtual CPU');
    expect(content).toContain('cores: 4');
  });

  it('populates /home/nova/projects/ with authentic project files and metadata', () => {
    const vfs = new VirtualFileSystem();
    expect(vfs.findNode('/home/nova/projects')).not.toBeNull();
    expect(vfs.findNode('/home/nova/projects/deepfake-engine')).not.toBeNull();

    const readme = vfs.readFile('/home/nova/projects/deepfake-engine/README.md');
    expect(readme).toContain('DeepFake');

    const metaJson = vfs.readFile('/home/nova/projects/deepfake-engine/meta.json');
    expect(metaJson).not.toBeNull();
    const parsed = JSON.parse(metaJson!);
    expect(parsed.processName).toBe('deepfake-detector');
    expect(parsed.workloadType).toBe('CPU_BOUND');
  });
});
