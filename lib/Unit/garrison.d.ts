import Dependencies from '../Dependencies';
import { Fortify } from '@civ-clone/library-unit/Actions';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const garrison: (
  dependencies: Dependencies,
  unit: Unit,
  tile: Tile,
  tileUnits: Unit[],
  fortify: Fortify | undefined
) => boolean;
export default garrison;
