// ============================================================================
// NOVA OS — HARSH'S PROJECT HUB APPLICATION
// Native showcase of Harsh Shah's engineering portfolio with live simulated processes
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
  Tag,
  CheckCircle,
  Eye,
  X,
  Search,
} from 'lucide-react';

export const ProjectHubApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [, setTick] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<{ title: string; filename: string; content: string } | null>(null);
  const [lastLaunch, setLastLaunch] = useState<{ projectId: string; pid: number } | null>(null);
  const [launchBlocked, setLaunchBlocked] = useState(false);

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
    // Check if already running
    const existing = activeProcesses.find((p) => p.getName() === project.processName);

    // Reuse an already-running simulated process instead of duplicating it.
    // The actual project must still open on every Start Simulation click.
    const proc = existing ?? kernel.processManager.createProcess(
      project.processName,
      project.processName,
      project.workloadType,
      {
        priority: project.priority,
        timestamp: kernel.clock.getTime(),
        virtualPagesCount: Math.ceil((project.memoryMb * 1024) / 4),
      }
    );
    const targetUrl = (project as PortfolioProject & { launchUrl?: string }).launchUrl || project.githubUrl;
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setLastLaunch({ projectId: project.id, pid: proc.getPid() });
    setLaunchBlocked(opened === null);
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
              Operating Systems, TinyML, Computer Vision & Scalable Architectures
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

                {/* Benchmark Metrics */}
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
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Launch / Running Action */}
                  {isRunning ? (
                    <div className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3 text-cyan-400 animate-pulse" /> PID {runningProc.getPid()} (RUNNING)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartSimulation(project)}
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Play className="w-3 h-3" /> Start Simulation
                    </button>
                  )}
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
