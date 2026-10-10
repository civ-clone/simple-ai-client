// Generic: picks what to research next, at random from what's available, preferring the advances the player's leader
//  wants (`wantedAdvances`). Always handles the choice.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import chooseResearch from '../../lib/Science/chooseResearch';
import wantedAdvances from '../../lib/Science/wantedAdvances';

export class ChooseResearch extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof PlayerResearch;
  }

  attempt(action: PlayerAction<PlayerResearch>): boolean {
    const playerResearch = action.value();

    chooseResearch(
      this.dependencies(),
      playerResearch,
      wantedAdvances(this.dependencies(), playerResearch.player()) ?? []
    );

    return true;
  }
}

export default ChooseResearch;
