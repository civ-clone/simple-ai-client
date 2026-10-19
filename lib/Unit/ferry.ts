// Generic: a transport's turn as a ferry (civ-clone/web-renderer#211, #374), for `Strategies/Unit/Ferry`. With
//  passengers aboard, it sails, once they're all aboard, to the coast nearest their target and unloads them there
//  (`unloadTransport` unloads). Empty, it sails alongside a port where passengers are waiting (`lib/Unit/overseas`),
//  unless another transport is on its way there already. Otherwise it does nothing here, and goes on exploring, and
//  while it's ferrying the player may build another ship to explore with (civ-clone/web-renderer#440).
import {
  ESCORT_WAIT,
  dropPassenger,
  isFounder,
  overseasStateFor,
  waitingAt,
} from './overseas';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import moveUnit from './moveUnit';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';
import reachableTiles from '@civ-clone/base-strategy-ai/lib/Unit/reachable';

interface Ferry {
  cargo(): Unit[];
  hasCapacity(): boolean;
}

// The turn a transport took its first passenger aboard, so it doesn't wait for more for ever.
const loading = new WeakMap<Unit, number>();

// The water tile `ship` can reach that's beside `landmass`, nearest `target`, if any.
const landingFor = (
  ship: Unit,
  landmass: Set<Tile>,
  target: Tile
): Tile | null => {
  const reachable = reachableTiles(ship);

  return (
    [...(reachable ?? [])]
      .filter(
        (tile: Tile): boolean =>
          tile.isWater() &&
          tile
            .getNeighbours()
            .some((neighbour: Tile): boolean => landmass.has(neighbour))
      )
      .sort(
        (a: Tile, b: Tile): number =>
          a.distanceFrom(target) - b.distanceFrom(target) ||
          a.distanceFrom(ship.tile()) - b.distanceFrom(ship.tile())
      )[0] ?? null
  );
};

const oneStep = (to: Tile): Path => {
  const path = new Path();

  path.push(to);

  return path;
};

// Sets `ship` off towards `to`, then lets the move executor take it. Returns whether it has a way there.
const sailTo = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  ship: Unit,
  to: Tile
): Promise<boolean> => {
  if (ship.tile() === to) {
    noOrders(dependencies, ship);

    return true;
  }

  if (memory.unitPathData.get(ship)?.end() !== to) {
    // One step, as from a port city to the sea beside it, which the path finder finds no way for (it starts on land).
    const path = ship.tile().getNeighbours().includes(to)
      ? oneStep(to)
      : Path.for(ship, ship.tile(), to, dependencies.pathFinderRegistry);

    if (!path) {
      return false;
    }

    memory.unitPathData.set(ship, path);
  }

  await moveUnit(dependencies, player, memory, knowledge, ship);

  return true;
};

// The port beside `ship` that has passengers still waiting in it, if any.
const portBeside = (
  dependencies: Dependencies,
  memory: Memory,
  ship: Unit
): City | null =>
  ship
    .tile()
    .getNeighbours()
    .map((tile: Tile): City | null => dependencies.cityRegistry.getByTile(tile))
    .find(
      (city: City | null): city is City =>
        city !== null && waitingAt(memory, city).length > 0
    ) ?? null;

// Whether a transport with `cargo` aboard sets sail: it's full; or no one else is waiting or on their way to the port
//  it's beside; or it has waited long enough. A lone founder waits a little longer for an escort.
const readyToSail = (
  dependencies: Dependencies,
  memory: Memory,
  ship: Unit,
  cargo: Unit[]
): boolean => {
  const turn = dependencies.turn.value(),
    since = loading.get(ship) ?? turn,
    waited = turn - since,
    port = portBeside(dependencies, memory, ship),
    { passengers } = overseasStateFor(memory),
    stillComing =
      port !== null &&
      [...passengers.entries()].some(
        ([unit, passenger]): boolean =>
          passenger.port === port && !cargo.includes(unit) && !unit.destroyed()
      );

  if (!(ship as unknown as Ferry).hasCapacity() || waited >= ESCORT_WAIT) {
    return true;
  }

  if (cargo.every(isFounder)) {
    return false;
  }

  return !stillComing;
};

const ferryTurn = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  ship: Unit
): Promise<boolean> => {
  // Not `Unit & Ferry`: a type with members of its own isn't assignable to `Unit` (civ-clone/web-renderer#21).
  const cargo = (ship as unknown as Ferry).cargo(),
    { passengers, heading } = overseasStateFor(memory),
    turn = dependencies.turn.value();

  if (cargo.length > 0) {
    heading.delete(ship);

    if (!loading.has(ship)) {
      loading.set(ship, turn);
    }

    const targets = cargo
      .map((unit: Unit): Tile | undefined => passengers.get(unit)?.target)
      .filter((tile): tile is Tile => tile !== undefined);

    // Cargo with no plan (aboard before this, or since a load): `unloadTransport` puts it ashore anywhere new.
    if (targets.length === 0) {
      return false;
    }

    if (!readyToSail(dependencies, memory, ship, cargo)) {
      noOrders(dependencies, ship);

      return true;
    }

    const [target] = targets.sort(
        (a: Tile, b: Tile): number =>
          a.distanceFrom(ship.tile()) - b.distanceFrom(ship.tile())
      ),
      landmass = continentOf(turn, target),
      landing = landingFor(ship, landmass, target);

    if (!landing) {
      // Nowhere to land them: they give up their plans and go ashore where they can.
      cargo.forEach((unit: Unit): void => dropPassenger(memory, unit));

      return false;
    }

    return sailTo(dependencies, player, memory, knowledge, ship, landing);
  }

  loading.delete(ship);

  // Empty: alongside the nearest port with passengers waiting in it that no other transport is sailing for.
  const taken = new Set(
      [...heading.entries()]
        .filter(
          ([other]): boolean =>
            other !== ship &&
            !other.destroyed() &&
            (other as unknown as Ferry).hasCapacity()
        )
        .map(([, port]): City => port)
    ),
    ports = [
      ...new Set(
        [...passengers.values()]
          .filter((passenger): boolean => passenger.since !== null)
          .map((passenger): City => passenger.port)
      ),
    ]
      .filter((port: City): boolean => !taken.has(port))
      .sort(
        (a: City, b: City): number =>
          a.tile().distanceFrom(ship.tile()) -
          b.tile().distanceFrom(ship.tile())
      );

  for (const port of ports) {
    const berth = landingFor(ship, new Set([port.tile()]), port.tile());

    if (
      berth &&
      (await sailTo(dependencies, player, memory, knowledge, ship, berth))
    ) {
      heading.set(ship, port);

      return true;
    }
  }

  heading.delete(ship);

  return false;
};

export const ferry = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  ship: Unit
): Promise<boolean> => {
  const ferried = await ferryTurn(
    dependencies,
    player,
    memory,
    knowledge,
    ship
  );

  if (ferried) {
    overseasStateFor(memory).ferried.set(ship, dependencies.turn.value());
  }

  return ferried;
};

export default ferry;
