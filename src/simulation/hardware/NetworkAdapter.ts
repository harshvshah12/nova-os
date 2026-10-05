// ============================================================================
// NOVA OS — VIRTUAL NETWORK ADAPTER (eth0)
// Packet queues, ICMP ping, simulated latency, and socket telemetry
// ============================================================================

import type {
  NetworkPacket,
  NetworkState,
  PacketProtocol,
  SimulationTime,
} from '../types';
import { prng } from '../runtime/Random';

export class VirtualNetworkAdapter {
  private interfaceName: string = 'eth0';
  private ip: string = '192.168.1.10';
  private netmask: string = '255.255.255.0';
  private gateway: string = '192.168.1.1';
  private mac: string = '02:00:00:1A:2B:3C';
  private isUp: boolean = true;
  private packetCounter: number = 5000;

  private txPackets: number = 0;
  private rxPackets: number = 0;
  private txBytes: number = 0;
  private rxBytes: number = 0;

  private packetQueue: { packet: NetworkPacket; deliveryTime: SimulationTime }[] = [];
  private packetLog: NetworkPacket[] = [];
  private readonly maxLogSize: number = 100;

  private activeSockets: {
    id: string;
    protocol: string;
    localPort: number;
    remoteIp: string;
    remotePort: number;
    state: string;
  }[] = [
    {
      id: 'sock-1',
      protocol: 'TCP',
      localPort: 22,
      remoteIp: '0.0.0.0',
      remotePort: 0,
      state: 'LISTEN',
    },
    {
      id: 'sock-2',
      protocol: 'TCP',
      localPort: 80,
      remoteIp: '0.0.0.0',
      remotePort: 0,
      state: 'LISTEN',
    },
  ];

  constructor(ip: string = '192.168.1.10', gateway: string = '192.168.1.1') {
    this.ip = ip;
    this.gateway = gateway;
  }

  public getState(): NetworkState {
    return {
      interfaceName: this.interfaceName,
      ip: this.ip,
      netmask: this.netmask,
      gateway: this.gateway,
      mac: this.mac,
      txPackets: this.txPackets,
      rxPackets: this.rxPackets,
      txBytes: this.txBytes,
      rxBytes: this.rxBytes,
      activeSockets: [...this.activeSockets],
      packetLog: this.packetLog.slice(-40),
    };
  }

  public sendPacket(
    protocol: PacketProtocol,
    dstIp: string,
    payload: string,
    timestamp: SimulationTime,
    srcPort?: number,
    dstPort?: number
  ): NetworkPacket {
    const packetSize = payload.length + 40; // 40 bytes IP/TCP header
    const latency = dstIp === '127.0.0.1' ? 2 : prng.nextInt(15, 35); // 15-35ms latency

    const packet: NetworkPacket = {
      id: `pkt-${timestamp}-${++this.packetCounter}`,
      protocol,
      srcIp: this.ip,
      dstIp,
      srcPort,
      dstPort,
      payload,
      timestamp,
      status: 'QUEUED',
      ttl: 64,
      latencyMs: latency,
    };

    this.txPackets++;
    this.txBytes += packetSize;
    this.packetQueue.push({
      packet,
      deliveryTime: timestamp + latency,
    });

    this.packetLog.push(packet);
    if (this.packetLog.length > this.maxLogSize) {
      this.packetLog.shift();
    }

    return packet;
  }

  /**
   * Advance 1 simulation tick on network interface
   * Delivers queued packets and generates ICMP response if applicable
   */
  public tick(currentTime: SimulationTime): NetworkPacket[] {
    const delivered: NetworkPacket[] = [];
    const remaining: { packet: NetworkPacket; deliveryTime: SimulationTime }[] = [];

    for (const item of this.packetQueue) {
      if (currentTime >= item.deliveryTime) {
        item.packet.status = 'DELIVERED';
        delivered.push(item.packet);

        // If ICMP ping to gateway or external host, simulate receiving response
        if (item.packet.protocol === 'ICMP' && item.packet.srcIp === this.ip) {
          this.receivePacket(
            'ICMP',
            item.packet.dstIp,
            `Echo Reply: seq=1 time=${item.packet.latencyMs}ms bytes=64`,
            currentTime
          );
        }
      } else {
        item.packet.status = 'TRANSMITTING';
        remaining.push(item);
      }
    }

    this.packetQueue = remaining;
    return delivered;
  }

  public receivePacket(
    protocol: PacketProtocol,
    srcIp: string,
    payload: string,
    timestamp: SimulationTime
  ): NetworkPacket {
    const packetSize = payload.length + 40;
    const packet: NetworkPacket = {
      id: `pkt-rx-${timestamp}-${++this.packetCounter}`,
      protocol,
      srcIp,
      dstIp: this.ip,
      payload,
      timestamp,
      status: 'DELIVERED',
      ttl: 64,
      latencyMs: 1,
    };

    this.rxPackets++;
    this.rxBytes += packetSize;
    this.packetLog.push(packet);
    if (this.packetLog.length > this.maxLogSize) {
      this.packetLog.shift();
    }

    return packet;
  }

  public reset(): void {
    this.txPackets = 0;
    this.rxPackets = 0;
    this.txBytes = 0;
    this.rxBytes = 0;
    this.packetQueue = [];
    this.packetLog = [];
  }
}
