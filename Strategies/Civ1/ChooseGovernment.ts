// Civ1: once the Anarchy is over, Monarchy if it's available, otherwise the first government that is. Always handles
//  the choice.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { pickGovernment } from '../../lib/Civ1/government';

export class ChooseGovernment extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof PlayerGovernment;
  }

  attempt(action: PlayerAction<PlayerGovernment>): boolean {
    pickGovernment(this.dependencies(), action.value());

    return true;
  }
}

export default ChooseGovernment;
