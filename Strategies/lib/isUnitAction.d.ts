import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare const isUnitAction: (
  action: PlayerAction
) => action is PlayerAction<Unit>;
export default isUnitAction;
