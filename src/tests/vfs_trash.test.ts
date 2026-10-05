// ============================================================================
// NOVA OS — VIRTUAL FILE SYSTEM TRASH & HIERARCHY TEST SUITE
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../simulation/filesystem/Vfs';

describe('VirtualFileSystem Trash & Standard Hierarchy', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  it('populates standard Linux desktop directory hierarchy', () => {
    expect(vfs.findNode('/home/nova')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Desktop')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Documents')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Downloads')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Music')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Pictures')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Videos')).not.toBeNull();
    expect(vfs.findNode('/home/nova/Workspace')).not.toBeNull();
    expect(vfs.findNode('/home/nova/.Trash')).not.toBeNull();
  });

  it('has pre-populated realistic files with content', () => {
    const user = { uid: 1000, gid: 1000, isRoot: false };
    const guide = vfs.readFile('/home/nova/Documents/NOVA_OS_Guide.md', user);
    expect(guide).toContain('NOVA OS');

    const logo = vfs.readFile('/home/nova/Pictures/nova_logo.svg', user);
    expect(logo).toContain('<svg');

    const cProg = vfs.readFile('/home/nova/Workspace/hello_world.c', user);
    expect(cProg).toContain('#include <stdio.h>');
  });

  it('moves a file to Trash and allows inspection', () => {
    const user = { uid: 1000, gid: 1000, isRoot: false };
    vfs.writeFile('/home/nova/Documents/temp_file.txt', 'Delete me', 1000, 1000, 644);

    expect(vfs.readFile('/home/nova/Documents/temp_file.txt', user)).toBe('Delete me');

    const trashed = vfs.trashFile('/home/nova/Documents/temp_file.txt');
    expect(trashed).toBe(true);

    // Should no longer exist at original path
    expect(vfs.readFile('/home/nova/Documents/temp_file.txt', user)).toBeNull();

    // Should now exist inside .Trash
    expect(vfs.readFile('/home/nova/.Trash/temp_file.txt', user)).toBe('Delete me');
  });

  it('restores a file from Trash back to destination directory', () => {
    const user = { uid: 1000, gid: 1000, isRoot: false };
    vfs.writeFile('/home/nova/Documents/important.txt', 'Valuable note', 1000, 1000, 644);
    vfs.trashFile('/home/nova/Documents/important.txt');

    const restored = vfs.restoreTrashFile('important.txt', '/home/nova/Documents');
    expect(restored).toBe(true);

    expect(vfs.readFile('/home/nova/Documents/important.txt', user)).toBe('Valuable note');
    expect(vfs.readFile('/home/nova/.Trash/important.txt', user)).toBeNull();
  });

  it('empties all items from Trash completely', () => {
    const user = { uid: 1000, gid: 1000, isRoot: false };
    vfs.writeFile('/home/nova/.Trash/junk1.log', 'trash 1', 1000, 1000, 644);
    vfs.writeFile('/home/nova/.Trash/junk2.log', 'trash 2', 1000, 1000, 644);

    const count = vfs.emptyTrash();
    expect(count).toBeGreaterThanOrEqual(2);

    expect(vfs.readFile('/home/nova/.Trash/junk1.log', user)).toBeNull();
    expect(vfs.readFile('/home/nova/.Trash/junk2.log', user)).toBeNull();
  });
});
