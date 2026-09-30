// Generic: whether a player action is about one of the player's units, the way `SimpleAIClient` has always told.
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';

export const isUnitAction = (
  action: PlayerAction
): action is PlayerAction<Unit> => action.value() instanceof Unit;

export default isUnitAction;
