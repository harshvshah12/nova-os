// ============================================================================
// NOVA OS — HELP & DOCUMENTATION APPLICATION
// Interactive built-in operating systems reference guide, manual, and command docs
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { 
  BookOpen, 
  Search, 
  Terminal, 
  Cpu, 
  Layers, 
  HardDrive, 
  Globe, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Code2,
  Sparkles
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  content: {
    summary: string;
    subsections: {
      heading: string;
      body: string;
      code?: string;
    }[];
  };
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'intro',
    title: 'Welcome to NOVA OS',
    category: 'Getting Started',
    icon: Sparkles,
    content: {
      summary: 'NOVA OS is a high-fidelity, deterministic simulated computer and Linux-inspired operating system running entirely in your browser.',
      subsections: [
        {
          heading: 'Simulation vs Host Computer',
          body: 'NOVA OS maintains strict architectural honesty. The host system is your actual physical machine running this web application. Inside NOVA OS lives an entirely simulated virtual hardware layer: a virtual 4-core CPU, 2048MB virtual RAM with 4KB paging, a 256-track block disk device, virtual network interface, and in-memory hierarchical Unix VFS. Physical hardware is never tampered with.'
        },
        {
          heading: 'Deterministic Simulation Engine',
          body: 'Every tick of NOVA advances simulated time deterministically. Process state transitions (READY -> RUNNING -> BLOCKED -> TERMINATED), page table lookups, translation lookaside buffer (TLB) misses, disk seek overheads, and network socket transitions are calculated using seeded pseudorandom algorithms.'
        }
      ]
    }
  },
  {
    id: 'os-concepts',
    title: 'Core OS Principles',
    category: 'Theory & Labs',
    icon: Cpu,
    content: {
      summary: 'Explore foundational Computer Science and Operating Systems paradigms implemented inside NOVA.',
      subsections: [
        {
          heading: 'Multi-Core CPU Scheduling',
          body: 'NOVA implements Preemptive Round Robin with configurable time quanta (100ms default), Priority Scheduling with aging to prevent starvation, Shortest Job First (SJF), and First-Come-First-Served (FCFS). Context switches save CPU registers, increment switch telemetry, and recalculate process burst times.'
        },
        {
          heading: '4KB Paged Virtual Memory',
          body: 'RAM is split into 524,288 discrete 4KB physical frames. Each process has its own page table. Memory accesses resolve virtual addresses into physical frame numbers. Unallocated pages trigger simulated page faults that read from virtual backing store with LRU/Clock frame replacement.'
        },
        {
          heading: 'Disk Elevator & Scheduling',
          body: 'The virtual storage controller features 256 tracks. When file reads or writes occur, I/O requests queue in the disk scheduler, which services them using LOOK / Elevator algorithms to minimize head sweep distance.'
        },
        {
          heading: 'Deadlock & Concurrency Prevention',
          body: "Dijkstra's Banker's Algorithm evaluates resource allocation graphs (RAG) to ensure state safety before granting resources to processes. The Concurrency Lab demonstrates race conditions, mutex locks, counting semaphores, and condition variables."
        }
      ]
    }
  },
  {
    id: 'terminal',
    title: 'Terminal & Shell Commands',
    category: 'Command Line',
    icon: Terminal,
    content: {
      summary: 'The NOVA shell (/bin/sh) supports standard POSIX-like utilities, piping, and process management.',
      subsections: [
        {
          heading: 'Process & System Utilities',
          body: 'Monitor live processes, inspect hardware metrics, or terminate rogue tasks.',
          code: `# Inspect active processes
ps aux

# Real-time resource monitor
top

# Terminate process by PID
kill -9 <PID>

# Inspect memory frames & swap
vmstat

# Network interface statistics
netstat -a`
        },
        {
          heading: 'Filesystem Navigation & Manipulation',
          body: 'Navigate the in-memory Unix Virtual File System, read and write files.',
          code: `# List directory contents with permissions
ls -la /home/nova

# Print working directory
pwd

# Read file contents
cat /home/nova/Documents/NOVA_OS_Guide.md

# Create new directory
mkdir -p /home/nova/Workspace/demo

# Remove file
rm /home/nova/Downloads/temp.txt`
        },
        {
          heading: 'Simulated Workload & Kernel Tracing',
          body: 'Spawn CPU or I/O workloads to observe scheduler behavior in real time.',
          code: `# Spawn compute-heavy matrix multiplication task
stress --cpu 4 --timeout 30s

# Inspect recent kernel events
dmesg | tail -n 20`
        }
      ]
    }
  },
  {
    id: 'desktop-env',
    title: 'Desktop Environment Guide',
    category: 'User Interface',
    icon: Layers,
    content: {
      summary: 'The NOVA Desktop provides a complete multitasking window manager inspired by modern workstation environments.',
      subsections: [
        {
          heading: 'Window Manager Controls',
          body: 'Windows can be freely moved, resized, minimized to the bottom Dock, maximized to full viewport, and closed. Focused windows automatically raise their z-index layer. Double-clicking title bars toggles maximized state.'
        },
        {
          heading: 'Application Launcher & Dock',
          body: 'Click the NOVA emblem on the bottom left or press the Super/Windows key to open the Application Launcher. Pinned dock icons show active running indicators with a subtle glowing cyan dot.'
        },
        {
          heading: 'File Associations & Trash',
          body: 'Double-clicking documents in File Manager opens them in Document Viewer or Text Editor. Images open in Image Viewer, audio in Media Player, and archives in Archive Manager. Deleted items move to /home/nova/.Trash/ and can be safely restored.'
        }
      ]
    }
  },
  {
    id: 'project-hub',
    title: "Harsh's Project Hub",
    category: 'Portfolio',
    icon: Globe,
    content: {
      summary: "Directly experience Harsh Shah's verified software projects integrated with NOVA's process engine.",
      subsections: [
        {
          heading: 'Dual Action Architecture',
          body: 'Clicking "Start Simulation" in Project Hub launches an authentic simulated process inside NOVA (with allocated memory, scheduling priority, and I/O tracking) while simultaneously opening the actual verified external repository or production deployment in your browser.'
        },
        {
          heading: 'Featured Engineering Systems',
          body: 'Includes Deepfake Detection Transformer (ViT + ELA), Full-Scale Autonomous Agent RAG Pipeline, Creative 3D Audio Visualizers, and Enterprise Microservices.'
        }
      ]
    }
  }
];

