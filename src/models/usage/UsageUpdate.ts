import { UsageFrame } from "./UsageFrame";

export interface UsageUpdate {
    macAddress: string;
    intranetFrame: UsageFrame;
    internetFrame: UsageFrame;
}