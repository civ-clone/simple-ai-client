// Generic: at the start of each turn, gives orders to aircraft resting aboard the player's carriers.
import AIStrategy from '../lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import wakeCarrierAircraft from '../../lib/Turn/wakeCarrierAircraft';

export class WakeCarrierAircraft extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action instanceof BeforeTurn;
  }

  attempt(action: BeforeTurn): boolean {
    wakeCarrierAircraft(this.dependencies(), action.player(), this.knowledge());

    return true;
  }
}

export default WakeCarrierAircraft;
