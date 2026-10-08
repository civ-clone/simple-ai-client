// Generic: at the start of a turn, gives orders to aircraft resting aboard the player's carriers.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';

// An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
export const wakeCarrierAircraft = (
  dependencies: Dependencies,
  player: Player,
  knowledge: Knowledge
): void =>
  dependencies.unitRegistry
    .getByPlayer(player)
    .flatMap((unit: Unit): Unit[] =>
      unit instanceof NavalTransport && !unit.destroyed() ? unit.cargo() : []
    )
    .filter(
      (unit: Unit): boolean =>
        knowledge.isAircraft(dependencies, unit) && !unit.active()
    )
    .forEach((aircraft: Unit): void => {
      aircraft.setBusy();
      aircraft.setActive();
    });

export default wakeCarrierAircraft;
