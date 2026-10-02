// Generic: a worker's turn: found a city, irrigate, mine or build a road where it stands, or else take a city site to
//  head for, then move. With no site to head for and no step worth taking, it joins one of the player's cities, or
//  waits in one (`lib/Unit/idleWorker`), rather than step back and forth at random (civ-clone/web-renderer#230,
//  #243). Always handles a worker.
import moveUnit, { hasStepWorthTaking } from '../../lib/Unit/moveUnit';
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import idleWorker from '../../lib/Unit/idleWorker';
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
      { actions, target, tile } = unitTurnContextFor(
        this.dependencies(),
        action
      ),
      { buildIrrigation, buildMine, buildRoad, foundCity } = actions;

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

    // `TerrainWork` has found it no terrain job, and `settlerWork` no site and nothing to do where it stands.
    if (
      !unit.destroyed() &&
      unit.active() &&
      unit.moves().value() >= 0.1 &&
      unit.tile() === tile &&
      !memory.unitTargetData.has(unit) &&
      !hasStepWorthTaking(
        this.dependencies(),
        player,
        memory,
        this.knowledge(),
        unit
      )
    ) {
      await idleWorker(
        this.dependencies(),
        player,
        memory,
        this.knowledge(),
        unit,
        actions
      );

      return true;
    }

    await moveUnit(this.dependencies(), player, memory, this.knowledge(), unit);

    return true;
  }
}

export default WorkerTurn;
