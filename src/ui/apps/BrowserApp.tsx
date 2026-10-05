// ============================================================================
// NOVA OS — BROWSER APPLICATION (NOVA BROWSER)
// Multi-tab sandboxed web browser with real iframe embedding, network packet
// telemetry, DNS lookup simulation, downloads integration, and bookmarks
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useOsStore } from '../../store/osStore';
import { PORTFOLIO_PROJECTS } from '../../simulation/projects/ProjectsData';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  Lock,
  Search,
  ExternalLink,
  Bookmark,
  ShieldCheck,
  Download,
  Wifi,
  History,
  FileText,
} from 'lucide-react';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  inputUrl: string;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  favicon?: string;
  rendererPid?: number;
}

const DEFAULT_BOOKMARKS = [
  { title: "Harsh's Projects", url: 'nova://projects' },
  { title: 'Dynamic Pricing', url: 'https://rentaroom-orpin.vercel.app' },
  { title: 'VegaPod Hyperloop', url: 'https://vegapod-hyperloop.vercel.app' },
  { title: 'Musically Audio', url: 'https://musically-iota.vercel.app' },
  { title: 'Fraud Sentinel', url: 'https://fraud-detect-ten.vercel.app' },
  { title: 'PenFight Physics', url: 'https://penfight-blue.vercel.app' },
  { title: 'NOVA Docs', url: 'nova://docs' },
  { title: 'Search (DuckDuckGo)', url: 'https://duckduckgo.com' },
];

