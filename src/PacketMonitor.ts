import { Subject, Observable } from "rxjs";
import { networkInterfaces } from 'os';
import * as pcap from 'pcap';

export class PacketMonitor {

    public packets = new Subject<any>();

    public Initialize() {
        this.getNonLoopbackInterfaces().forEach((interfaceName) => {
            console.log("Using interface: ", interfaceName);
            pcap.createSession(interfaceName).on('packet', function(raw_packet) {
                this.packets.next(raw_packet);
            }.bind(this));
        });
    }

    public GetRawPackets(): Observable<any> {
        return this.packets.asObservable();
    }

    private getNonLoopbackInterfaces() {
        const interfaces = networkInterfaces();
        return Object.keys(interfaces).filter((key) => {
            return interfaces[key].findIndex((address) => address.address === '127.0.0.1') === -1;
        });
    }

}