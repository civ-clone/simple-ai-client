// Generic: a transport's turn as a ferry (`lib/Unit/ferry`): taking passengers overseas, or sailing to a port where
//  they're waiting (civ-clone/web-renderer#211, #374). Handles the action only then; otherwise the transport explores
//  (`MissionAndMove`).
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import ferry from '../../lib/Unit/ferry';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';

export class Ferry extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action) && action.value() instanceof NavalTransport;
  }

  attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player();

    return ferry(
      this.dependencies(),
      player,
      this.memoryFor(player),
      this.knowledge(),
      action.value()
    );
  }
}

export default Ferry;
