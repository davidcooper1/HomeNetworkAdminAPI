import * as express from 'express';
import * as http from 'http';
import { RouterManager } from './RouterManager';
import { UsageMonitor } from './UsageMonitor';
import { LiveUsageSocketManager } from './LiveUsageSocketManager';
import { PacketMonitor } from './PacketMonitor';

//const app = express();
const httpServer = http.createServer();
const port = +process.env.PORT || 8000;

(async () => {
    
    const routerManager = new RouterManager();
    const packetMonitor = new PacketMonitor();
    const usageMonitor = new UsageMonitor(routerManager, packetMonitor);
    const liveUsageSocketManager = new LiveUsageSocketManager(httpServer, usageMonitor);
    await routerManager.Initialize();
    packetMonitor.Initialize();

    httpServer.listen(8000, () => console.log(`Server listening at port ${port}`));
})();