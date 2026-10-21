// Generic: a transport at the coast unloads its cargo where it's meant to go ashore, then waits.
//  - Passengers with an overseas plan (`lib/Unit/overseas`) go ashore only beside their target's landmass.
//  - Other cargo goes ashore anywhere but the landmass it set out from, or, where that isn't known (cargo from before
//    a load), anywhere it hasn't just come from (civ-clone/web-renderer#211).
import { dropPassenger, originOf, overseasStateFor } from './overseas';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Tile from '@civ-clone/core-world/Tile';
import { Unload } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';

// Whether `unit`, aboard a transport on `tile`, should go ashore here.
const goesAshore = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  tile: Tile
): boolean => {
  const land = tile
      .getNeighbours()
      .filter((neighbour: Tile): boolean => neighbour.isLand()),
    passenger = overseasStateFor(memory).passengers.get(unit),
    origin = originOf(memory, unit);

  if (passenger) {
    const destination = continentOf(
      dependencies.turn.value(),
      passenger.target
    );

    return land.some((neighbour: Tile): boolean => destination.has(neighbour));
  }

  if (origin) {
    return land.some((neighbour: Tile): boolean => !origin.has(neighbour));
  }

  return !land.some((neighbour: Tile): boolean =>
    (memory.lastUnitMoves.get(unit) || []).includes(neighbour)
  );
};

// The turn each transport last unloaded.
const unloaded = new WeakMap<object, number>();

// Returns whether it unloaded, in which case the transport waits so the unloaded units can be moved first. Once a turn:
//  in port, its cargo stays aboard as it takes up its own orders, and unloading again woke the units it had just
//  unloaded, which fortified again, for as long as the turn's action limit allowed (civ-clone/web-renderer#377).
export const unloadTransport = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  tile: Tile,
  unload: Unload | undefined
): boolean => {
  const turn = dependencies.turn.value();

  if (
    !(unit instanceof NavalTransport && unload && tile.isCoast()) ||
    unloaded.get(unit) === turn
  ) {
    return false;
  }

  const cargo = (unit as unknown as { cargo(): Unit[] }).cargo();

  if (
    !cargo.some((passenger: Unit): boolean =>
      goesAshore(dependencies, memory, passenger, tile)
    )
  ) {
    return false;
  }

  unit.action(unload);
  unloaded.set(unit, turn);

  // Ashore, or about to be: they're passengers no longer, and carry on with their own work from here.
  cargo.forEach((passenger: Unit): void => {
    dropPassenger(memory, passenger);
    overseasStateFor(memory).origins.delete(passenger);
  });

  unit.setWaiting();

  // skip out to allow the unloaded units to be moved.
  return true;
};

export default unloadTransport;
