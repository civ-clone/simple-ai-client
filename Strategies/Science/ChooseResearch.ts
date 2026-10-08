// Generic: picks what to research next, at random from what's available, preferring the advances the player's leader
//  wants by the ruleset's `WantedAdvancesPolicy`, if it's given one. Always handles the choice.
import {
  WantedAdvancesPolicy,
  wantedAdvances,
} from '../../lib/Science/wantedAdvances';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import chooseResearch from '../../lib/Science/chooseResearch';

export class ChooseResearch extends AIStrategy {
  private _policy: WantedAdvancesPolicy | null;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: WantedAdvancesPolicy | null = null
  ) {
    super(dependencies, knowledge);

    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return action.value() instanceof PlayerResearch;
  }

  attempt(action: PlayerAction<PlayerResearch>): boolean {
    const playerResearch = action.value();

    chooseResearch(
      this.dependencies(),
      playerResearch,
      this._policy === null
        ? []
        : wantedAdvances(
            this.dependencies(),
            playerResearch.player(),
            this._policy
          )
    );

    return true;
  }
}

export default ChooseResearch;
