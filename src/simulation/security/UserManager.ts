// ============================================================================
// NOVA OS — USER & SECURITY MANAGER
// Multi-user sessions, authentication, UID/GID tracking, and privilege validation
// ============================================================================

import type { User, Group } from '../types';
import type { EventBus } from '../runtime/EventBus';

export class UserManager {
  private users: Map<string, User> = new Map();
  private groups: Map<string, Group> = new Map();
  private currentUser: User;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;

    // Default users
    const rootUser: User = {
      uid: 0,
      username: 'root',
      gid: 0,
      homeDir: '/root',
      shell: '/bin/bash',
      isRoot: true,
    };

    const novaUser: User = {
      uid: 1000,
      username: 'nova',
      gid: 1000,
      homeDir: '/home/nova',
      shell: '/bin/bash',
      isRoot: false,
    };

    const guestUser: User = {
      uid: 1001,
      username: 'guest',
      gid: 1001,
      homeDir: '/home/guest',
      shell: '/bin/bash',
      isRoot: false,
    };

    this.users.set('root', rootUser);
    this.users.set('nova', novaUser);
    this.users.set('guest', guestUser);

    // Default groups
    this.groups.set('root', { gid: 0, name: 'root', memberUids: [0] });
    this.groups.set('nova', { gid: 1000, name: 'nova', memberUids: [1000] });
    this.groups.set('guest', { gid: 1001, name: 'guest', memberUids: [1001] });

    // Initial session is 'nova'
    this.currentUser = novaUser;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public getUser(username: string): User | undefined {
    return this.users.get(username);
  }

  public getUserByUid(uid: number): User | undefined {
    for (const u of this.users.values()) {
      if (u.uid === uid) return u;
    }
    return undefined;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public switchUser(username: string): boolean {
    const user = this.users.get(username);
    if (!user) return false;

    const prevUser = this.currentUser.username;
    this.currentUser = user;

    this.eventBus?.emit(
      'SYSTEM_CALL',
      'security',
      'UserManager',
      `User session switched: ${prevUser} -> ${username} (UID ${user.uid})`,
      0,
      { metadata: { prevUser, newUser: username, uid: user.uid } }
    );

    return true;
  }

  public isRoot(): boolean {
    return this.currentUser.isRoot;
  }
}
