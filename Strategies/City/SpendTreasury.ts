// Generic: at the end of the player's turn, once its cities are calm and its rates are set, spends its treasury over a
//  reserve on finishing what its cities are building (`lib/City/spendTreasury`), with the ruleset's `SpendingPolicy`.
import spendTreasury, { SpendingPolicy } from '../../lib/City/spendTreasury';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class SpendTreasury extends AIStrategy {
  private _policy: SpendingPolicy;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: SpendingPolicy
  ) {
    super(dependencies, knowledge);

    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return action instanceof AfterTurn;
  }

  attempt(action: AfterTurn): boolean {
    spendTreasury(
      this.dependencies(),
      this.knowledge(),
      this._policy,
      action.player()
    );

    return true;
  }
}

export default SpendTreasury;
