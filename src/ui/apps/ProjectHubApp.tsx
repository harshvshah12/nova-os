// ============================================================================
// NOVA OS — HARSH'S PROJECT HUB APPLICATION
// Native showcase of Harsh Shah's engineering portfolio with live simulated processes
// and verified real-world deployments / repositories.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../../simulation/projects/ProjectsData';
import {
  FolderGit2,
  Cpu,
  ExternalLink,
  Play,
  FileCode,
  CheckCircle,
  Eye,
  X,
  Search,
  Globe,
  AlertCircle,
  Activity,
  Terminal,
} from 'lucide-react';

export const ProjectHubApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [, setTick] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<{ title: string; filename: string; content: string } | null>(null);
  const [lastLaunch, setLastLaunch] = useState<{
    project: PortfolioProject;
    pid: number;
    wasReused: boolean;
  } | null>(null);
  const [blockedProject, setBlockedProject] = useState<PortfolioProject | null>(null);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(handle);
  }, []);

  const activeProcesses = kernel.processManager.getActiveProcesses();

  const categories = [
    'ALL',
    'AI / Computer Vision',
    'Machine Learning',
    'Embedded / IoT',
    'Algorithms',
    'Systems / Web',
  ];

  const filteredProjects = PORTFOLIO_PROJECTS.filter((proj) => {
    const matchesCategory = selectedCategory === 'ALL' || proj.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.stack.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      proj.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartSimulation = (project: PortfolioProject) => {
    // 1. Check if already running in NOVA simulation
    const existing = activeProcesses.find((p) => p.getName() === project.processName);
    const wasReused = existing !== undefined;

    // 2. Start or reuse the actual simulated process
    const proc =
      existing ??
      kernel.processManager.createProcess(
        project.processName,
        project.processName,
        project.workloadType,
        {
          priority: project.priority,
          timestamp: kernel.clock.getTime(),
          virtualPagesCount: Math.ceil((project.memoryMb * 1024) / 4),
        }
      );

    // 3. Open the actual project externally in a new tab
    const targetUrl = project.launchUrl || project.githubUrl;
    let opened: Window | null = null;
    try {
      opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      opened = null;
    }

    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      // Browser popup blocked
      setBlockedProject(project);
    } else {
      setBlockedProject(null);
    }

    setLastLaunch({
      project,
      pid: proc.getPid(),
      wasReused,
    });

    setTick((t) => t + 1);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans select-none overflow-hidden">
      {/* Top Header & Search Filter */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <FolderGit2 className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Harsh's Project Hub
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {PORTFOLIO_PROJECTS.length} Systems
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Verified Production Repositories, Live Deployments & Deterministic Workload Simulations
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stack, tech, project..."
              className="pl-7 pr-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-200 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Execution Boundary Telemetry Banner */}
      <div className="px-3 py-1.5 bg-[#090D17] border-b border-white/5 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            <strong className="text-slate-200">Simulation Boundary:</strong> Internal NOVA processes run on virtual CPU cores & 4KB paged RAM. External projects run natively in browser.
          </span>
        </div>
        {lastLaunch && (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {lastLaunch.wasReused ? 'Reused' : 'Started'} PID {lastLaunch.pid} ({lastLaunch.project.processName}) → Opened {lastLaunch.project.launchType === 'live' ? 'Live Deployment' : 'GitHub'}
            </span>
          </div>
        )}
      </div>

      {/* Popup Blocked Notification Fallback */}
      {blockedProject && (
        <div className="px-3 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Pop-up was blocked by your browser. Simulated process <strong className="font-mono text-white">PID {activeProcesses.find(p => p.getName() === blockedProject.processName)?.getPid() ?? 'OK'}</strong> is running! Click to open directly:
            </span>
            <a
              href={blockedProject.launchUrl}
              target="_blank"
              rel="noreferrer"
              className="underline text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Open {blockedProject.title} ({blockedProject.launchType === 'live' ? 'Live Deployment' : 'GitHub'})
            </a>
          </div>
          <button
            onClick={() => setBlockedProject(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="px-3 py-2 bg-[#0A0F1A] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProjects.map((project) => {
          const runningProc = activeProcesses.find((p) => p.getName() === project.processName);
          const isRunning = runningProc !== undefined;
          const pcb = runningProc?.getPcb();

          return (
            <div
              key={project.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all duration-200 ${
                isRunning
                  ? 'bg-[#0E1A2C] border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-lg'
                  : 'bg-[#0F1626]/70 border-white/5 hover:border-white/15'
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {project.title}
                      {project.launchType === 'live' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> LIVE DEMO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1">
                          <FolderGit2 className="w-2.5 h-2.5" /> REPOSITORY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
                      {project.tagline}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/10 shrink-0">
                    {project.category}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-[11px] text-slate-300/80 leading-relaxed mb-3">
                  {project.summary}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#090D17] border border-white/5 mb-3 font-mono text-[10px]">
                  {project.metrics.map((m, i) => (
                    <div key={i} className="text-center">
                      <div className="text-slate-400 text-[9px] truncate">{m.label}</div>
                      <div className="text-emerald-400 font-bold">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Chips */}
                <div className="flex items-center gap-1 flex-wrap mb-3">
                  {project.stack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 text-[10px]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Live Simulation Telemetry Box if Process is Running */}
                {isRunning && pcb && (
                  <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30 mb-3 font-mono text-[10px] flex items-center justify-between text-cyan-300">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PID {pcb.pid} ({pcb.state})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Mem: {Math.round(pcb.memoryUsageBytes / (1024 * 1024))} MB</span>
                      <span>Frames: {pcb.allocatedFrames.length}</span>
                      <span className="text-emerald-400">Cycles: {pcb.cpuTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Simulated Specs & Actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" /> {project.processName}
                  </span>
                  <span>{project.memoryMb}MB RAM</span>
                  <span className="text-purple-400">{project.workloadType}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* File Inspector Button */}
                  <button
                    onClick={() => {
                      const firstFile = project.files[0];
                      if (firstFile) {
                        setViewingFile({
                          title: project.title,
                          filename: firstFile.name,
                          content: firstFile.content,
                        });
                      }
                    }}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Inspect Virtual Files"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </button>

                  {/* External GitHub Link */}
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Open GitHub Repository"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                  </a>

                  {/* Combined Action: Start Simulation & Launch */}
                  <button
                    onClick={() => handleStartSimulation(project)}
                    className={`px-3 py-1.5 rounded font-mono text-[10px] flex items-center gap-1.5 font-semibold transition-all duration-200 ${
                      isRunning
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                    }`}
                    title={
                      isRunning
                        ? `Reuse running PID ${runningProc.getPid()} and reopen ${project.launchType === 'live' ? 'live site' : 'repository'}`
                        : `Start NOVA process and open ${project.launchType === 'live' ? 'live site' : 'repository'}`
                    }
                  >
                    {isRunning ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>PID {runningProc.getPid()} (Reopen {project.launchType === 'live' ? 'Live' : 'Repo'})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Simulation & Launch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code / Markdown File Viewer Modal */}
      {viewingFile && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D1322] border border-white/10 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-100 text-xs">{viewingFile.title}</div>
                <div className="text-[10px] font-mono text-cyan-400">{viewingFile.filename}</div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex-1 overflow-auto">
              <pre className="p-3 rounded bg-[#080C14] border border-white/5 font-mono text-[11px] text-slate-200 whitespace-pre-wrap">
                {viewingFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
