import { Server } from 'http';
import { Socket } from 'socket.io';
import * as io from 'socket.io';

import { UsageMonitor } from './UsageMonitor';
import { UsageHistory } from './models/usage/UsageHistory';
import { Device } from './models/Device';
import { UsageUpdate } from './models/usage/UsageUpdate';

export class LiveUsageSocketManager {

    private _usageSocket;

    constructor(httpServer: Server, private _usageMonitor: UsageMonitor) {
        this._usageSocket = io(httpServer, {
            path: '/api/live-usage'
        });
        this._usageSocket.origins('*:*');

        this._usageSocket.on('connection', this.initializeConnection.bind(this));
    }

    private initializeConnection(socket: Socket) {
        const sendLiveUsage = (usage: UsageUpdate[]) => {
            socket.emit('usage-data', usage);
        }
        
        const sendConnectEvent = (device: Device) => {
            socket.emit('usage-connect', device);
        }

        const sendDisconnectEvent = (device: Device) => {
            socket.emit('usage-disconnect', device);
        }

        this._usageSocket.emit('usage-init-data', this._usageMonitor.GetUsages().map((usage): UsageHistory => ({
            device: usage.device,
            intranetUsageHistory: usage.intranetUsageHistory,
            internetUsageHistory: usage.internetUsageHistory
        })));

        this._usageMonitor.on('usage-data', sendLiveUsage);
        this._usageMonitor.on('connect', sendConnectEvent);
        this._usageMonitor.on('disconnect', sendDisconnectEvent)
        socket.on('disconnect', () => {
            this._usageMonitor.removeListener('usage-data', sendLiveUsage);
            this._usageMonitor.removeListener('connect', sendConnectEvent);
            this._usageMonitor.removeListener('disconnect', sendDisconnectEvent);
        });
    }
}