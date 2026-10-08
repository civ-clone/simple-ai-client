// Generic: at the end of the player's turn, once its units have moved, keeps its cities out of civil disorder
//  (`lib/City/disorder`), with the ruleset's `DisorderPolicy`.
import preventDisorder, { DisorderPolicy } from '../../lib/City/disorder';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class PreventDisorder extends AIStrategy {
  private _policy: DisorderPolicy;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: DisorderPolicy
  ) {
    super(dependencies, knowledge);

    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return action instanceof AfterTurn;
  }

  attempt(action: AfterTurn): boolean {
    const player = action.player();

    preventDisorder(
      this.dependencies(),
      player,
      this.memoryFor(player),
      this.knowledge(),
      this._policy
    );

    return true;
  }
}

export default PreventDisorder;
