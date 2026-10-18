// Generic: taking land units to another landmass by sea (civ-clone/web-renderer#211, #374). A land unit with nothing
//  left to do on its own landmass and a target on another one is a passenger: it walks to the player's port nearest
//  that target and waits there, embarking when a transport comes alongside. A transport (`Strategies/Unit/Ferry`)
//  sails to the passengers' port, takes them aboard, carries them to the target's coast and unloads them, after which
//  they carry on with their usual work there. v474.05 does much the same with a stack drawn to a port and a ship
//  picking a destination for its cargo (OpenCivOne `AIEngine.cs` `F0_25fb_0c9d`, L944-1253).
//
// Nothing here is saved: the cargo is the engine's own (`TransportManifest`), and each passenger's target is worked out
//  again from the survey's board. A game loaded mid-voyage carries on, unloading on the first other landmass reached.
import { Embark } from '@civ-clone/library-unit/Actions';
import { Land, NavalTransport, Worker } from '@civ-clone/library-unit/Types';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

export type Role = 'explorer' | 'founder' | 'escort';

export interface Passenger {
  // What it's going for: a tile to explore or a site for a city on another landmass. An escort shares its founder's.
  target: Tile;
  role: Role;
  port: City;
  // The turn it reached the port, for the transport to know how long it's waited.
  since: number | null;
}

interface OverseasState {
  passengers: Map<Unit, Passenger>;
  // The landmass each unit aboard set out from, so that it's unloaded somewhere else.
  origins: Map<Unit, Set<Tile>>;
}

const states = new WeakMap<Memory, OverseasState>();

export const overseasStateFor = (memory: Memory): OverseasState => {
  if (!states.has(memory)) {
    states.set(memory, { passengers: new Map(), origins: new Map() });
  }

  return states.get(memory)!;
};

// How long a lone founder waits in port for an escort before sailing without one.
export const ESCORT_WAIT = 3;

const landmassOf = (dependencies: Dependencies, tile: Tile): Set<Tile> =>
  continentOf(dependencies.turn.value(), tile);

// Whether `unit` can be carried by sea at all: a land unit, not one aboard already (a land unit at sea).
const canTravel = (unit: Unit): boolean =>
  unit instanceof Land && !unit.destroyed() && unit.tile().isLand();

// The player's coastal cities on `landmass`, nearest `target` first.
const portsOn = (
  dependencies: Dependencies,
  player: Player,
  landmass: Set<Tile>,
  target: Tile
): City[] =>
  dependencies.cityRegistry
    .getByPlayer(player)
    .filter(
      (city: City): boolean =>
        landmass.has(city.tile()) && city.tile().isCoast()
    )
    .sort(
      (a: City, b: City): number =>
        a.tile().distanceFrom(target) - b.tile().distanceFrom(target)
    );

// Whether `player` has a transport, or `port` could build one: without either, a passenger would wait for ever.
export const canFerryFrom = (
  dependencies: Dependencies,
  player: Player,
  port: City
): boolean =>
  dependencies.unitRegistry
    .getByPlayer(player)
    .some((unit: Unit): boolean => unit instanceof NavalTransport) ||
  dependencies.cityBuildRegistry
    .getByCity(port)
    .available()
    .some((buildItem): boolean =>
      Object.prototype.isPrototypeOf.call(NavalTransport, buildItem.item())
    );

// The nearest of `candidates` on another landmass than `unit`'s, and the port it would sail from, if the player can
//  ferry it. Targets another passenger is already going for are left to that one.
const destination = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  candidates: Tile[]
): { target: Tile; port: City } | null => {
  const home = landmassOf(dependencies, unit.tile()),
    taken = new Set(
      [...overseasStateFor(memory).passengers.entries()]
        .filter(([other]) => other !== unit)
        .map(([, passenger]) => passenger.target)
    );

  for (const target of [...candidates]
    .filter((tile: Tile): boolean => !home.has(tile) && !taken.has(tile))
    .sort(
      (a: Tile, b: Tile): number =>
        a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
    )) {
    const [port] = portsOn(dependencies, player, home, target);

    if (port && canFerryFrom(dependencies, player, port)) {
      return { target, port };
    }
  }

  return null;
};

// `unit`'s overseas plan as a `role`, kept while its target is still worth going for, or made afresh from `candidates`.
export const planPassenger = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  role: Role,
  candidates: Tile[]
): Passenger | null => {
  if (!canTravel(unit)) {
    return null;
  }

  const { passengers } = overseasStateFor(memory),
    known = passengers.get(unit);

  if (known && known.role === role && candidates.includes(known.target)) {
    return known;
  }

  // An escort goes with its founder, so it's kept only while that founder is still going (`planEscort` makes one).
  if (role === 'escort') {
    passengers.delete(unit);

    return null;
  }

  const found = destination(dependencies, player, memory, unit, candidates);

  if (!found) {
    passengers.delete(unit);

    return null;
  }

  const passenger: Passenger = { ...found, role, since: null };

  passengers.set(unit, passenger);

  return passenger;
};

