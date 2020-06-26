import { EventEmitter } from 'events';
import * as pcap from 'pcap';

import { RouterManager } from './RouterManager';

import { Usage } from './models/usage/Usage';
import { UsageUpdate } from './models/usage/UsageUpdate';
import { PacketMonitor } from './PacketMonitor';

export class UsageMonitor extends EventEmitter {

    private usages: Usage[] = [];
    private pcapSession = pcap.createSession('');
    private maxHistoryLength = 20;

    constructor(private _routerManager: RouterManager, private _packetMonitor: PacketMonitor) {
        super();
        if (process.env.USAGE_MAX_HISTORY_NODES) {
            this.maxHistoryLength = +process.env.USAGE_MAX_HISTORY_NODES;
        }
        this._routerManager.GetConnectionChanges().subscribe((connectionChanges) => {
            const now = new Date();
            const connects = connectionChanges.connects.map((device): Usage => {
                const usage: Usage = {
                    device: device,
                    currentIntranetUsageFrame: {
                        bandwidth: {
                            upBytes: 0,
                            downBytes: 0
                        },
                        frameStart: now
                    },
                    currentInternetUsageFrame: null,
                    intranetUsageHistory: [],
                    internetUsageHistory: []
                };
                this.emit('connect', device);
                return usage;
            });
            this.usages = this.usages.concat(connectionChanges.connects.map((device): Usage => {
                const usage: Usage = {
                    device: device,
                    currentIntranetUsageFrame: {
                        bandwidth: {
                            upBytes: 0,
                            downBytes: 0
                        },
                        frameStart: now
                    },
                    currentInternetUsageFrame: {
                        bandwidth: {
                            upBytes: 0,
                            downBytes: 0
                        },
                        frameStart: now
                    },
                    intranetUsageHistory: [],
                    internetUsageHistory: []
                };
                this.emit('connect', device);
                return usage;
            }));

            this._packetMonitor.GetRawPackets().subscribe(this.handlePacket.bind(this));

            connectionChanges.disconnects.forEach((disconnectedDevice) => {
                const index = this.usages.findIndex((usage) => usage.device);
                if (index !== -1) {
                    this.usages.splice(index, 1);
                    this.emit('disconnect', disconnectedDevice);
                }
            });
        });

        setInterval(this.sendUsageUpdates.bind(this), 5000);
    }

    public GetUsages(): Usage[] {
        return JSON.parse(JSON.stringify(this.usages));
    }

    private isLocal(addr: string) {
        return addr.match(/(^192\.168.*$)|(^10\..*$)/) !== null;
    }

    private handlePacket(raw_packet) {
        try {
            const packet = pcap.decode.packet(raw_packet);
            const basePacket = packet.payload?.payload;
            const sourceIp = basePacket?.saddr?.addr?.join('.');
            const destinationIp = basePacket?.daddr?.addr?.join('.');

            let index: number;

            if ((index = this.usages.findIndex(({ device }: Usage) => {
                return device.ipAddress === sourceIp
            })) !== -1) {
                if (this.isLocal(destinationIp)) {
                    this.usages[index].currentIntranetUsageFrame.bandwidth.upBytes += packet.pcap_header.len;
                } else {
                    this.usages[index].currentInternetUsageFrame.bandwidth.upBytes += packet.pcap_header.len;
                }
            } else if ((index = this.usages.findIndex(({ device }: Usage) => {
                return device.ipAddress === destinationIp;
            })) !== -1) {
                if (this.isLocal(sourceIp)) {
                    this.usages[index].currentIntranetUsageFrame.bandwidth.downBytes += packet.pcap_header.len;
                } else {
                    this.usages[index].currentInternetUsageFrame.bandwidth.downBytes += packet.pcap_header.len;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    private sendUsageUpdates() {
        const now = new Date();
        let usageUpdates: UsageUpdate[] = [];
        this.usages.forEach((usage) => {
            const currentIntranetUsageFrame = usage.currentIntranetUsageFrame;
            const currentInternetUsageFrame = usage.currentInternetUsageFrame;
            usage.intranetUsageHistory.push(currentIntranetUsageFrame);
            if (usage.intranetUsageHistory.length > this.maxHistoryLength) {
                usage.intranetUsageHistory.splice(0, 1);
            }
            usage.internetUsageHistory.push(currentInternetUsageFrame);
            if (usage.internetUsageHistory.length > this.maxHistoryLength) {
                usage.internetUsageHistory.splice(0, 1);
            }
            usageUpdates.push({
                macAddress: usage.device.macAddress,
                intranetFrame: currentIntranetUsageFrame,
                internetFrame: currentInternetUsageFrame
            });

            usage.currentIntranetUsageFrame = {
                bandwidth: {
                    upBytes: 0,
                    downBytes: 0
                },
                frameStart: now
            };

            usage.currentInternetUsageFrame = {
                bandwidth: {
                    upBytes: 0,
                    downBytes: 0
                },
                frameStart: now
            };
        });
        this.emit('usage-data', usageUpdates);
    }

}