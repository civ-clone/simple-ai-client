// Generic: the context of the unit turn a mandatory action stands for, created by whichever unit strategy asks first
//  and shared by the rest, so it's read (and the move history seeded) once per action, as before the split.
import createUnitTurnContext, {
  UnitTurnContext,
} from '../../lib/Unit/unitTurnContext';
import Dependencies from '../../lib/Dependencies';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';

// Keyed by the action object, which `Player#mandatoryAction` creates afresh each time, so nothing outlives its action.
const contexts: WeakMap<PlayerAction, UnitTurnContext> = new WeakMap();

export const unitTurnContextFor = (
  dependencies: Dependencies,
  action: PlayerAction<Unit>
): UnitTurnContext => {
  let context = contexts.get(action);

  if (!context) {
    context = createUnitTurnContext(
      dependencies,
      dependencies.memoryRegistry.memoryFor(action.player()),
      action.value()
    );

    contexts.set(action, context);
  }

  return context;
};

export default unitTurnContextFor;
