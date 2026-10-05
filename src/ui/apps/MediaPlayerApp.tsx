// ============================================================================
// NOVA OS — MEDIA PLAYER APPLICATION
// Audio player with Web Audio API synthesizer, live 60fps frequency spectrum
// visualizer, playlist, and audio buffer telemetry
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ListMusic,
  Radio,
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  freq: number; // base chord frequency in Hz
}

const PLAYLIST: Track[] = [
  {
    id: 't-1',
    title: 'Lofi Kernel Scheduling Beats',
    artist: 'Harsh Shah',
    album: 'NOVA OS Sessions',
    duration: 184,
    freq: 220, // A3
  },
  {
    id: 't-2',
    title: 'Ambient Cyberpunk Synth (4KB Paging)',
    artist: 'Harsh Shah',
    album: 'Virtual Hardware Dreams',
    duration: 215,
    freq: 174.61, // F3
  },
  {
    id: 't-3',
    title: 'Round Robin Quantum Groove',
    artist: 'NOVA OS Ensemble',
    album: 'Multitasking Anthems',
    duration: 160,
    freq: 261.63, // C4
  },
];

export const MediaPlayerApp: React.FC<{ customData?: { path?: string } }> = () => {
  const { kernel } = useOsStore();
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {}
      oscRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 64;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(currentTrack.freq, ctx.currentTime);

      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
      analyserRef.current = analyser;

      // Start canvas spectrum visualizer loop
      drawVisualizer();
    } catch (e) {
      console.warn('Web Audio synthesis initial warning:', e);
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height * 0.85);

        // Cyberpunk pink/purple/cyan gradient
        const r = Math.min(255, 56 + i * 8);
        const g = Math.min(255, 189 - i * 4);
        const b = 248;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio();
      setIsPlaying(true);
    }
  };

  // Track progress timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= currentTrack.duration) {
          handleNextTrack();
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handleNextTrack = () => {
    stopAudio();
    setCurrentTrackIndex((i) => (i + 1) % PLAYLIST.length);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => startAudio(), 100);
    }
  };

  const handlePrevTrack = () => {
    stopAudio();
    setCurrentTrackIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => startAudio(), 100);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#070A12] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-2.5 bg-[#0C1220] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-slate-100 text-xs">NOVA Media Player</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30">
          Web Audio Synthesizer
        </span>
      </div>

      {/* Main Track Display & Frequency Canvas */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
        {/* Animated Spectrum Canvas */}
        <div className="w-full max-w-md h-28 bg-[#090E1A] rounded-xl border border-white/10 p-2 flex items-center justify-center overflow-hidden shadow-xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={110}
            className="w-full h-full"
          />
        </div>

        {/* Track Title & Metadata */}
        <div className="text-center space-y-1">
          <div className="font-bold text-slate-100 text-sm">{currentTrack.title}</div>
          <div className="text-pink-400 font-medium text-[11px]">{currentTrack.artist}</div>
          <div className="text-slate-500 text-[10px]">{currentTrack.album}</div>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full max-w-md space-y-1">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevTrack}
            className="p-2 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handleTogglePlay}
            className="p-3.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/30 transition-transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Playlist Drawer */}
      <div className="p-3 bg-[#0A101D] border-t border-white/5 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] mb-1.5">
          <ListMusic className="w-3.5 h-3.5 text-pink-400" />
          <span>Active Playlist ({PLAYLIST.length} Tracks)</span>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {PLAYLIST.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => {
                stopAudio();
                setCurrentTrackIndex(idx);
                setProgress(0);
                if (isPlaying) setTimeout(() => startAudio(), 100);
              }}
              className={`p-1.5 rounded flex items-center justify-between cursor-pointer text-[10px] ${
                idx === currentTrackIndex
                  ? 'bg-pink-500/20 text-pink-300 font-semibold'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <div className="truncate flex items-center gap-2">
                <span className="text-slate-500">{idx + 1}.</span>
                <span className="truncate">{t.title}</span>
              </div>
              <span className="font-mono text-slate-500">{formatTime(t.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
