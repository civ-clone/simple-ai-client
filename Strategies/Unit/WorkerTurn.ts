// Generic: a worker's turn: found a city, irrigate, mine or build a road where it stands, or else take a city site to
//  head for, then move. With no site to head for and no step worth taking, it joins one of the player's cities, or
//  waits in one (`lib/Unit/idleWorker`), rather than step back and forth at random (civ-clone/web-renderer#230,
//  #243). Always handles a worker.
import moveUnit, { hasStepWorthTaking } from '../../lib/Unit/moveUnit';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import idleWorker from '../../lib/Unit/idleWorker';
import {
  planPassenger,
  settlesOverseas,
  travel,
} from '../../lib/Unit/overseas';
import settlerWork from '../../lib/Unit/settlerWork';
import unitTurnContextFor from '@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor';

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

    // One of the founders its leader sends overseas before home is full, with no site of its own yet:
    //  it goes for one overseas, if there is one it could be ferried to (`lib/Unit/overseas`, civ-clone/web-renderer#374).
    if (
      !memory.unitTargetData.has(unit) &&
      settlesOverseas(this.dependencies(), player, memory, unit)
    ) {
      const passenger = planPassenger(
        this.dependencies(),
        player,
        memory,
        unit,
        'founder',
        memory.targets.goodSitesForCities
      );

      if (passenger) {
        if (!travel(this.dependencies(), player, memory, unit, passenger)) {
          await moveUnit(
            this.dependencies(),
            player,
            memory,
            this.knowledge(),
            unit
          );
        }

        return true;
      }
    }

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
      // A city site on another landmass, with nothing to do here: it goes overseas (`lib/Unit/overseas`,
      //  civ-clone/web-renderer#374), from its port.
      const passenger = planPassenger(
        this.dependencies(),
        player,
        memory,
        unit,
        'founder',
        memory.targets.goodSitesForCities
      );

      if (passenger) {
        if (!travel(this.dependencies(), player, memory, unit, passenger)) {
          await moveUnit(
            this.dependencies(),
            player,
            memory,
            this.knowledge(),
            unit
          );
        }

        return true;
      }

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
