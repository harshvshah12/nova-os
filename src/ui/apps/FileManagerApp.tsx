// ============================================================================
// NOVA OS — FILE MANAGER APPLICATION
// Full-featured desktop file explorer with MIME associations, Trash, Places sidebar
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  HardDrive, 
  Trash2, 
  Plus, 
  Eye, 
  Search, 
  Home, 
  Monitor, 
  Download, 
  Music, 
  Image, 
  Video, 
  Briefcase, 
  Usb, 
  RefreshCw,
  FolderPlus,
  ArrowUp,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { getAppForFile, APPLICATION_REGISTRY } from '../../simulation/applications/ApplicationRegistry';

interface PlaceItem {
  name: string;
  path: string;
  icon: any;
  color: string;
}

const PLACES: PlaceItem[] = [
  { name: 'Home', path: '/home/nova', icon: Home, color: 'text-cyan-400' },
  { name: 'Desktop', path: '/home/nova/Desktop', icon: Monitor, color: 'text-blue-400' },
  { name: 'Documents', path: '/home/nova/Documents', icon: FileText, color: 'text-amber-400' },
  { name: 'Downloads', path: '/home/nova/Downloads', icon: Download, color: 'text-emerald-400' },
  { name: 'Pictures', path: '/home/nova/Pictures', icon: Image, color: 'text-rose-400' },
  { name: 'Music', path: '/home/nova/Music', icon: Music, color: 'text-violet-400' },
  { name: 'Videos', path: '/home/nova/Videos', icon: Video, color: 'text-pink-400' },
  { name: 'Workspace', path: '/home/nova/Workspace', icon: Briefcase, color: 'text-sky-400' },
  { name: 'Trash', path: '/home/nova/.Trash', icon: Trash2, color: 'text-red-400' },
  { name: 'USB Drive', path: '/mnt/usb', icon: Usb, color: 'text-teal-400' },
];

