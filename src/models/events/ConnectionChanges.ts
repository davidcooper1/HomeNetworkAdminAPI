import { Device } from '../Device';

export interface ConnectionChanges {
    connects: Device[];
    disconnects: Device[];
}