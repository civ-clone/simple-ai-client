import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
export declare const hasTreaty: (
  dependencies: Dependencies,
  player: Player,
  other: Player
) => boolean;
export declare const isAlly: (
  dependencies: Dependencies,
  player: Player,
  other: Player
) => boolean;
export declare const alliedCityAt: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => City | null;
