import { Device } from '../Device';
import { Bandwidth } from './Bandwidth';
import { UsageFrame } from './UsageFrame';

export interface Usage {
    device: Device;
    currentIntranetUsageFrame: UsageFrame;
    currentInternetUsageFrame: UsageFrame;
    intranetUsageHistory: UsageFrame[];
    internetUsageHistory: UsageFrame[];
}