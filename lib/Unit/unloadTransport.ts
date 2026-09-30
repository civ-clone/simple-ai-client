// Generic: a transport at the coast unloads any cargo that hasn't just come from the neighbouring land.
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Memory from '../Memory';
import Tile from '@civ-clone/core-world/Tile';
import { Unload } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';

// Returns whether it unloaded, in which case the transport waits so the unloaded units can be moved first.
export const unloadTransport = (
  memory: Memory,
  unit: Unit,
  tile: Tile,
  unload: Unload | undefined
): boolean => {
  if (
    unit instanceof NavalTransport &&
    unload &&
    tile.isCoast() &&
    unit
      .cargo()
      .some(
        (unit: Unit): boolean =>
          !tile
            .getNeighbours()
            .some((tile: Tile): boolean =>
              (memory.lastUnitMoves.get(unit) || []).includes(tile)
            )
      )
  ) {
    unit.action(unload);

    unit.setWaiting();

    // skip out to allow the unloaded units to be moved.
    return true;
  }

  return false;
};

export default unloadTransport;
