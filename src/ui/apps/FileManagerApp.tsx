// ============================================================================
// NOVA OS — FILE MANAGER APPLICATION
// Graphical directory tree navigation, file preview, and permission inspector
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { Folder, FileText, ChevronRight, HardDrive, Trash2, Plus, Eye } from 'lucide-react';

export const FileManagerApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [currentPath, setCurrentPath] = useState('/home/nova');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const vfs = kernel.vfs;
  const user = kernel.userManager.getCurrentUser();

  const entries = vfs.listDirectory(currentPath, user) || [];

  const handleSelectEntry = (entry: any) => {
    if (entry.type === 'DIRECTORY') {
      if (entry.name === '.') return;
      if (entry.name === '..') {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        setCurrentPath(`/${parts.join('/')}`);
      } else {
        const next = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
        setCurrentPath(next);
      }
      setSelectedFile(null);
      setFileContent(null);
    } else {
      const filePath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      setSelectedFile(filePath);
      const content = vfs.readFile(filePath, user);
      setFileContent(content);
    }
  };

  const handleDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    const ok = vfs.deleteFile(target, user, kernel.clock.getTime());
    if (ok) {
      showNotification(`Deleted ${name}`, 'info');
      setTick((t) => t + 1);
      if (selectedFile === target) {
        setSelectedFile(null);
        setFileContent(null);
      }
    } else {
      showNotification(`Failed to delete ${name} (Permission Denied)`, 'error');
    }
  };

  const handleCreateFile = () => {
    const filename = prompt('Enter new file name:');
    if (!filename) return;
    const target = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    const ok = vfs.writeFile(target, 'Sample file content\n', user.uid, user.gid, 644, kernel.clock.getTime());
    if (ok) {
      showNotification(`Created file ${filename}`, 'info');
      setTick((t) => t + 1);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Address Bar & Actions */}
      <div className="p-2.5 bg-[#0D1322] border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 font-mono text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-white/5">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{currentPath}</span>
        </div>

        <button
          onClick={handleCreateFile}
          className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New File
        </button>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Directory Listing Table */}
        <div className="md:col-span-8 overflow-y-auto p-2 border-r border-white/5">
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                <th className="pb-1.5 pl-2">NAME</th>
                <th className="pb-1.5">PERMISSIONS</th>
                <th className="pb-1.5">SIZE</th>
                <th className="pb-1.5">OWNER</th>
                <th className="pb-1.5 pr-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {entries.map((item) => (
                <tr
                  key={item.name}
                  onClick={() => handleSelectEntry(item)}
                  className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                    selectedFile?.endsWith(item.name) ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <td className="py-2 pl-2 flex items-center gap-2">
                    {item.type === 'DIRECTORY' ? (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-slate-200 font-medium truncate max-w-[160px]">{item.name}</span>
                  </td>
                  <td className="py-2 text-slate-400 text-[10px]">{item.permissions}</td>
                  <td className="py-2 text-slate-400">{item.size} B</td>
                  <td className="py-2 text-slate-400">{item.uid === 0 ? 'root' : 'nova'}</td>
                  <td className="py-2 pr-2 text-right">
                    {item.name !== '.' && item.name !== '..' && (
                      <button
                        onClick={(e) => handleDelete(item.name, e)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side: File Preview Pane */}
        <div className="md:col-span-4 p-3 overflow-y-auto bg-[#090D17] flex flex-col space-y-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            File Preview
          </span>

          {selectedFile ? (
            <div className="flex-1 flex flex-col space-y-1.5">
              <div className="font-mono text-[10px] text-cyan-400 truncate">{selectedFile}</div>
              <pre className="flex-1 p-2 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-auto">
                {fileContent || '(Empty file or binary device)'}
              </pre>
            </div>
          ) : (
            <div className="text-slate-500 py-12 text-center">
              Select a file to inspect its virtual contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
