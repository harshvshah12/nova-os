// ============================================================================
// NOVA OS — NETWORK MONITOR APPLICATION
// Virtual interface telemetry, live packet capture stream, and ping tool
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useOsStore } from '../../store/osStore';
import { Wifi, Send, Globe, Radio } from 'lucide-react';

export const NetworkMonitorApp: React.FC = () => {
  const { kernel } = useOsStore();
  const [, setTick] = useState(0);
  const [pingTarget, setPingTarget] = useState('192.168.1.1');

  useEffect(() => {
    const handle = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(handle);
  }, []);

  const net = kernel.net;
  const state = net.getState();

  const handlePing = () => {
    net.sendPacket('ICMP', pingTarget, 'PING ECHO', kernel.clock.getTime());
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#080C14] text-xs font-sans">
      {/* Network Header Cards */}
      <div className="p-3 bg-[#0D1322] border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-2 rounded bg-slate-900/60 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Interface</div>
          <div className="font-mono font-bold text-cyan-400">{state.interfaceName} (UP)</div>
        </div>
        <div className="p-2 rounded bg-slate-900/60 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">IPv4 Address</div>
          <div className="font-mono font-bold text-slate-200">{state.ip}</div>
        </div>
        <div className="p-2 rounded bg-slate-900/60 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Default Gateway</div>
          <div className="font-mono font-bold text-slate-300">{state.gateway}</div>
        </div>
        <div className="p-2 rounded bg-slate-900/60 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">MAC Hardware</div>
          <div className="font-mono text-[11px] text-slate-400">{state.mac}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Packet Stream Log */}
        <div className="md:col-span-8 p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-slate-200 font-semibold text-xs">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Live Packet Capture ({state.packetLog.length} Packets)
            </span>
            <div className="font-mono text-[10px] text-slate-400">
              TX: {state.txPackets} | RX: {state.rxPackets}
            </div>
          </div>

          <div className="flex-1 overflow-auto max-h-[220px]">
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-1 pl-1">PROTOCOL</th>
                  <th className="pb-1">SOURCE</th>
                  <th className="pb-1">DESTINATION</th>
                  <th className="pb-1">LATENCY</th>
                  <th className="pb-1">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.packetLog.slice(-15).reverse().map((pkt) => (
                  <tr key={pkt.id} className="hover:bg-white/[0.02]">
                    <td className="py-1 pl-1 font-bold text-violet-400">{pkt.protocol}</td>
                    <td className="py-1 text-slate-300">{pkt.srcIp}</td>
                    <td className="py-1 text-slate-300">{pkt.dstIp}</td>
                    <td className="py-1 text-amber-400">{pkt.latencyMs}ms</td>
                    <td className="py-1">
                      <span className={`px-1 py-0.2 rounded text-[9px] ${
                        pkt.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10'
                      }`}>
                        {pkt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Ping Tool & Socket Table */}
        <div className="md:col-span-4 flex flex-col space-y-3">
          {/* Ping Tool */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 space-y-2">
            <span className="font-semibold text-slate-200 text-xs">Simulated Ping</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-100 font-mono text-xs outline-none"
              />
              <button
                onClick={handlePing}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3 h-3" />
                Ping
              </button>
            </div>
          </div>

          {/* Active Sockets Table */}
          <div className="p-3 rounded-lg bg-[#0F1626]/80 border border-white/5 flex-1 flex flex-col space-y-1.5">
            <span className="font-semibold text-slate-200 text-xs">Active Sockets</span>
            <div className="space-y-1 font-mono text-[10px]">
              {state.activeSockets.map((s) => (
                <div key={s.id} className="p-1.5 rounded bg-slate-900 border border-white/5 flex justify-between">
                  <span className="text-slate-300 font-bold">{s.protocol} :{s.localPort}</span>
                  <span className="text-emerald-400">{s.state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