export const BrowserApp: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { kernel, showNotification } = useOsStore();
  const [, setTick] = useState(0);

  const initialTab: BrowserTab = {
    id: 'tab-1',
    title: 'NOVA Start Portal',
    url: 'nova://home',
    inputUrl: 'nova://home',
    isLoading: false,
    history: ['nova://home'],
    historyIndex: 0,
  };

  const [tabs, setTabs] = useState<BrowserTab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [networkLog, setNetworkLog] = useState<{ time: string; event: string; detail: string }[]>([]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(handle);
  }, []);

  // Simulate network packet stream on navigation
  const triggerNetworkSimulation = (targetUrl: string, tabId: string) => {
    const time = kernel.clock.getTime();
    const formatted = kernel.clock.getFormattedTime();

    // 1. DNS Lookup Event
    let domain = 'localhost';
    try {
      if (targetUrl.startsWith('http')) {
        domain = new URL(targetUrl).hostname;
      } else {
        domain = targetUrl.replace('nova://', '') + '.local';
      }
    } catch {
      domain = targetUrl;
    }

    kernel.eventBus.emit(
      'SOCKET_OPEN',
      'network',
      'nova-browser',
      `DNS resolving ${domain} -> 192.168.1.1`,
      time,
      { metadata: { targetUrl, domain } }
    );

    // 2. Transmit TCP packets via virtual network adapter
    kernel.net.sendPacket('TCP', '192.168.1.1', `GET ${targetUrl} HTTP/1.1`, time, 54321, 80);

    // 3. HTTP Request event
    setTimeout(() => {
      kernel.eventBus.emit(
        'NETWORK_PACKET_SEND',
        'network',
        'nova-browser',
        `HTTP GET ${targetUrl} (200 OK)`,
        kernel.clock.getTime(),
        { metadata: { targetUrl, bytes: 4096 } }
      );
      kernel.net.receivePacket('TCP', '192.168.1.1', 'HTTP/1.1 200 OK', kernel.clock.getTime());
    }, 150);

    setNetworkLog((prev) => [
      { time: formatted, event: 'DNS_RESOLVE', detail: `${domain} via 1.1.1.1` },
      { time: formatted, event: 'TCP_SYN_ACK', detail: `Connected to ${domain}:443` },
      { time: formatted, event: 'HTTP_GET_200', detail: `Payload 4.2 KB received` },
      ...prev.slice(0, 15),
    ]);
  };

  const handleNavigate = (newUrl: string) => {
    let resolved = newUrl.trim();
    if (!resolved.startsWith('http://') && !resolved.startsWith('https://') && !resolved.startsWith('nova://')) {
      if (resolved.includes('.') && !resolved.includes(' ')) {
        resolved = `https://${resolved}`;
      } else {
        resolved = `https://duckduckgo.com/?q=${encodeURIComponent(resolved)}`;
      }
    }

    // Trigger simulated network activity in kernel
    triggerNetworkSimulation(resolved, activeTab.id);

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(resolved);
        return {
          ...t,
          url: resolved,
          inputUrl: resolved,
          isLoading: true,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          title: resolved.startsWith('nova://')
            ? resolved.replace('nova://', 'NOVA: ').toUpperCase()
            : resolved.replace(/^https?:\/\//, '').split('/')[0],
        };
      })
    );

    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, isLoading: false } : t))
      );
    }, 600);
  };

  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newRenderer = kernel.processManager.createProcess(
      `browser-renderer-${tabs.length + 1}`,
      `/nova-browser --type=renderer`,
      'CPU_BOUND',
      { virtualPagesCount: 16, priority: 30, timestamp: kernel.clock.getTime() }
    );

    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: 'nova://home',
      inputUrl: 'nova://home',
      isLoading: false,
      history: ['nova://home'],
      historyIndex: 0,
      rendererPid: newRenderer.getPid(),
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Keep at least one tab open
      return;
    }
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose?.rendererPid) {
      kernel.processManager.terminateProcess(tabToClose.rendererPid, 0, kernel.clock.getTime());
    }

    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIdx = activeTab.historyIndex - 1;
      const target = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id
            ? { ...t, historyIndex: newIdx, url: target, inputUrl: target }
            : t
        )
      );
      triggerNetworkSimulation(target, activeTab.id);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIdx = activeTab.historyIndex + 1;
      const target = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id
            ? { ...t, historyIndex: newIdx, url: target, inputUrl: target }
            : t
        )
      );
      triggerNetworkSimulation(target, activeTab.id);
    }
  };

  const handleReload = () => {
    triggerNetworkSimulation(activeTab.url, activeTab.id);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isLoading: true } : t))
    );
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, isLoading: false } : t))
      );
    }, 400);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#070B14] text-xs font-sans select-none overflow-hidden">
      {/* 1. Browser Tab Strip */}
      <div className="bg-[#0A101D] border-b border-white/5 flex items-center px-2 pt-1.5 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg max-w-[200px] cursor-pointer transition-all duration-150 border-t border-x ${
                isActive
                  ? 'bg-[#0E1729] border-white/10 text-cyan-300 font-semibold shadow-md'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate text-[11px] flex-1">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={handleNewTab}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors shrink-0"
          title="Open New Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Navigation Bar & URL Input */}
      <div className="p-2 bg-[#0E1729] border-b border-white/10 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={activeTab.historyIndex <= 0}
            className="p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 disabled:opacity-30 text-slate-300"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 disabled:opacity-30 text-slate-300"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReload}
            className="p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 text-slate-300"
            title="Reload Page"
          >
            <RotateCw className={`w-3.5 h-3.5 ${activeTab.isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => handleNavigate('nova://home')}
            className="p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 text-slate-300"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(activeTab.inputUrl);
          }}
          className="flex-1 flex items-center gap-2 bg-[#080C14] border border-white/10 rounded-lg px-2.5 py-1 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all"
        >
          {activeTab.url.startsWith('https://') ? (
            <span title="Secure HTTPS Connection">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </span>
          ) : activeTab.url.startsWith('nova://') ? (
            <span title="Internal NOVA Intranet">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </span>
          ) : (
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}

          <input
            type="text"
            value={activeTab.inputUrl}
            onChange={(e) =>
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === activeTab.id ? { ...t, inputUrl: e.target.value } : t
                )
              )
            }
            placeholder="Search web or enter address (e.g. nova://projects, duckduckgo.com)..."
            className="w-full bg-transparent text-slate-200 font-mono text-[11px] outline-none"
          />

          {activeTab.url.startsWith('http') && (
            <a
              href={activeTab.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 p-0.5"
              title="Open natively in host browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </form>
      </div>

      {/* 3. Bookmarks Toolbar */}
      {showBookmarks && (
        <div className="px-2.5 py-1 bg-[#090F1C] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-[10px] font-medium">
          <Bookmark className="w-3 h-3 text-cyan-400 shrink-0 mr-1" />
          {DEFAULT_BOOKMARKS.map((b, i) => (
            <button
              key={i}
              onClick={() => handleNavigate(b.url)}
              className="px-2 py-0.5 rounded bg-slate-900/60 hover:bg-white/10 text-slate-300 hover:text-white transition-colors truncate max-w-[130px]"
            >
              {b.title}
            </button>
          ))}
        </div>
      )}

      {/* Loading Progress Bar */}
      {activeTab.isLoading && (
        <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse w-full" />
        </div>
      )}

      {/* 4. Page Viewport */}
      <div className="flex-1 overflow-auto relative bg-[#060911]">
        {/* NOVA Internal Home Portal */}
        {activeTab.url === 'nova://home' && (
          <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center space-y-6 text-center mt-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Globe className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">NOVA Browser</h1>
              <p className="text-xs text-slate-400 mt-1">
                Virtual Operating System Intranet & Verified Engineering Portal
              </p>
            </div>

            {/* Quick Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(activeTab.inputUrl);
              }}
              className="w-full max-w-lg flex items-center gap-2 bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2 shadow-xl"
            >
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                placeholder="Search web or enter project URL..."
                value={activeTab.inputUrl === 'nova://home' ? '' : activeTab.inputUrl}
                onChange={(e) =>
                  setTabs((prev) =>
                    prev.map((t) =>
                      t.id === activeTab.id ? { ...t, inputUrl: e.target.value } : t
                    )
                  )
                }
                className="w-full bg-transparent text-slate-200 outline-none text-xs"
              />
            </form>

            {/* Quick Portals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-left mt-2">
              {DEFAULT_BOOKMARKS.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNavigate(item.url)}
                  className="p-3 rounded-xl bg-[#0D1525] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-1">{item.url}</div>
                </div>
              ))}
            </div>

            {/* Network Packet Telemetry Stream */}
            <div className="w-full p-3 rounded-xl bg-[#0B101D] border border-white/5 text-left font-mono text-[10px] space-y-1">
              <div className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                Live Network Adapter Activity (eth0: 192.168.1.10)
              </div>
              {networkLog.length === 0 ? (
                <div className="text-slate-600">No network packets sent yet. Navigate to trigger socket requests.</div>
              ) : (
                networkLog.slice(0, 4).map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <span className="text-cyan-500">[{log.time}]</span>
                    <span className="text-emerald-400 font-bold">{log.event}</span>
                    <span className="text-slate-400 truncate">{log.detail}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NOVA Documentation Page */}
        {activeTab.url === 'nova://docs' && (
          <div className="p-6 max-w-3xl mx-auto space-y-4 text-slate-200">
            <h1 className="text-lg font-bold text-cyan-400">NOVA OS Intranet Documentation</h1>
            <p className="text-xs leading-relaxed text-slate-300">
              Welcome to the local network intranet. The virtual browser communicates through the simulated virtual network adapter (<code className="text-cyan-300">eth0</code>) configured with IP <code className="text-cyan-300">192.168.1.10</code>.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10 space-y-2">
              <div className="font-semibold text-cyan-300">Supported Network Protocols:</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                <li><strong>HTTP/1.1 & HTTPS:</strong> Webpage fetches through simulated packet frames</li>
                <li><strong>DNS (Port 53):</strong> Resolves domain names to gateway addresses</li>
                <li><strong>ICMP Echo:</strong> Network latency and packet round-trip measurements</li>
              </ul>
            </div>
          </div>
        )}

        {/* Projects Quick View */}
        {activeTab.url === 'nova://projects' && (
          <div className="p-4 space-y-3">
            <div className="font-bold text-slate-200 text-sm">Verified Portfolio Deployments</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PORTFOLIO_PROJECTS.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleNavigate(proj.launchUrl)}
                  className="p-3 rounded-lg bg-[#0C1322] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all"
                >
                  <div className="font-bold text-slate-100 flex items-center justify-between">
                    <span>{proj.title}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{proj.launchType}</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-0.5">{proj.tagline}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">{proj.launchUrl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Embedded External Web View */}
        {activeTab.url.startsWith('http') && (
          <div className="w-full h-full flex flex-col">
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              title={activeTab.title}
              className="w-full flex-1 border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
};