export const dropPassenger = (memory: Memory, unit: Unit): void => {
  overseasStateFor(memory).passengers.delete(unit);
};

// A transport of the player's beside `tile`, at sea, with room for `unit`.
const transportBeside = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  tile: Tile
): Tile | null =>
  tile
    .getNeighbours()
    .find(
      (neighbour: Tile): boolean =>
        neighbour.isWater() &&
        dependencies.unitRegistry
          .getByTile(neighbour)
          .some(
            (other: Unit): boolean =>
              other.player() === player &&
              other instanceof NavalTransport &&
              (other as unknown as { hasCapacity(): boolean }).hasCapacity() &&
              (other as unknown as { canStow(unit: Unit): boolean }).canStow(
                unit
              )
          )
    ) ?? null;

// A passenger's turn: walk to its port, board a transport that's alongside, or wait in port for one. Returns whether
//  it did any of those (and so its turn is taken care of).
export const travel = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  passenger: Passenger
): boolean => {
  const tile = unit.tile(),
    portTile = passenger.port.tile();

  if (passenger.port.player() !== player || passenger.port.destroyed()) {
    dropPassenger(memory, unit);

    return false;
  }

  if (tile !== portTile) {
    if (memory.unitPathData.get(unit)?.end() !== portTile) {
      const path = Path.for(
        unit,
        tile,
        portTile,
        dependencies.pathFinderRegistry
      );

      if (!path) {
        dropPassenger(memory, unit);

        return false;
      }

      memory.unitPathData.set(unit, path);
    }

    // `moveUnit` takes it along the path.
    return false;
  }

  if (passenger.since === null) {
    passenger.since = dependencies.turn.value();
  }

  const alongside = transportBeside(dependencies, player, unit, tile),
    embark =
      alongside &&
      (unit
        .actions(alongside)
        .find((action): boolean => action instanceof Embark) as
        | Embark
        | undefined);

  if (embark) {
    overseasStateFor(memory).origins.set(unit, landmassOf(dependencies, tile));

    // The `instanceof` narrows it to a type that isn't assignable to `Action` (civ-clone/web-renderer#21).
    unit.action(embark as unknown as Action);

    return true;
  }

  noOrders(dependencies, unit);

  return true;
};

// The passengers waiting in `port`.
export const waitingAt = (memory: Memory, port: City): [Unit, Passenger][] =>
  [...overseasStateFor(memory).passengers.entries()].filter(
    ([unit, passenger]): boolean =>
      passenger.port === port &&
      passenger.since !== null &&
      !unit.destroyed() &&
      unit.tile() === port.tile()
  );

// Whether `unit` is a founder (a worker), as opposed to a unit that explores or escorts.
export const isFounder = (unit: Unit): boolean => unit instanceof Worker;

export const isPassenger = (memory: Memory, unit: Unit): boolean =>
  overseasStateFor(memory).passengers.has(unit);

export const originOf = (memory: Memory, unit: Unit): Set<Tile> | null =>
  overseasStateFor(memory).origins.get(unit) ?? null;

// The candidates `unit`'s role chooses from: land to explore, sites for cities, or, for an escort, the targets of the
//  founders it could go with.
export const candidatesFor = (memory: Memory, unit: Unit, role: Role): Tile[] =>
  role === 'explorer'
    ? memory.targets.landTilesToExplore
    : role === 'founder'
    ? memory.targets.goodSitesForCities
    : [...overseasStateFor(memory).passengers.entries()]
        .filter(
          ([other, passenger]) => other !== unit && passenger.role === 'founder'
        )
        .map(([, passenger]) => passenger.target);

// An escort for a founder waiting in a port on `unit`'s landmass that has none yet: `unit` goes with it, to the same
//  target from the same port. Settlers go overseas with an escort (Dom, on #374).
export const planEscort = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
): Passenger | null => {
  if (!canTravel(unit) || isFounder(unit) || unit.defence().value() <= 0) {
    return null;
  }

  const home = landmassOf(dependencies, unit.tile()),
    { passengers } = overseasStateFor(memory),
    escorted = new Set(
      [...passengers.values()]
        .filter((passenger): boolean => passenger.role === 'escort')
        .map((passenger): Tile => passenger.target)
    ),
    founder = [...passengers.values()].find(
      (passenger): boolean =>
        passenger.role === 'founder' &&
        home.has(passenger.port.tile()) &&
        !escorted.has(passenger.target)
    );

  if (!founder) {
    return null;
  }

  const escort: Passenger = {
    target: founder.target,
    role: 'escort',
    port: founder.port,
    since: null,
  };

  passengers.set(unit, escort);

  return escort;
};

// Whether the player could ferry a unit from `tile`'s landmass: it has a coastal city there it can sail from.
export const canFerryFromLandmassOf = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  const home = landmassOf(dependencies, tile);

  return dependencies.cityRegistry
    .getByPlayer(player)
    .some(
      (city: City): boolean =>
        home.has(city.tile()) &&
        city.tile().isCoast() &&
        canFerryFrom(dependencies, player, city)
    );
};
