import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const waitForCarrier: (
  dependencies: Dependencies,
  player: Player,
  knowledge: Knowledge,
  unit: Unit
) => boolean;
export default waitForCarrier;
