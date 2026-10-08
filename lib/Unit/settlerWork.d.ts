import { ActionLookup } from '@civ-clone/base-strategy-ai/lib/actionLookup';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const settlerWork: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  target: Tile | undefined,
  { buildIrrigation, buildMine, buildRoad, foundCity }: ActionLookup
) => void;
export default settlerWork;
