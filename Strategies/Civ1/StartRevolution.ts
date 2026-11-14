// At the start of each turn, starts the loaded ruleset's revolution, as a human player would, when the player would
//  choose another government than the one it has (`lib/Civ1/government`, through the ruleset's `RevolutionTerms`).
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import { startRevolution } from '../../lib/Civ1/government';

export class StartRevolution extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action instanceof BeforeTurn;
  }

  attempt(action: BeforeTurn): boolean {
    startRevolution(this.dependencies(), action.player());

    return true;
  }
}

export default StartRevolution;
