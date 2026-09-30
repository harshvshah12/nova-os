// ============================================================================
// NOVA OS — TERMINAL APPLICATION (bash)
// Interactive shell emulator with ANSI styling, history, tab completion & scrolling
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';

interface HistoryItem {
  prompt: string;
  command: string;
  output: string;
  exitCode: number;
}

export const TerminalApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      prompt: '',
      command: '',
      output: `NOVA OS Linux-Inspired Simulation [Kernel 0.1.0-simulated-x86_64]\nType 'help' for available commands, or 'run cpu-demo' to launch OS simulation workloads.\n`,
      exitCode: 0,
    },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const promptStr = kernel.shell.getPrompt();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = currentInput;
      const res = kernel.shell.execute(cmd);

      if (res.clear) {
        setHistory([]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            prompt: promptStr,
            command: cmd,
            output: res.output,
            exitCode: res.exitCode,
          },
        ]);
      }

      setCurrentInput('');
      setHistoryIndex(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const shellHistory = kernel.shell.getHistory();
      if (shellHistory.length === 0) return;

      const nextIndex =
        historyIndex === null ? shellHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCurrentInput(shellHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const shellHistory = kernel.shell.getHistory();
      if (historyIndex === null) return;

      const nextIndex = historyIndex + 1;
      if (nextIndex >= shellHistory.length) {
        setHistoryIndex(null);
        setCurrentInput('');
      } else {
        setHistoryIndex(nextIndex);
        setCurrentInput(shellHistory[nextIndex] || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocompletion
      const words = currentInput.split(' ');
      const lastWord = words[words.length - 1];
      const candidates = [
        'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cat', 'head', 'tail', 'grep',
        'echo', 'clear', 'history', 'whoami', 'date', 'uname', 'uptime', 'ps', 'top',
        'kill', 'free', 'df', 'ifconfig', 'ping', 'netstat', 'run', 'help', 'service', 'pkg',
      ];
      const match = candidates.find((c) => c.startsWith(lastWord));
      if (match) {
        words[words.length - 1] = match;
        setCurrentInput(words.join(' '));
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setHistory([]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setHistory((prev) => [
        ...prev,
        {
          prompt: promptStr,
          command: currentInput + '^C',
          output: '',
          exitCode: 130,
        },
      ]);
      setCurrentInput('');
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="h-full w-full bg-[#070B12] text-slate-200 font-mono text-[13px] p-3 overflow-y-auto cursor-text select-text"
    >
      {history.map((item, idx) => (
        <div key={idx} className="mb-2">
          {item.prompt && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-400 font-semibold">{item.prompt}</span>
              <span className="text-slate-100">{item.command}</span>
            </div>
          )}
          {item.output && (
            <pre className={`whitespace-pre-wrap mt-0.5 leading-relaxed ${
              item.exitCode !== 0 ? 'text-red-400' : 'text-slate-300'
            }`}>
              {item.output}
            </pre>
          )}
        </div>
      ))}

      {/* Active input line */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-emerald-400 font-semibold shrink-0">{promptStr}</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 min-w-[120px] bg-transparent outline-none border-none text-slate-100 font-mono text-[13px] caret-cyan-400 p-0"
        />
      </div>

      <div ref={bottomRef} />
    </div>
  );
};
