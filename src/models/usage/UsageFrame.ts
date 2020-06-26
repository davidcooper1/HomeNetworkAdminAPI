import { Bandwidth } from './Bandwidth';

export interface UsageFrame {
    bandwidth: Bandwidth;
    frameStart: Date;
}