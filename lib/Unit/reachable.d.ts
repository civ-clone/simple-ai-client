import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const terrainFor: (
  unit: Unit
) => ((tile: Tile) => boolean) | null;
export declare const reachableTiles: (unit: Unit) => Set<Tile> | null;
export default reachableTiles;
