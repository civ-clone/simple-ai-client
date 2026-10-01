import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
export interface ProductionPolicy {
  attackersPerCity: number;
  explorers: number;
  explorersPerCity: number;
  maxExplorers: number;
  settlers: number;
  settlersPerCity: number;
  buildTurns: {
    improvement: number;
    unit: number;
    wonder: number;
  };
  wonderShields: number;
}
export declare const defaultProductionPolicy: ProductionPolicy;
export declare const isAttacker: (unit: Unit) => boolean;
export declare const chooseUnit: (
  dependencies: Dependencies,
  city: City,
  buildItems: BuildItem[],
  YieldType: typeof Yield,
  policy?: ProductionPolicy,
  orSoonest?: boolean,
  turnsToBuild?: (buildItem: BuildItem) => number
) => typeof Unit | undefined;
export declare const buildItemInCity: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  policy?: ProductionPolicy,
  knowledge?: Knowledge
) => void;
export default buildItemInCity;
