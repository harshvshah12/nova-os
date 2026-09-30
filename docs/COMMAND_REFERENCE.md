# NOVA OS — Terminal Command & Shell Reference

NOVA OS features an authentic Unix-inspired bash shell with interactive command parsing, pipelines (`|`), file redirection (`>`, `>>`), command history, tab autocomplete, signals, and dynamic `/proc` file inspection.

---

## 1. File & Directory Commands

### `ls [flags] [path]`
Lists directory entries.
- Flags:
  - `-a`: Show hidden entries (starting with `.`)
  - `-l`: Long listing with Unix permissions, owner, size, and name
  - `-la`: Combined all and long format
- Example: `ls -la /etc`

### `cd [path]`
Changes current working directory.
- `cd ~` or `cd` navigates to the user's home directory (`/home/nova`).
- `cd ..` navigates to parent directory.
- Example: `cd /var/log`

### `pwd`
Prints current working directory path.

### `cat [file ...]`
Outputs file contents. If executed with a dynamic `/proc` file, computes live kernel metrics.
- Example: `cat /etc/os-release`
- Example: `cat /proc/meminfo`

### `head [-n count] [file]`
Outputs the first N lines of file or stdin stream.
- Example: `cat /proc/cpuinfo | head -n 4`

### `tail [-n count] [file]`
Outputs the last N lines of file or stdin stream.
- Example: `tail -n 5 /var/log/kernel.log`

### `grep <pattern> [file]`
Filters lines matching pattern from file or pipeline input.
- Example: `cat /etc/passwd | grep nova`
- Example: `ls /bin | grep sh`

### `mkdir [path]`
Creates a new directory in the virtual file system.
- Example: `mkdir /home/nova/projects`

### `touch [path]`
Creates an empty file or updates timestamp.
- Example: `touch /home/nova/script.sh`

### `rm [path]`
Removes a file from the virtual file system.
- Example: `rm /home/nova/test.txt`

### `chmod <octal> <path>`
Updates Unix file permissions.
- Modes: `755` (`rwxr-xr-x`), `644` (`rw-r--r--`), `600` (`rw-------`), `777` (`rwxrwxrwx`)
- Example: `chmod 755 /home/nova/demo.sh`

### `chown <user> <path>`
Changes file owner (requires root privileges).
- Example: `chown nova /home/nova/notes.txt`

### `tree [path]`
Displays directory hierarchy tree.
- Example: `tree /etc`

---

## 2. Process & Scheduling Commands

### `ps`
Displays current process status table including PID, PPID, User, State, CPU time, and Command.

### `top`
Interactive system summary showing CPU load, memory breakdown, task states (Running, Sleeping, Blocked), and top resource-consuming processes.

### `kill [-signal] <pid>`
Sends a simulated POSIX signal to a process:
- `kill 12` (Default SIGTERM, 15)
- `kill -9 12` (SIGKILL, immediate termination)
- `kill -STOP 12` (SIGSTOP, suspend process)
- `kill -CONT 12` (SIGCONT, resume suspended process)

### `run <scenario>`
Spawns pre-configured simulated workloads:
- `run cpu-demo`: Spawns 4 CPU-bound compute tasks
- `run io-demo`: Spawns 3 I/O-bound disk seeking tasks
- `run mem-demo`: Spawns 3 memory-intensive tasks triggering page faults

---

## 3. Hardware & Telemetry Commands

### `free`
Displays total, used, and free virtual memory in megabytes.

### `df`
Displays virtual disk storage usage and mount points.

### `uptime`
Displays simulation running time, active user count, and load averages.

### `date`
Displays simulated system timestamp and total ticks elapsed.

### `uname [-a]`
Prints simulated kernel and architecture information.

---

## 4. Networking Commands

### `ifconfig`
Displays virtual `eth0` network interface configuration (IP `192.168.1.10`, MAC, TX/RX counters).

### `ping <ip>`
Transmits simulated ICMP echo request packets and measures virtual network latency.
- Example: `ping 8.8.8.8`
- Example: `ping 192.168.1.1`

### `netstat`
Lists active TCP and UDP virtual socket connections.

---

## 5. Security & Session Commands

### `whoami`
Displays the username of the current logged-in session.

### `su [username]`
Switches user session (e.g. `su root` switches to superuser with root bypass privileges).

---

## 6. Pipelines & Output Redirection

- **Pipe (`|`)**: Chains output of command A to input of command B:
  ```bash
  cat /etc/passwd | grep root
  ```
- **Overwrite Redirection (`>`)**: Writes command output into a file:
  ```bash
  echo "Hello World" > /home/nova/greeting.txt
  ```
- **Append Redirection (`>>`)**: Appends command output to an existing file:
  ```bash
  echo "Second Line" >> /home/nova/greeting.txt
  ```
