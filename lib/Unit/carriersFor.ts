// Generic: the `Carrier`s (any `NavalTransport` that can stow it) an aircraft could land on.
import Dependencies from '../Dependencies';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';

// Our `Carrier`s that `unit` could land on. One it's already aboard counts even when full: taking off frees its slot.
export const carriersFor = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Unit[] =>
  dependencies.unitRegistry
    .getByPlayer(player)
    .filter(
      (tileUnit: Unit): boolean =>
        tileUnit instanceof NavalTransport &&
        !tileUnit.destroyed() &&
        (tileUnit.hasCapacity() || tileUnit.cargo().includes(unit)) &&
        tileUnit.canStow(unit)
    );

export default carriersFor;
