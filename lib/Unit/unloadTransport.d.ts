import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Tile from '@civ-clone/core-world/Tile';
import { Unload } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
export declare const unloadTransport: (
  memory: Memory,
  unit: Unit,
  tile: Tile,
  unload: Unload | undefined
) => boolean;
export default unloadTransport;
