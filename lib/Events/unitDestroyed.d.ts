import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const unitDestroyed: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  by: Player | null,
  buildItemInCity: (city: City) => void
) => void;
export default unitDestroyed;
