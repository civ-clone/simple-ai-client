import { Rates } from '../tradeRates';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { DisorderPolicy, UncalmedReason } from '../City/disorder';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
export interface TradeRatePolicy {
  inDisorder(dependencies: Dependencies, city: City): boolean;
  onTheEdge(dependencies: Dependencies, city: City): boolean;
  scienceStopped(dependencies: Dependencies, player: Player): boolean;
}
export declare const extraLuxuries: (
  uncalmed: Iterable<UncalmedReason>
) => number;
export declare const adjustTradeRates: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  disorderPolicy: DisorderPolicy,
  policy: TradeRatePolicy
) => Rates | null;
export default adjustTradeRates;
