// Generic: a worker's turn: found a city, irrigate, mine or build a road where it stands, or else take a city site to
//  head for, then move. Always handles a worker.
import { Worker } from '@civ-clone/library-unit/Types';
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import moveUnit from '../../lib/Unit/moveUnit';
import settlerWork from '../../lib/Unit/settlerWork';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class WorkerTurn extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof Worker;
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      {
        actions: { buildIrrigation, buildMine, buildRoad, foundCity },
        target,
        tile,
      } = unitTurnContextFor(this.dependencies(), action);

    settlerWork(
      this.dependencies(),
      player,
      memory,
      this.knowledge(),
      unit,
      tile,
      target,
      {
        buildIrrigation,
        buildMine,
        buildRoad,
        foundCity,
      }
    );

    await moveUnit(this.dependencies(), player, memory, this.knowledge(), unit);

    return true;
  }
}

export default WorkerTurn;
