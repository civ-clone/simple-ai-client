import { UnitTurnContext } from '../../lib/Unit/unitTurnContext';
import Dependencies from '../../lib/Dependencies';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare const unitTurnContextFor: (
  dependencies: Dependencies,
  action: PlayerAction<Unit>
) => UnitTurnContext;
export default unitTurnContextFor;
