// ============================================================================
// NOVA OS — IMAGE VIEWER APPLICATION
// Hardware-accelerated image viewer with zoom, rotation, metadata inspector,
// and VFS directory navigation
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export const ImageViewerApp: React.FC<{ customData?: { path?: string } }> = ({ customData }) => {
  const { kernel } = useOsStore();
  const [currentPath, setCurrentPath] = useState<string>(
    customData?.path || '/home/nova/Pictures/nova_logo.svg'
  );
  const [imageContent, setImageContent] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showMeta, setShowMeta] = useState<boolean>(false);

  useEffect(() => {
    const raw = kernel.vfs.readFile(
      currentPath,
      { uid: 1000, gid: 1000, isRoot: false }
    );
    if (raw !== null) {
      setImageContent(raw);
    } else {
      setImageContent('');
    }
  }, [currentPath, kernel]);

  const isSvg = currentPath.toLowerCase().endsWith('.svg');

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans select-none overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="p-2 bg-[#0D1322] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200 truncate max-w-[200px]">
            {currentPath.split('/').pop()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            className="p-1.5 rounded bg-slate-900 border border-white/5 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-slate-400">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(300, zoom + 25))}
            className="p-1.5 rounded bg-slate-900 border border-white/5 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded bg-slate-900 border border-white/5 text-slate-300 hover:text-white"
            title="Rotate 90deg"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(100);
              setRotation(0);
            }}
            className="p-1.5 rounded bg-slate-900 border border-white/5 text-slate-300 hover:text-white"
            title="Reset Transform"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`p-1.5 rounded border ${
              showMeta
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-white/5 text-slate-300 hover:text-white'
            }`}
            title="Metadata Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-[#05080F]">
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            {isSvg && imageContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: imageContent }}
                className="shadow-2xl rounded-lg overflow-hidden border border-white/10"
              />
            ) : (
              <div className="p-8 rounded-xl bg-slate-900 border border-white/10 text-center space-y-2">
                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-slate-400 font-mono text-[11px]">
                  {currentPath.split('/').pop()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {imageContent.length} bytes simulated raster asset
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        {showMeta && (
          <div className="w-60 bg-[#0A0F1D] border-l border-white/5 p-3 space-y-3 font-mono text-[10px]">
            <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> Image Details
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div>Path: <span className="text-cyan-400 break-all">{currentPath}</span></div>
              <div>Type: <span className="text-emerald-400">{isSvg ? 'Vector SVG' : 'Bitmap Asset'}</span></div>
              <div>Size: <span className="text-slate-400">{imageContent.length} bytes</span></div>
              <div>Zoom: <span className="text-slate-400">{zoom}%</span></div>
              <div>Rotation: <span className="text-slate-400">{rotation}°</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
