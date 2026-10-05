// ============================================================================
// NOVA OS — DOCUMENT & PDF VIEWER
// Document reader with table of contents outline, zoom scaling, text search,
// and VFS integration with disk I/O telemetry
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  BookOpen,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Download,
  FolderOpen,
} from 'lucide-react';

export const DocumentViewerApp: React.FC<{ customData?: { path?: string } }> = ({ customData }) => {
  const { kernel } = useOsStore();
  const [currentPath, setCurrentPath] = useState<string>(
    customData?.path || '/home/nova/Documents/NOVA_OS_Guide.md'
  );
  const [content, setContent] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    // Read document from VFS
    const res = kernel.vfs.readFile(
      currentPath,
      { uid: 1000, gid: 1000, isRoot: false }
    );
    if (res !== null) {
      setContent(res);
    } else {
      setContent(`# Document Not Found\n\nCould not locate document at \`${currentPath}\`.`);
    }
  }, [currentPath, kernel]);

  const sections = content
    .split(/\n(?=# )/)
    .map((s, idx) => ({ id: idx + 1, text: s }));

  const currentSection = sections[page - 1] || sections[0] || { id: 1, text: content };

  return (
    <div className="h-full w-full flex flex-col bg-[#0A0E18] text-xs font-sans select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-2 bg-[#0E1524] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200 truncate max-w-[220px]">
            {currentPath.split('/').pop()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({content.length} bytes)
          </span>
        </div>

        {/* Navigation & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/80 rounded px-1.5 py-0.5 border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 hover:text-white disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-slate-300">
              {page} / {Math.max(1, sections.length)}
            </span>
            <button
              onClick={() => setPage(Math.min(sections.length, page + 1))}
              disabled={page >= sections.length}
              className="p-1 hover:text-white disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 rounded px-1.5 py-0.5 border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => setZoom(Math.max(70, zoom - 10))}
              className="p-1 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-slate-300">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in doc..."
              className="pl-6 pr-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-200 text-[10px] w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Outline Sidebar */}
        <div className="w-48 bg-[#080C14] border-r border-white/5 p-2 overflow-y-auto space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Contents
          </div>
          {sections.map((s) => {
            const firstLine = s.text.split('\n')[0].replace(/^#+\s*/, '') || `Section ${s.id}`;
            const isSelected = page === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setPage(s.id)}
                className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {firstLine}
              </button>
            );
          })}
        </div>

        {/* Rendered Document Page */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#070A12] flex justify-center">
          <div
            className="w-full max-w-2xl bg-[#0D1322] border border-white/10 rounded-lg p-8 shadow-2xl transition-all duration-150"
            style={{ fontSize: `${(zoom / 100) * 12}px` }}
          >
            <pre className="font-sans whitespace-pre-wrap text-slate-200 leading-relaxed">
              {currentSection.text}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
