import { Device } from "../Device";
import { UsageFrame } from "./UsageFrame";

export interface UsageHistory {
    device: Device;
    intranetUsageHistory: UsageFrame[];
    internetUsageHistory: UsageFrame[];
}