export const HelpDocsApp: React.FC = () => {
  const { openWindow } = useOsStore();
  const [selectedId, setSelectedId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const currentSection = DOC_SECTIONS.find((s) => s.id === selectedId) || DOC_SECTIONS[0];

  const filteredSections = DOC_SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-[#080C14] text-slate-200 flex flex-col md:flex-row overflow-hidden text-xs font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0F1D] flex flex-col shrink-0">
        {/* Header & Search */}
        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>NOVA OS Manual</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-xs"
            />
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = sec.id === selectedId;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedId(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="flex-1 truncate">
                  <div className="truncate">{sec.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{sec.category}</div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Footer Quick Links */}
        <div className="p-3 border-t border-white/5 bg-black/20 space-y-1.5 text-[11px]">
          <div className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Quick Actions</div>
          <button
            onClick={() => openWindow('terminal')}
            className="w-full flex items-center justify-between text-slate-400 hover:text-cyan-300 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Launch Terminal</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => openWindow('project-hub')}
            className="w-full flex items-center justify-between text-slate-400 hover:text-cyan-300 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Project Hub</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Section Header */}
        <div className="border-b border-white/5 pb-4 space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
            {currentSection.category}
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {React.createElement(currentSection.icon, { className: 'w-5 h-5 text-cyan-400' })}
            {currentSection.title}
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed pt-1">
            {currentSection.content.summary}
          </p>
        </div>

        {/* Subsections */}
        <div className="space-y-6">
          {currentSection.content.subsections.map((sub, idx) => (
            <div key={idx} className="space-y-2.5 p-4 rounded-xl bg-[#0D1424] border border-white/5">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {sub.heading}
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                {sub.body}
              </p>

              {sub.code && (
                <div className="mt-3 p-3 rounded-lg bg-[#060911] border border-white/5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  <pre className="whitespace-pre">{sub.code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
