import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
export interface SpendingPolicy {
  reserve(dependencies: Dependencies, player: Player): number;
  minTurns: number;
  wonderRemaining: number;
}
export type PurchaseKind = 'defender' | 'build' | 'wonder';
export interface Purchase {
  city: City;
  kind: PurchaseKind;
  price: number;
  value: number;
}
export declare const purchases: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  policy: SpendingPolicy,
  player: Player
) => Purchase[];
export declare const spendTreasury: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  policy: SpendingPolicy,
  player: Player
) => number;
export default spendTreasury;
