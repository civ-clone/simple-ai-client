import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const ferry: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  ship: Unit
) => Promise<boolean>;
export default ferry;
