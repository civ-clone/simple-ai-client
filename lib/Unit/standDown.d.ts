import { ActionLookup } from '../actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export interface StandDownPolicy {
  disband(dependencies: Dependencies, unit: Unit): boolean;
}
export declare const unitsWanted: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
) => number;
export declare const citiesInReach: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => City[];
export declare const firstPath: (
  dependencies: Dependencies,
  unit: Unit,
  cities: City[],
  wanted: (city: City) => boolean
) => Path | null;
export declare const goAlong: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  path: Path,
  arrived: () => void
) => Promise<void>;
export declare const standDown: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: StandDownPolicy,
  unit: Unit,
  actions: ActionLookup
) => Promise<void>;
export default standDown;
