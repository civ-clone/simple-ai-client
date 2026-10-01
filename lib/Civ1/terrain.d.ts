import { TerrainPolicy } from '../Unit/terrainWork';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
export declare const isACityTile: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export declare const shouldBuildCity: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export declare const shouldIrrigate: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export declare const shouldMine: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export declare const shouldRoad: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export declare const civ1TerrainPolicy: TerrainPolicy;
