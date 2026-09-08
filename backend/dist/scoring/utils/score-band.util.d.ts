import { ScoreBand } from '../interfaces/rule-result.interface';
interface BandInfo {
    readonly band: ScoreBand;
    readonly label: string;
}
export declare function getScoreBand(score: number): BandInfo;
export {};
