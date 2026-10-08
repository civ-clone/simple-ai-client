import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Fortify } from '@civ-clone/library-unit/Actions';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import { SetHomeCity } from '@civ-clone/library-unit/Actions';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const garrison: (
  dependencies: Dependencies,
  unit: Unit,
  tile: Tile,
  tileUnits: Unit[],
  fortify: Fortify | undefined,
  knowledge: Knowledge,
  setHomeCity?: SetHomeCity
) => boolean;
export default garrison;
