// ============================================================================
// NOVA OS — SYNCHRONIZATION LAB APPLICATION
// Classical Concurrency & IPC Laboratory:
// 1. Bounded Buffer (Producer-Consumer with Dijkstra Semaphores)
// 2. Readers-Writers (Shared Memory & Mutual Exclusion)
// 3. Dining Philosophers (Deadlock Simulation vs. Asymmetric Prevention)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import {
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  RotateCcw,
  Users,
  Database,
  Utensils,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export const SyncLabApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'BOUNDED_BUFFER' | 'READERS_WRITERS' | 'DINING_PHILOSOPHERS'>('BOUNDED_BUFFER');

  const [autoRun, setAutoRun] = useState<boolean>(false);

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(handle);
  }, []);

  const sync = kernel.syncEngine;
  const bbState = sync.boundedBuffer.getState();
  const rwState = sync.readersWriters.getState();
  const dpState = sync.diningPhilosophers.getState();

  // Auto-run simulation tick
  useEffect(() => {
    if (!autoRun) return;
    const interval = setInterval(() => {
      const now = kernel.clock.getTime();
      if (activeTab === 'BOUNDED_BUFFER') {
        const action = Math.random() > 0.5 ? 'PRODUCE' : 'CONSUME';
        if (action === 'PRODUCE') {
          sync.boundedBuffer.produce(101, `Data-${Math.floor(Math.random() * 900) + 100}`, now);
        } else {
          sync.boundedBuffer.consume(201, now);
        }
      } else if (activeTab === 'DINING_PHILOSOPHERS') {
        const phId = Math.floor(Math.random() * 5);
        if (dpState.philosophers[phId].state === 'EATING') {
          sync.diningPhilosophers.releaseForks(phId);
        } else {
          sync.diningPhilosophers.takeForks(phId);
        }
      }
      setTick((t) => t + 1);
    }, 800);
    return () => clearInterval(interval);
  }, [autoRun, activeTab, dpState.philosophers, kernel.clock, sync]);

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans select-none overflow-auto">
      {/* Top Navigation & Controls */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('BOUNDED_BUFFER')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'BOUNDED_BUFFER'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Bounded Buffer
          </button>
          <button
            onClick={() => setActiveTab('READERS_WRITERS')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'READERS_WRITERS'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Readers-Writers
          </button>
          <button
            onClick={() => setActiveTab('DINING_PHILOSOPHERS')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'DINING_PHILOSOPHERS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Dining Philosophers
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRun(!autoRun)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
              autoRun
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className={`w-3 h-3 ${autoRun ? 'animate-pulse' : ''}`} />
            {autoRun ? 'Auto: Active' : 'Auto Run'}
          </button>
          <button
            onClick={() => sync.resetAll()}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 flex-1 overflow-auto">
        {/* ========================================================================= */}
        {/* 1. BOUNDED BUFFER (PRODUCER - CONSUMER) */}
        {/* ========================================================================= */}
        {activeTab === 'BOUNDED_BUFFER' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Header Description & Race Toggle */}
            <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Producer-Consumer Problem (Bounded Ring Buffer)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Synchronized via Binary Mutex + Counting Semaphores (Empty Slots & Full Slots).
                </div>
              </div>

              <button
                onClick={() => {
                  sync.boundedBuffer.enableProtection = !sync.boundedBuffer.enableProtection;
                  setTick((t) => t + 1);
                }}
                className={`px-3 py-1.5 rounded font-mono text-[11px] flex items-center gap-2 border ${
                  sync.boundedBuffer.enableProtection
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300 animate-pulse'
                }`}
              >
                {sync.boundedBuffer.enableProtection ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Protection: Active (Semaphores + Mutex)
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Vulnerable: Mutex Disabled (Race Condition)
                  </>
                )}
              </button>
            </div>

            {/* Race condition warning */}
            {bbState.raceConditionOccurred && (
              <div className="p-2.5 rounded bg-red-950/50 border border-red-500/40 text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>CRITICAL RACE CONDITION DETECTED!</strong> Unsynchronized concurrent buffer mutation resulted in lost update or buffer underflow!
                </span>
              </div>
            )}

            {/* Ring Buffer Visualizer */}
            <div className="p-4 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span>Circular Buffer Storage (Capacity: {bbState.capacity})</span>
                <div className="font-mono text-[11px] text-slate-400">
                  Produced: <span className="text-cyan-400">{bbState.totalProduced}</span> | Consumed: <span className="text-indigo-400">{bbState.totalConsumed}</span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 py-2">
                {bbState.buffer.map((item, index) => {
                  const isHead = bbState.head === index;
                  const isTail = bbState.tail === index;
                  const isOccupied = item !== null;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center min-h-[90px] transition-all duration-200 font-mono ${
                        isOccupied
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-md'
                          : 'bg-slate-900/60 border-white/5 text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 font-bold mb-1">SLOT #{index}</div>
                      <div className="font-bold text-xs truncate max-w-full">
                        {isOccupied ? item : '— EMPTY —'}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[9px]">
                        {isHead && (
                          <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            HEAD
                          </span>
                        )}
                        {isTail && (
                          <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            TAIL
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Synchronization Telemetry & Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
              {/* Semaphores & Mutex State */}
              <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
                <div className="text-slate-300 font-semibold text-xs font-sans">Synchronization Primitives</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center p-1.5 rounded bg-slate-900/60">
                    <span className="text-slate-400">Empty Slots Sem:</span>
                    <span className="text-emerald-400 font-bold">{bbState.emptySem}</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-slate-900/60">
                    <span className="text-slate-400">Filled Slots Sem:</span>
                    <span className="text-cyan-400 font-bold">{bbState.fullSem}</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-slate-900/60">
                    <span className="text-slate-400">Buffer Mutex:</span>
                    <span className={bbState.isMutexLocked ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {bbState.isMutexLocked ? `LOCKED (PID ${bbState.mutexOwner})` : 'UNLOCKED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wait Queues */}
              <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
                <div className="text-slate-300 font-semibold text-xs font-sans">Blocked Process Queues</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-1.5 rounded bg-slate-900/60">
                    <div className="text-slate-400 text-[10px] mb-0.5">Blocked Producers (Waiting for Space):</div>
                    <div className="text-amber-300">
                      {bbState.producersBlocked.length > 0
                        ? bbState.producersBlocked.map((p) => `PID ${p}`).join(', ')
                        : 'None'}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/60">
                    <div className="text-slate-400 text-[10px] mb-0.5">Blocked Consumers (Waiting for Data):</div>
                    <div className="text-amber-300">
                      {bbState.consumersBlocked.length > 0
                        ? bbState.consumersBlocked.map((p) => `PID ${p}`).join(', ')
                        : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Operations */}
              <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
                <div className="text-slate-300 font-semibold text-xs font-sans">Simulate Thread Actions</div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      sync.boundedBuffer.produce(101, `Item-${bbState.totalProduced + 1}`, kernel.clock.getTime());
                      setTick((t) => t + 1);
                    }}
                    className="p-2 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    + Produce (P1)
                  </button>
                  <button
                    onClick={() => {
                      sync.boundedBuffer.produce(102, `Item-${bbState.totalProduced + 1}`, kernel.clock.getTime());
                      setTick((t) => t + 1);
                    }}
                    className="p-2 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    + Produce (P2)
                  </button>
                  <button
                    onClick={() => {
                      sync.boundedBuffer.consume(201, kernel.clock.getTime());
                      setTick((t) => t + 1);
                    }}
                    className="p-2 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    - Consume (C1)
                  </button>
                  <button
                    onClick={() => {
                      sync.boundedBuffer.consume(202, kernel.clock.getTime());
                      setTick((t) => t + 1);
                    }}
                    className="p-2 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    - Consume (C2)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. READERS - WRITERS PROBLEM */}
        {/* ========================================================================= */}
        {activeTab === 'READERS_WRITERS' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5">
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Readers-Writers Problem (Mutual Exclusion & Shared Locks)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Multiple readers may read shared memory concurrently. Writers require exclusive access (no concurrent readers or writers).
              </div>
            </div>

            {/* Shared Document & State */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Shared Memory Document</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Active Readers: <strong className="text-emerald-400">{rwState.activeReaders.length}</strong> | Active Writer:{' '}
                    <strong className={rwState.activeWriter !== null ? 'text-red-400' : 'text-slate-500'}>
                      {rwState.activeWriter !== null ? `PID ${rwState.activeWriter}` : 'None'}
                    </strong>
                  </span>
                </div>
                <div className="p-3 rounded bg-[#090D17] border border-white/5 font-mono text-cyan-300 text-xs">
                  {rwState.sharedDocument}
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    {rwState.activeWriter !== null ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>Write Lock: {rwState.activeWriter !== null ? 'Exclusive Held' : 'Released'}</span>
                  </div>
                </div>
              </div>

              {/* Reader / Writer Controls */}
              <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2 font-mono">
                <div className="text-slate-300 font-semibold text-xs font-sans">Thread Actions</div>
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const newPid = 300 + rwState.activeReaders.length + 1;
                        sync.readersWriters.startRead(newPid, kernel.clock.getTime());
                        setTick((t) => t + 1);
                      }}
                      className="p-2 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[10px] font-semibold"
                    >
                      + Spawn Reader
                    </button>
                    <button
                      onClick={() => {
                        if (rwState.activeReaders.length > 0) {
                          sync.readersWriters.stopRead(rwState.activeReaders[0]);
                          setTick((t) => t + 1);
                        }
                      }}
                      disabled={rwState.activeReaders.length === 0}
                      className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] disabled:opacity-40"
                    >
                      - Release Reader
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        sync.readersWriters.startWrite(401, kernel.clock.getTime());
                        setTick((t) => t + 1);
                      }}
                      disabled={rwState.activeWriter !== null}
                      className="p-2 rounded bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 text-[10px] font-semibold disabled:opacity-40"
                    >
                      + Request Write
                    </button>
                    <button
                      onClick={() => {
                        if (rwState.activeWriter !== null) {
                          sync.readersWriters.stopWrite(
                            rwState.activeWriter,
                            `Kernel Config Updated @ tick ${kernel.clock.getTime()}: Mutex=OK, Readers=${rwState.activeReaders.length}`
                          );
                          setTick((t) => t + 1);
                        }
                      }}
                      disabled={rwState.activeWriter === null}
                      className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] disabled:opacity-40"
                    >
                      - Commit & Release
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DINING PHILOSOPHERS */}
        {/* ========================================================================= */}
        {activeTab === 'DINING_PHILOSOPHERS' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  Dining Philosophers Problem
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  5 philosophers and 5 shared forks. Requires both adjacent forks to eat.
                </div>
              </div>

              {/* Mode Toggle */}
              <select
                value={dpState.preventionMode}
                onChange={(e) => {
                  sync.diningPhilosophers.preventionMode = e.target.value as any;
                  setTick((t) => t + 1);
                }}
                className="px-2.5 py-1.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-xs outline-none"
              >
                <option value="ASYMMETRIC">Asymmetric Pickup (Deadlock-Free)</option>
                <option value="DEADLOCK_PRONE">Greedy Left-First (Deadlock Trigger)</option>
              </select>
            </div>

            {/* Deadlock Banner */}
            {dpState.isDeadlocked && (
              <div className="p-3 rounded bg-red-950/70 border border-red-500 text-red-200 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                <div>
                  <strong className="text-red-300">CIRCULAR DEADLOCK OCCURRED!</strong>
                  <div className="text-[11px] text-red-300/80">
                    Every philosopher holds their left fork and is blocked waiting for their right fork. Coffman circular wait condition satisfied.
                  </div>
                </div>
              </div>
            )}

            {/* 5 Philosophers Table */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {dpState.philosophers.map((ph) => {
                const isEating = ph.state === 'EATING';
                const isHungry = ph.state === 'HUNGRY';

                return (
                  <div
                    key={ph.id}
                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                      isEating
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-lg scale-102 ring-1 ring-emerald-400'
                        : isHungry
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-base font-bold text-slate-100">{ph.name}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">ID: {ph.id}</div>
                    <div className="my-2 flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isEating
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isHungry
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ph.state}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mb-2">
                      Meals: <strong className="text-cyan-400">{ph.mealsEaten}</strong>
                    </div>

                    <div className="flex gap-1 justify-center">
                      {isEating ? (
                        <button
                          onClick={() => {
                            sync.diningPhilosophers.releaseForks(ph.id);
                            setTick((t) => t + 1);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px]"
                        >
                          Release Forks
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            sync.diningPhilosophers.takeForks(ph.id);
                            setTick((t) => t + 1);
                          }}
                          className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 font-mono text-[10px] font-semibold"
                        >
                          Pick Up Forks
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Forks Status */}
            <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5">
              <div className="text-slate-300 font-semibold mb-2">Fork Mutex Allocations</div>
              <div className="grid grid-cols-5 gap-2 font-mono text-[11px]">
                {dpState.forks.map((fork) => (
                  <div
                    key={fork.id}
                    className={`p-2 rounded text-center border ${
                      fork.isHeld
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                  >
                    <div className="font-bold">Fork #{fork.id}</div>
                    <div className="text-[10px] mt-0.5">
                      {fork.isHeld ? `Held by Ph ${fork.heldBy}` : 'Available'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
