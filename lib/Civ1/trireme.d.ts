import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const triremeCanReturn: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  action: Action
) => boolean;
export default triremeCanReturn;
