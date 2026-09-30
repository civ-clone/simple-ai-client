import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const waitForCarrier: (
  dependencies: Dependencies,
  player: Player,
  knowledge: Knowledge,
  unit: Unit
) => boolean;
export default waitForCarrier;
