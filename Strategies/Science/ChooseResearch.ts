// Generic: picks what to research next, at random from what's available. Always handles the choice.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import chooseResearch from '../../lib/Science/chooseResearch';

export class ChooseResearch extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof PlayerResearch;
  }

  attempt(action: PlayerAction<PlayerResearch>): boolean {
    chooseResearch(this.dependencies(), action.value());

    return true;
  }
}

export default ChooseResearch;
