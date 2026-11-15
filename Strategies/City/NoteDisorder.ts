// Generic: at the start of the player's turn (`BeforeTurn`), before any other strategy has changed anything (a revolution,
//  its workers), lets the ruleset's `DisorderPolicy` note what it needs of the player's cities (`turnStart`), for
//  `PreventDisorder` at the end of the turn. Registered first for that reason.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { DisorderPolicy } from '../../lib/City/disorder';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class NoteDisorder extends AIStrategy {
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
    return action instanceof BeforeTurn;
  }

  attempt(action: BeforeTurn): boolean {
    this._policy.turnStart?.(this.dependencies(), action.player());

    return true;
  }
}

export default NoteDisorder;
