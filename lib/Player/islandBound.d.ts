import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
export declare const islandBound: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  player: Player,
  memory: Memory
) => boolean;
export default islandBound;
