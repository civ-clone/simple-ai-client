// Once the ruleset's revolution allows the choice, the government the player would choose now (`lib/Civ1/government`).
//  Handles the choice unless the ruleset names no revolution (no `RevolutionTerms`).
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { pickGovernment } from '../../lib/Civ1/government';

export class ChooseGovernment extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof PlayerGovernment;
  }

  attempt(action: PlayerAction<PlayerGovernment>): boolean {
    return pickGovernment(this.dependencies(), action.value());
  }
}

export default ChooseGovernment;
