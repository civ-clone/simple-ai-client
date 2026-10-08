import { ActionLookup } from '@civ-clone/base-strategy-ai/lib/actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
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
