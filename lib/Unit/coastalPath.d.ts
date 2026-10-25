import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export interface CoastalPathOptions {
  known?: (tile: Tile) => boolean;
  canEnter?: (tile: Tile) => boolean;
  limit?: number;
}
export declare const coastalPath: (
  unit: Unit,
  to: Tile,
  { known, canEnter, limit }?: CoastalPathOptions
) => Path | null;
export default coastalPath;
