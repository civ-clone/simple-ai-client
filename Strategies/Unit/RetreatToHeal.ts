// Generic: a damaged unit rests, or heads for one of its player's cities, to heal (`lib/Unit/retreatToHeal`). Only a
//  unit with damage is handled, and that is asked before anything else is read, so in a ruleset that deals none (Civ1)
//  this strategy never handles a unit.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import retreatToHeal, { healsThisTurn } from '../../lib/Unit/retreatToHeal';

export class RetreatToHeal extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return (
      isUnitAction(action) &&
      action.value().damage() > 0 &&
      healsThisTurn(this.dependencies(), action.value())
    );
  }

  attempt(action: PlayerAction<Unit>): Promise<boolean> {
    return retreatToHeal(
      this.dependencies(),
      action.player(),
      this.memoryFor(action.player()),
      this.knowledge(),
      action.value()
    );
  }
}

export default RetreatToHeal;
