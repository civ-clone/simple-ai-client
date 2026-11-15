import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const SABOTAGE_WORTH: number;
export declare const unitCost: (
  dependencies: Dependencies,
  unit: Unit
) => number;
export declare const worthSabotaging: (
  dependencies: Dependencies,
  player: Player,
  spy: Unit,
  tile: Tile
) => boolean;
export default worthSabotaging;
