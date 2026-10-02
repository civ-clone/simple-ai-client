import { ActionLookup } from '../actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const couldJoin: (
  dependencies: Dependencies,
  unit: Unit,
  city: City
) => boolean;
export declare const idleWorker: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  actions: ActionLookup
) => Promise<void>;
export default idleWorker;
