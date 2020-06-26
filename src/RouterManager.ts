import * as Netgear from 'netgear';
import { Observable, Subject } from 'rxjs';
import { ConnectionChanges } from './models/events/ConnectionChanges';
import { Device } from './models/Device';


export class RouterManager {
    private router = new Netgear();
    private devices: Device[] = [];
    private connectionChanges = new Subject<ConnectionChanges>();

    public async Initialize(): Promise<void> {
        await this.login();
        console.log("Logged into router");
        this.findConnectionChanges();
        setInterval(this.findConnectionChanges.bind(this), 5000);
    }

    public GetConnectionChanges(): Observable<ConnectionChanges> {
        return this.connectionChanges.asObservable();
    }

    private async findConnectionChanges() {
        const routerReportedDevices = await this.router.getAttachedDevices(2);
        const attachedDevices = routerReportedDevices.map((attachedDevice): Device => ({
            name: attachedDevice.Name,
            ipAddress: attachedDevice.IP,
            macAddress: attachedDevice.MAC
        }));
        const connectionChanges = {
            connects: attachedDevices.filter((attachedDevice) => this.devices.findIndex((device) => {
                return device.macAddress === attachedDevice.macAddress
            }) === -1),
            disconnects: this.devices.filter((device) => attachedDevices.findIndex((attachedDevice) => {
                return device.macAddress == attachedDevice.macAddress
            }) === -1)
        };
        this.connectionChanges.next(connectionChanges);
        
        this.devices = attachedDevices;
    }

    private async login() {
        await this.router.discover();
        await this.router.login({
            username: process.env.ROUTER_USERNAME ?? 'admin',
            password: process.env.ROUTER_PASSWORD ?? 'admin'
        });
    }
}