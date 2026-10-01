// Generic: at the end of the player's turn, once `PreventDisorder` has calmed its cities, sets its tax, luxury and
//  science rates (`lib/Turn/adjustTradeRates`), with the ruleset's `DisorderPolicy` and `TradeRatePolicy`.
import adjustTradeRates, {
  TradeRatePolicy,
} from '../../lib/Turn/adjustTradeRates';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import { DisorderPolicy } from '../../lib/City/disorder';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class TradeRates extends AIStrategy {
  private _disorderPolicy: DisorderPolicy;
  private _policy: TradeRatePolicy;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    disorderPolicy: DisorderPolicy,
    policy: TradeRatePolicy
  ) {
    super(dependencies, knowledge);

    this._disorderPolicy = disorderPolicy;
    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return action instanceof AfterTurn;
  }

  attempt(action: AfterTurn): boolean {
    const player = action.player();

    adjustTradeRates(
      this.dependencies(),
      player,
      this.memoryFor(player),
      this.knowledge(),
      this._disorderPolicy,
      this._policy
    );

    return true;
  }
}

export default TradeRates;