export const FileManagerApp: React.FC = () => {
  const { kernel, showNotification, openFile } = useOsStore();
  const [currentPath, setCurrentPath] = useState('/home/nova');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setTick] = useState(0);

  const vfs = kernel.vfs;
  const user = kernel.userManager.getCurrentUser();

  const isTrashFolder = currentPath === '/home/nova/.Trash';

  // Load directory items
  const entries = vfs.listDirectory(currentPath, user) || [];

  const filteredEntries = entries.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleSelectEntry = (entry: any) => {
    if (entry.type === 'DIRECTORY') {
      if (entry.name === '.') return;
      if (entry.name === '..') {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        navigateTo(`/${parts.join('/')}` || '/');
      } else {
        const next = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
        navigateTo(next);
      }
    } else {
      const filePath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      setSelectedFile(filePath);
      const content = vfs.readFile(filePath, user);
      setFileContent(content);
    }
  };

  const handleDoubleClickEntry = (entry: any) => {
    if (entry.type === 'DIRECTORY') {
      handleSelectEntry(entry);
    } else {
      const filePath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      openFile(filePath);
    }
  };

  const handleTrashFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    const ok = vfs.trashFile(target);
    if (ok) {
      showNotification(`Moved ${name} to Trash`, 'info');
      setTick((t) => t + 1);
      if (selectedFile === target) {
        setSelectedFile(null);
        setFileContent(null);
      }
    } else {
      showNotification(`Failed to move ${name} to Trash`, 'error');
    }
  };

  const handlePermanentDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    const ok = vfs.deleteFile(target, user, kernel.clock.getTime());
    if (ok) {
      showNotification(`Permanently deleted ${name}`, 'info');
      setTick((t) => t + 1);
      if (selectedFile === target) {
        setSelectedFile(null);
        setFileContent(null);
      }
    } else {
      showNotification(`Failed to delete ${name} (Permission Denied)`, 'error');
    }
  };

  const handleRestoreFromTrash = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = vfs.restoreTrashFile(name, '/home/nova/Documents');
    if (ok) {
      showNotification(`Restored ${name} to /home/nova/Documents`, 'info');
      setTick((t) => t + 1);
      if (selectedFile?.endsWith(name)) {
        setSelectedFile(null);
        setFileContent(null);
      }
    } else {
      showNotification(`Failed to restore ${name}`, 'error');
    }
  };

  const handleEmptyTrash = () => {
    const count = vfs.emptyTrash();
    showNotification(`Emptied ${count} items from Trash`, 'info');
    setSelectedFile(null);
    setFileContent(null);
    setTick((t) => t + 1);
  };

  const handleCreateFile = () => {
    const filename = prompt('Enter new file name (e.g. script.sh, report.txt):');
    if (!filename) return;
    const target = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    const ok = vfs.writeFile(target, '/* Created via NOVA File Manager */\n', user.uid, user.gid, 644, kernel.clock.getTime());
    if (ok) {
      showNotification(`Created file ${filename}`, 'info');
      setTick((t) => t + 1);
    } else {
      showNotification(`Cannot create file in ${currentPath}`, 'error');
    }
  };

  const handleCreateFolder = () => {
    const foldername = prompt('Enter new directory name:');
    if (!foldername) return;
    const target = currentPath === '/' ? `/${foldername}` : `${currentPath}/${foldername}`;
    const ok = vfs.createDirectory(target, user.uid, user.gid, 755, kernel.clock.getTime());
    if (ok) {
      showNotification(`Created directory ${foldername}`, 'info');
      setTick((t) => t + 1);
    } else {
      showNotification(`Cannot create directory in ${currentPath}`, 'error');
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans select-none">
      {/* Top Address & Actions Bar */}
      <div className="p-2.5 bg-[#0D1322] border-b border-white/5 flex items-center justify-between gap-2 flex-wrap">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-white/10 flex-1 min-w-[200px] overflow-x-auto">
          <button
            onClick={() => navigateTo('/')}
            className="hover:text-cyan-400 p-1 text-slate-400 transition-colors"
            title="Root"
          >
            <HardDrive className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          {pathParts.map((part, index) => {
            const partPath = '/' + pathParts.slice(0, index + 1).join('/');
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={partPath}>
                <button
                  onClick={() => navigateTo(partPath)}
                  className={`hover:text-cyan-400 px-1 py-0.5 rounded transition-colors truncate max-w-[120px] font-mono text-[11px] ${
                    isLast ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {part}
                </button>
                {!isLast && <ChevronRight className="w-3 h-3 text-slate-600" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-[11px] w-36"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCreateFile}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium flex items-center gap-1 text-[11px]"
          >
            <Plus className="w-3 h-3" />
            File
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium flex items-center gap-1 text-[11px]"
          >
            <FolderPlus className="w-3 h-3" />
            Folder
          </button>
          {isTrashFolder && (
            <button
              onClick={handleEmptyTrash}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Places Sidebar */}
        <div className="md:col-span-3 border-r border-white/5 bg-[#0A0F1D] p-2 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
            Places
          </div>
          {PLACES.map((place) => {
            const Icon = place.icon;
            const isActive = currentPath === place.path;
            return (
              <button
                key={place.path}
                onClick={() => navigateTo(place.path)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${place.color}`} />
                <span className="truncate">{place.name}</span>
              </button>
            );
          })}
        </div>

        {/* Center: File List Table */}
        <div className="md:col-span-6 overflow-y-auto p-2 border-r border-white/5">
          {isTrashFolder && (
            <div className="mb-2 p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
              <span>Items in Trash are queued for permanent deletion.</span>
              <button onClick={handleEmptyTrash} className="underline text-xs">Empty All</button>
            </div>
          )}

          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-[10px]">
                <th className="pb-1.5 pl-2">NAME</th>
                <th className="pb-1.5">PERMISSIONS</th>
                <th className="pb-1.5">SIZE</th>
                <th className="pb-1.5 pr-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filteredEntries.map((item) => {
                const isSelected = selectedFile?.endsWith(`/${item.name}`);
                return (
                  <tr
                    key={item.name}
                    onClick={() => handleSelectEntry(item)}
                    onDoubleClick={() => handleDoubleClickEntry(item)}
                    className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/15 text-cyan-200' : ''
                    }`}
                  >
                    <td className="py-2 pl-2 flex items-center gap-2">
                      {item.type === 'DIRECTORY' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="text-slate-200 font-medium truncate max-w-[150px]">{item.name}</span>
                    </td>
                    <td className="py-2 text-slate-400 text-[10px]">{item.permissions}</td>
                    <td className="py-2 text-slate-400">{item.size} B</td>
                    <td className="py-2 pr-2 text-right">
                      {item.name !== '.' && item.name !== '..' && (
                        <div className="flex items-center justify-end gap-1">
                          {isTrashFolder ? (
                            <>
                              <button
                                onClick={(e) => handleRestoreFromTrash(item.name, e)}
                                className="p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                title="Restore to Documents"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handlePermanentDelete(item.name, e)}
                                className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleTrashFile(item.name, e)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Preview & Associated App Inspector */}
        <div className="md:col-span-3 p-3 overflow-y-auto bg-[#090D17] flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Inspector
            </span>
          </div>

          {selectedFile ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-cyan-400 truncate">{selectedFile}</div>
                {(() => {
                  const filename = selectedFile.split('/').pop() || selectedFile;
                  const targetApp = getAppForFile(filename);

                  return (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-400">Default App</div>
                        <div className="text-xs font-semibold text-slate-200">
                          {targetApp?.name || 'Text Editor'}
                        </div>
                      </div>
                      <button
                        onClick={() => openFile(selectedFile)}
                        className="px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 text-[11px] shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Text Preview Box */}
              <div className="flex-1 flex flex-col space-y-1 min-h-[140px]">
                <div className="text-[10px] text-slate-500 font-mono">Content Preview:</div>
                <pre className="flex-1 p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-[10px] text-slate-300 whitespace-pre-wrap overflow-auto leading-relaxed select-text">
                  {fileContent || '(Empty file or binary format)'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 py-12 text-center text-xs">
              Select or double-click a file to inspect and open
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
