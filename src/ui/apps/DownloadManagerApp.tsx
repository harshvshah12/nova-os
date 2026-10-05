// ============================================================================
// NOVA OS — DOWNLOAD MANAGER APPLICATION
// Track active and completed network downloads with real-time socket throughput,
// progress animation, and virtual filesystem writes
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  Download,
  CheckCircle,
  Pause,
  Play,
  X,
  FileText,
  Plus,
  ArrowDown,
  Clock,
  Wifi,
} from 'lucide-react';

interface DownloadItem {
  id: string;
  filename: string;
  sourceUrl: string;
  totalBytes: number;
  downloadedBytes: number;
  speedKbps: number;
  status: 'DOWNLOADING' | 'COMPLETED' | 'PAUSED';
  startTime: string;
}

export const DownloadManagerApp: React.FC = () => {
  const { kernel, showNotification } = useOsStore();
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: 'dl-1',
      filename: 'dataset_sample.csv',
      sourceUrl: 'https://datasets.nova.org/ml/fraud_sample.csv',
      totalBytes: 524288,
      downloadedBytes: 524288,
      speedKbps: 0,
      status: 'COMPLETED',
      startTime: '10:04',
    },
    {
      id: 'dl-2',
      filename: 'kernel_patch_v1.0.tar.gz',
      sourceUrl: 'https://kernel.nova.org/releases/patch-1.0.4.tar.gz',
      totalBytes: 1048576,
      downloadedBytes: 1048576,
      speedKbps: 0,
      status: 'COMPLETED',
      startTime: '10:12',
    },
    {
      id: 'dl-3',
      filename: 'neural_weights_vit_b16.bin',
      sourceUrl: 'https://models.nova.ai/weights/vit-b16-quantized.bin',
      totalBytes: 4194304,
      downloadedBytes: 2450000,
      speedKbps: 450,
      status: 'DOWNLOADING',
      startTime: '10:18',
    },
  ]);

  const [newUrlInput, setNewUrlInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Animate active download progress
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((prev) =>
        prev.map((dl) => {
          if (dl.status !== 'DOWNLOADING') return dl;
          const inc = dl.speedKbps * 1024 * 0.5;
          const nextDownloaded = Math.min(dl.totalBytes, dl.downloadedBytes + inc);
          const isDone = nextDownloaded >= dl.totalBytes;

          if (isDone && dl.status === 'DOWNLOADING') {
            // Write completed download to VFS
            kernel.vfs.writeFile(
              `/home/nova/Downloads/${dl.filename}`,
              `[DOWNLOADED FILE: ${dl.filename} from ${dl.sourceUrl}]`,
              1000,
              1000,
              644
            );
            kernel.eventBus.emit(
              'NETWORK_PACKET_RECEIVE',
              'network',
              'downloadd',
              `Download finished: ${dl.filename} (100%)`,
              kernel.clock.getTime(),
              { metadata: { filename: dl.filename } }
            );
            showNotification(`Downloaded ${dl.filename}`, 'info');
          }

          return {
            ...dl,
            downloadedBytes: nextDownloaded,
            status: isDone ? 'COMPLETED' : 'DOWNLOADING',
            speedKbps: isDone ? 0 : Math.round(400 + Math.random() * 120),
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [kernel, showNotification]);

  const handleStartNewDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    const url = newUrlInput.trim();
    const filename = url.split('/').pop() || 'downloaded_file.bin';
    const totalBytes = Math.floor(1024 * 1024 * (1 + Math.random() * 5));

    const newItem: DownloadItem = {
      id: `dl-${Date.now()}`,
      filename,
      sourceUrl: url,
      totalBytes,
      downloadedBytes: 0,
      speedKbps: 520,
      status: 'DOWNLOADING',
      startTime: kernel.clock.getFormattedTime(),
    };

    setDownloads([newItem, ...downloads]);
    setNewUrlInput('');
    setShowAddModal(false);
    showNotification(`Started download: ${filename}`, 'info');
  };

  const handleTogglePause = (id: string) => {
    setDownloads((prev) =>
      prev.map((dl) => {
        if (dl.id !== id) return dl;
        return {
          ...dl,
          status: dl.status === 'DOWNLOADING' ? 'PAUSED' : 'DOWNLOADING',
          speedKbps: dl.status === 'DOWNLOADING' ? 0 : 480,
        };
      })
    );
  };

  const handleRemove = (id: string) => {
    setDownloads((prev) => prev.filter((dl) => dl.id !== id));
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#070B14] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#0D1424] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs">NOVA Download Manager</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
            {downloads.filter((d) => d.status === 'DOWNLOADING').length} active
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Download</span>
        </button>
      </div>

      {/* Add Download Modal */}
      {showAddModal && (
        <div className="p-3 bg-[#0E1729] border-b border-cyan-500/30">
          <form onSubmit={handleStartNewDownload} className="flex items-center gap-2">
            <input
              type="text"
              value={newUrlInput}
              onChange={(e) => setNewUrlInput(e.target.value)}
              placeholder="Enter URL to download (e.g. https://data.nova.org/model.onnx)..."
              autoFocus
              className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-cyan-600 text-white font-semibold text-xs"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Download List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {downloads.map((item) => {
          const pct = Math.round((item.downloadedBytes / item.totalBytes) * 100);
          const isDone = item.status === 'COMPLETED';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all ${
                isDone
                  ? 'bg-[#0A101E] border-white/5'
                  : 'bg-[#0D1629] border-cyan-500/40 shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDone ? 'text-slate-400' : 'text-cyan-400 animate-pulse'}`} />
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{item.filename}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-sm">{item.sourceUrl}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {isDone ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <>
                      <span className="text-cyan-300 font-bold">{item.speedKbps} KB/s</span>
                      <button
                        onClick={() => handleTogglePause(item.id)}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        {item.status === 'DOWNLOADING' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
                <span>
                  {(item.downloadedBytes / (1024 * 1024)).toFixed(2)} MB / {(item.totalBytes / (1024 * 1024)).toFixed(2)} MB ({pct}%)
                </span>
                <span>Time: {item.startTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
