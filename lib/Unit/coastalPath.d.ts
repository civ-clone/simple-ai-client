import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const coastalPath: (
  unit: Unit,
  to: Tile,
  limit?: number
) => Path | null;
export default coastalPath;
