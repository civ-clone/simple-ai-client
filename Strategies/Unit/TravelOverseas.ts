// Generic: a passenger's turn (`lib/Unit/overseas`): walking to its port, boarding a transport alongside, or waiting
//  in port for one (civ-clone/web-renderer#211, #374), and any land unit's turn at sea. Handles the action only for a unit with an overseas plan that
//  still holds; otherwise the next strategies give it work.
import {
  candidatesFor,
  dropPassenger,
  overseasStateFor,
  planPassenger,
  travel,
} from '../../lib/Unit/overseas';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import { Land } from '@civ-clone/library-unit/Types';
import moveUnit from '../../lib/Unit/moveUnit';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

// A land unit on a water tile: aboard a ship, or unloaded beside a coast.
const isAtSea = (unit: Unit): boolean =>
  unit instanceof Land && unit.tile().isWater();

export class TravelOverseas extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return (
      isUnitAction(action) &&
      (overseasStateFor(this.memoryFor(action.player())).passengers.has(
        action.value()
      ) ||
        isAtSea(action.value()))
    );
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      known = overseasStateFor(memory).passengers.get(unit);

    // At sea: a passenger waits for its ship to put it ashore (`unloadTransport`). Any other land unit goes ashore if
    //  it can, and otherwise waits: next to a coast held by an enemy, it may have nowhere to step.
    if (isAtSea(unit)) {
      if (!known) {
        await moveUnit(
          this.dependencies(),
          player,
          memory,
          this.knowledge(),
          unit
        );
      }

      if (unit.active() && unit.moves().value() > 0) {
        noOrders(this.dependencies(), unit);
      }

      return true;
    }

    if (!known) {
      return false;
    }

    const passenger = planPassenger(
      this.dependencies(),
      player,
      memory,
      unit,
      known.role,
      candidatesFor(
        this.dependencies(),
        this.knowledge(),
        player,
        memory,
        unit,
        known.role
      )
    );

    if (!passenger) {
      dropPassenger(memory, unit);

      return false;
    }

    if (travel(this.dependencies(), player, memory, unit, passenger)) {
      return true;
    }

    await moveUnit(this.dependencies(), player, memory, this.knowledge(), unit);

    return true;
  }
}

export default TravelOverseas;
