// ============================================================================
// NOVA OS — NOTES & MEMO ACCESSORY APPLICATION
// Quick desktop notes, synced with VFS at /home/nova/Documents/notes.txt
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { 
  FileText, 
  Save, 
  Trash2, 
  Plus, 
  Check, 
  Clock, 
  Palette, 
  HardDrive 
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  path: string;
  content: string;
  updatedAt: string;
}

const DEFAULT_NOTE_PATH = '/home/nova/Documents/notes.txt';

export const NotesApp: React.FC<{ customData?: any }> = ({ customData }) => {
  const { kernel, showNotification } = useOsStore();
  const [activePath, setActivePath] = useState<string>(customData?.path || DEFAULT_NOTE_PATH);
  const [content, setContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [theme, setTheme] = useState<'obsidian' | 'amber' | 'emerald'>('obsidian');

  // Load active note on mount or path change
  useEffect(() => {
    const user = kernel.userManager.getCurrentUser();
    const existing = kernel.vfs.readFile(activePath, user);
    if (existing !== null) {
      setContent(existing);
      setIsSaved(true);
    } else {
      const initial = `# Quick Notes — NOVA OS\n\n- Multi-core CPU scheduling: Round Robin (100ms quantum)\n- 4KB paged virtual memory: 524,288 frames pool\n- Disk block device: 256 tracks with LOOK elevator\n- Unix VFS: in-memory hierarchical directory structure\n`;
      setContent(initial);
      kernel.vfs.writeFile(
        activePath,
        initial,
        user.uid,
        user.gid,
        644,
        kernel.clock.getTime()
      );
      setIsSaved(true);
    }
  }, [activePath, kernel]);

  const handleSave = () => {
    const user = kernel.userManager.getCurrentUser();
    const ok = kernel.vfs.writeFile(
      activePath,
      content,
      user.uid,
      user.gid,
      644,
      kernel.clock.getTime()
    );

    if (ok) {
      setIsSaved(true);
      showNotification(`Saved note to ${activePath}`, 'info');
      // Trigger a simulated disk write seek
      kernel.disk.queueRequest(1, 12, 0, 'WRITE', kernel.clock.getTime());
    } else {
      showNotification(`Failed to save to ${activePath}`, 'error');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const themeClasses = {
    obsidian: 'bg-[#080C14] text-slate-200 border-white/5 focus:border-cyan-500/40',
    amber: 'bg-[#141008] text-amber-100 border-amber-500/10 focus:border-amber-500/40',
    emerald: 'bg-[#08140E] text-emerald-100 border-emerald-500/10 focus:border-emerald-500/40',
  }[theme];

  return (
    <div className={`h-full w-full flex flex-col font-sans text-xs transition-colors duration-200 ${themeClasses}`}>
      {/* Top Controls Bar */}
      <div className="p-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-slate-300 truncate max-w-[200px]">{activePath}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
            isSaved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isSaved ? 'Saved' : 'Unsaved'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Switcher */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 mr-1">
            <button
              onClick={() => setTheme('obsidian')}
              className={`w-4 h-4 rounded-full bg-cyan-600 ${theme === 'obsidian' ? 'ring-2 ring-white' : 'opacity-50'}`}
              title="Obsidian Dark"
            />
            <button
              onClick={() => setTheme('amber')}
              className={`w-4 h-4 rounded-full bg-amber-600 ${theme === 'amber' ? 'ring-2 ring-white' : 'opacity-50'}`}
              title="Warm Amber"
            />
            <button
              onClick={() => setTheme('emerald')}
              className={`w-4 h-4 rounded-full bg-emerald-600 ${theme === 'emerald' ? 'ring-2 ring-white' : 'opacity-50'}`}
              title="Emerald Matrix"
            />
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Note Textarea Area */}
      <div className="flex-1 p-4 relative">
        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Type quick thoughts, kernel notes, command snippets..."
          spellCheck={false}
          className="w-full h-full bg-transparent resize-none outline-none font-mono text-[12px] leading-relaxed text-inherit select-text"
        />
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <HardDrive className="w-3 h-3 text-slate-500" />
          <span>VFS Document Store</span>
        </span>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
};
