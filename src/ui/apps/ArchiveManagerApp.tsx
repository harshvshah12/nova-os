// ============================================================================
// NOVA OS — ARCHIVE MANAGER APPLICATION
// Compress, extract, and inspect virtual TAR, GZ, and ZIP packages
// with CPU compression telemetry and VFS file writes
// ============================================================================

import React, { useState } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  Package,
  FolderArchive,
  DownloadCloud,
  FilePlus,
  Trash2,
  FileText,
  CheckCircle,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

interface ArchiveEntry {
  filename: string;
  size: number;
  compressedSize: number;
  date: string;
}

const SAMPLE_ARCHIVES: Record<string, ArchiveEntry[]> = {
  '/home/nova/Downloads/kernel_patch_v1.0.tar.gz': [
    { filename: 'patch_notes.txt', size: 1024, compressedSize: 420, date: '2026-10-05 10:14' },
    { filename: 'sys_mmu.c', size: 8400, compressedSize: 2600, date: '2026-10-05 10:15' },
    { filename: 'sched_rr.c', size: 5200, compressedSize: 1850, date: '2026-10-05 10:16' },
  ],
  '/home/nova/Workspace/backup_source.zip': [
    { filename: 'hello_world.c', size: 120, compressedSize: 85, date: '2026-10-05 12:00' },
    { filename: 'notes.txt', size: 450, compressedSize: 210, date: '2026-10-05 12:02' },
  ],
};

export const ArchiveManagerApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [selectedArchive, setSelectedArchive] = useState<string>(
    '/home/nova/Downloads/kernel_patch_v1.0.tar.gz'
  );
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [extractedSuccess, setExtractedSuccess] = useState<boolean>(false);

  const entries = SAMPLE_ARCHIVES[selectedArchive] || [];

  const handleExtract = () => {
    setIsExtracting(true);
    setExtractedSuccess(false);

    // Simulate CPU compression/decompression cycles & VFS writes
    setTimeout(() => {
      // Write extracted files into /home/nova/Workspace/
      entries.forEach((e) => {
        kernel.vfs.writeFile(
          `/home/nova/Workspace/${e.filename}`,
          `// Extracted from ${selectedArchive}\n// File: ${e.filename}\n`,
          1000,
          1000,
          644
        );
      });

      // Emit disk & kernel events
      kernel.eventBus.emit(
        'FILE_WRITE',
        'filesystem',
        'archive-tool',
        `Extracted ${entries.length} files to /home/nova/Workspace/`,
        kernel.clock.getTime(),
        { metadata: { archive: selectedArchive, count: entries.length } }
      );

      setIsExtracting(false);
      setExtractedSuccess(true);
      showNotification(`Extracted ${entries.length} files to /home/nova/Workspace/`, 'info');
    }, 1200);
  };

  const handleCreateArchive = () => {
    setIsCompressing(true);
    setTimeout(() => {
      kernel.vfs.writeFile(
        '/home/nova/Workspace/project_archive.tar.gz',
        '[SIMULATED GZIP COMPRESSED ARCHIVE]',
        1000,
        1000,
        644
      );
      setIsCompressing(false);
      showNotification('Created /home/nova/Workspace/project_archive.tar.gz', 'info');
    }, 1000);
  };

  const totalOriginal = entries.reduce((acc, curr) => acc + curr.size, 0);
  const totalCompressed = entries.reduce((acc, curr) => acc + curr.compressedSize, 0);
  const ratio = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans select-none overflow-hidden">
      {/* Top Header & Actions */}
      <div className="p-3 bg-[#0D1424] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FolderArchive className="w-5 h-5 text-amber-400" />
          <div>
            <div className="font-bold text-slate-100 text-xs">NOVA Archive Manager</div>
            <div className="text-[10px] text-slate-400 font-mono">{selectedArchive}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateArchive}
            disabled={isCompressing}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors"
          >
            {isCompressing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FilePlus className="w-3.5 h-3.5 text-cyan-400" />}
            <span>New Archive</span>
          </button>
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-md transition-colors"
          >
            {isExtracting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
            <span>Extract All</span>
          </button>
        </div>
      </div>

      {/* Compression Telemetry Banner */}
      <div className="px-3 py-1.5 bg-[#090E1A] border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>Entries: <strong className="text-slate-200">{entries.length}</strong></span>
          <span>Uncompressed: <strong className="text-slate-200">{totalOriginal} B</strong></span>
          <span>Compressed: <strong className="text-amber-400">{totalCompressed} B</strong></span>
          <span>Savings: <strong className="text-emerald-400">-{ratio}%</strong></span>
        </div>
        {extractedSuccess && (
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Extracted to /home/nova/Workspace/
          </span>
        )}
      </div>

      {/* Archive Files Table */}
      <div className="flex-1 p-3 overflow-auto">
        <table className="w-full text-left font-mono text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="pb-1.5">NAME</th>
              <th className="pb-1.5">ORIGINAL SIZE</th>
              <th className="pb-1.5">COMPRESSED</th>
              <th className="pb-1.5">DATE MODIFIED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.03]">
                <td className="py-2 flex items-center gap-2 text-slate-200 font-medium">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.filename}</span>
                </td>
                <td className="py-2 text-slate-400">{item.size} bytes</td>
                <td className="py-2 text-amber-400 font-bold">{item.compressedSize} bytes</td>
                <td className="py-2 text-slate-500">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
