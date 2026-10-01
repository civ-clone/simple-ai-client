import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
import Unit from '@civ-clone/core-unit/Unit';
export interface ProductionPolicy {
  attackersPerCity: number;
  explorers: number;
  explorersPerCity: number;
}
export declare const defaultProductionPolicy: ProductionPolicy;
export declare const isAttacker: (unit: Unit) => boolean;
export declare const buildItemInCity: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  policy?: ProductionPolicy,
  knowledge?: Knowledge
) => void;
export default buildItemInCity;
