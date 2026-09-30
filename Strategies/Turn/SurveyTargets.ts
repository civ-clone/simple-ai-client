// Generic: at the start of each turn, surveys everything the player can see and refills its target board.
import AIStrategy from '../lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import surveyTargets from '../../lib/Turn/surveyTargets';

export class SurveyTargets extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action instanceof BeforeTurn;
  }

  attempt(action: BeforeTurn): boolean {
    const player = action.player();

    surveyTargets(
      this.dependencies(),
      player,
      this.memoryFor(player),
      this.knowledge()
    );

    return true;
  }
}

export default SurveyTargets;
