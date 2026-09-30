// Civ1: at the start of each turn, once Monarchy is known, starts a revolution, as a human player would.
import AIStrategy from '../lib/AIStrategy';
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
