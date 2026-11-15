// Generic: holds an aircraft back until the player's carriers have moved.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import carriesUnits from './carriesUnits';

// Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn. Returns
//  whether `unit` was told to wait.
export const waitForCarrier = (
  dependencies: Dependencies,
  player: Player,
  knowledge: Knowledge,
  unit: Unit
): boolean => {
  if (
    !unit.waiting() &&
    knowledge.isAircraft(dependencies, unit) &&
    dependencies.unitRegistry
      .getByPlayer(player)
      .some(
        (carrier: Unit): boolean =>
          carriesUnits(carrier) &&
          carrier.canStow(unit) &&
          carrier.active() &&
          carrier.moves().value() > 0
      )
  ) {
    unit.setWaiting();

    return true;
  }

  return false;
};

export default waitForCarrier;
