// ============================================================================
// NOVA OS — TEXT EDITOR APPLICATION (nano-style GUI)
// Open, edit, and save text files directly to the simulated Virtual File System
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { Save, FolderOpen, FileText } from 'lucide-react';

export const TextEditorApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [filePath, setFilePath] = useState('/home/nova/notes.txt');
  const [content, setContent] = useState(
    'NOVA OS Virtual Text Document\nEdit this file and click Save to persist into the simulated VFS.\n'
  );

  const handleSave = () => {
    const user = kernel.userManager.getCurrentUser();
    const ok = kernel.vfs.writeFile(
      filePath,
      content,
      user.uid,
      user.gid,
      644,
      kernel.clock.getTime()
    );
    if (ok) {
      showNotification(`Saved to ${filePath}`, 'info');
    } else {
      showNotification(`Failed to save to ${filePath}`, 'error');
    }
  };

  const handleLoad = () => {
    const user = kernel.userManager.getCurrentUser();
    const data = kernel.vfs.readFile(filePath, user);
    if (data !== null) {
      setContent(data);
      showNotification(`Loaded ${filePath}`, 'info');
    } else {
      showNotification(`File not found: ${filePath}`, 'error');
    }
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Top Toolbar */}
      <div className="p-2.5 bg-[#0D1322] border-b border-white/5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-slate-400 font-medium">Path:</span>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-white/10 text-cyan-400 font-mono text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLoad}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Open
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save File
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-2 bg-[#090D17] relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="w-full h-full p-2 bg-transparent text-slate-200 font-mono text-[12px] leading-relaxed resize-none outline-none border-none select-text"
        />
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 bg-[#0D1322] border-t border-white/5 flex justify-between items-center font-mono text-[10px] text-slate-400">
        <span>Encoding: UTF-8 (Unix LF)</span>
        <span>{lineCount} lines, {charCount} characters</span>
      </div>
    </div>
  );
};
