// ============================================================================
// NOVA OS — WINDOW FRAME COMPONENT
// Draggable, resizable, focusable window container with dark obsidian styling
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Minus,
  Square,
  X,
  Terminal,
  Activity,
  Cpu,
  Layers,
  GitCommit,
  Folder,
  HardDrive,
  Wifi,
  FileText,
  Hash,
  Settings as SettingsIcon,
  Box,
  AlertTriangle,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { useOsStore } from '../../store/osStore';
import type { WindowState } from '../../simulation/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Terminal,
  Activity,
  Cpu,
  Layers,
  GitCommit,
  Folder,
  HardDrive,
  Wifi,
  FileText,
  Hash,
  Settings: SettingsIcon,
  Box,
  AlertTriangle,
  Clock,
  PlayCircle,
};

interface WindowFrameProps {
  window: WindowState;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useOsStore();

  const isFocused = activeWindowId === win.id;
  const IconComponent = ICON_MAP[win.icon] || Terminal;

  // Dragging state
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resizing state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = () => {
    focusWindow(win.id);
  };

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    };
    focusWindow(win.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: win.width,
      height: win.height,
    };
    focusWindow(win.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && !win.isMaximized) {
        const newX = Math.max(0, Math.min(document.documentElement.clientWidth - 100, e.clientX - dragOffset.current.x));
        const newY = Math.max(32, Math.min(document.documentElement.clientHeight - 60, e.clientY - dragOffset.current.y));
        updateWindowPosition(win.id, newX, newY);
      } else if (isResizing.current && !win.isMaximized) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newWidth = Math.max(340, resizeStart.current.width + deltaX);
        const newHeight = Math.max(240, resizeStart.current.height + deltaY);
        updateWindowSize(win.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [win.id, win.isMaximized, updateWindowPosition, updateWindowSize]);

  if (win.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = win.isMaximized
    ? {
        position: 'absolute',
        top: 36,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 84px)',
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      className={`flex flex-col bg-[#0b0f19]/95 backdrop-blur-xl rounded-lg overflow-hidden transition-shadow duration-150 ${
        isFocused
          ? 'border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
          : 'border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] opacity-95'
      }`}
    >
      {/* Window Title Bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
        className={`h-9 px-3 flex items-center justify-between select-none cursor-move border-b ${
          isFocused
            ? 'bg-[#101726] border-white/10 text-slate-100'
            : 'bg-[#0d131f] border-white/5 text-slate-400'
        }`}
      >
        {/* Left: Window Icon & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent className={`w-4 h-4 shrink-0 ${isFocused ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-xs font-medium tracking-wide truncate">{win.title}</span>
          {win.associatedPid && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
              PID {win.associatedPid}
            </span>
          )}
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            onClick={() => minimizeWindow(win.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => maximizeWindow(win.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto bg-[#080c14] relative text-slate-200">
        {children}
      </div>

      {/* Resize Handle (Bottom-Right) */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize z-20 hover:bg-cyan-500/40 rounded-br transition-colors"
        />
      )}
    </div>
  );
};
