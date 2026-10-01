import { ActionLookup } from '../actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
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
