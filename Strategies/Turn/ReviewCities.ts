// Generic: at the start of each turn, assigns each of the player's cities' workers and notes any city left undefended.
import AIStrategy from '../lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import reviewCities from '../../lib/Turn/reviewCities';

export class ReviewCities extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action instanceof BeforeTurn;
  }

  attempt(action: BeforeTurn): boolean {
    const player = action.player();

    reviewCities(
      this.dependencies(),
      player,
      this.memoryFor(player).targets,
      this.knowledge()
    );

    return true;
  }
}

export default ReviewCities;
