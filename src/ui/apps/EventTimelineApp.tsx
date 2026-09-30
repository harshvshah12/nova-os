// ============================================================================
// NOVA OS — EVENT TIMELINE & AUDIT LOG APPLICATION
// System event stream with category filtering, search, and educational explanations
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import type { EventCategory, KernelEvent } from '../../simulation/types';
import { Clock, Filter, Search, Info } from 'lucide-react';

export const EventTimelineApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<KernelEvent | null>(null);

  const events = kernel.eventBus.getHistory(
    selectedCategory === 'ALL' ? undefined : (selectedCategory as EventCategory)
  );

  const filtered = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.message.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      String(e.pid).includes(q)
    );
  }).reverse(); // Most recent first

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Filter Bar */}
      <div className="p-2.5 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, PIDs, syscalls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-white/10 text-slate-200 font-mono text-[11px] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {['ALL', 'process', 'scheduler', 'memory', 'disk', 'deadlock'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-900 font-bold'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Event List */}
        <div className="md:col-span-7 overflow-y-auto p-2 border-r border-white/5 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-slate-500 py-12 text-center font-mono">No matching system events found</div>
          ) : (
            filtered.map((ev) => {
              const isSelected = selectedEvent?.id === ev.id;
              const typeColor =
                ev.type.includes('FAULT') || ev.type.includes('DEADLOCK')
                  ? 'text-amber-400'
                  : ev.type.includes('CREATE') || ev.type.includes('WAKE')
                  ? 'text-emerald-400'
                  : ev.type.includes('TERMINATE') || ev.type.includes('EVICT')
                  ? 'text-red-400'
                  : 'text-cyan-400';

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-2 rounded border cursor-pointer transition-colors text-[11px] font-mono flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-slate-100'
                      : 'bg-[#090D17] border-white/5 text-slate-300 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${typeColor}`}>{ev.type}</span>
                      <span className="text-[10px] text-slate-500 font-sans">[{ev.source}]</span>
                    </div>
                    <div className="text-slate-300 truncate">{ev.message}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">
                    {(ev.timestamp / 1000).toFixed(2)}s
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Event Details & Explanation Drawer */}
        <div className="md:col-span-5 p-3 overflow-y-auto bg-[#090D17] flex flex-col space-y-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Event Details & OS Explanation
          </span>

          {selectedEvent ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded bg-slate-900 border border-white/5 space-y-1 font-mono text-[11px]">
                <div><span className="text-slate-400">Timestamp:</span> <span className="text-cyan-400 font-bold">{(selectedEvent.timestamp / 1000).toFixed(3)}s</span></div>
                <div><span className="text-slate-400">Event Type:</span> <span className="text-slate-200 font-bold">{selectedEvent.type}</span></div>
                <div><span className="text-slate-400">Subsystem:</span> <span className="text-slate-300">{selectedEvent.source}</span></div>
                {selectedEvent.pid && <div><span className="text-slate-400">PID:</span> <span className="text-emerald-400">{selectedEvent.pid}</span></div>}
              </div>

              {/* Explanation Card */}
              {selectedEvent.explanation && (
                <div className="p-3 rounded bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                  <span className="text-cyan-400 font-semibold text-xs block">Operating System Analysis</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedEvent.explanation}
                  </p>
                </div>
              )}

              {/* Metadata JSON */}
              {selectedEvent.metadata && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">Metadata Payload</span>
                  <pre className="p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 py-12 text-center">
              Select an event to inspect its causal OS explanation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
