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
import { defendersIn, defendersKept, isDefender } from '../City/defence';
import {
  confidentPower,
  knownEnemyCities,
  powerOf,
  powerOfPlayer,
  rivalOf,
} from '../Player/rivals';
import AttackConfidence from '@civ-clone/base-leader-personality/Rules/Player/AttackConfidence';
import { militaryStrength } from '@civ-clone/core-power/lib/strength';
import { product, sum } from '@civ-clone/base-leader-personality/lib/combine';
import OverseasSettlers from '@civ-clone/base-leader-personality/Rules/Player/OverseasSettlers';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';
import reachableTiles from '@civ-clone/base-strategy-ai/lib/Unit/reachable';

export type Role = 'explorer' | 'founder' | 'escort' | 'garrison' | 'invader';

export interface Passenger {
  // What it's going for: a tile to explore, a site for a city, a city of the player's that's short of defenders or an
  //  enemy city to attack, on another landmass. An escort shares its founder's.
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
  // The last turn each transport ferried passengers or sailed for a port with some waiting, so that the player knows
  //  it's not free to explore (civ-clone/web-renderer#440).
  ferried: Map<Unit, number>;
  // The port each empty transport is sailing for, so that only one goes for each.
  heading: Map<Unit, City>;
}

const states = new WeakMap<Memory, OverseasState>();

export const overseasStateFor = (memory: Memory): OverseasState => {
  if (!states.has(memory)) {
    states.set(memory, {
      passengers: new Map(),
      origins: new Map(),
      ferried: new Map(),
      heading: new Map(),
    });
  }

  return states.get(memory)!;
};

// How long a lone founder waits in port for an escort before sailing without one.
export const ESCORT_WAIT = 3;

// How many invaders go for the same enemy city, where other roles go one to a target.
export const INVADERS = 8;

// How much stronger in attack invaders gathered for a city must be than its owner's defence on its landmass before they
//  board, as their leader sees it (`AttackConfidence`), and the most turns they wait to be (Dom, on
//  civ-clone/web-renderer#374: landing one unit at a time lost most of them).
export const MUSTER = 2;
export const MUSTER_WAIT = 15;

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
//  ferry it. Targets other passengers are already going for are left to them: one each, or `INVADERS` invaders.
const destination = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  role: Role,
  candidates: Tile[]
): { target: Tile; port: City } | null => {
  const home = landmassOf(dependencies, unit.tile()),
    going = new Map<Tile, number>(),
    share = role === 'invader' ? INVADERS : 1;

  overseasStateFor(memory).passengers.forEach(
    (passenger: Passenger, other: Unit): void => {
      if (other !== unit && !other.destroyed()) {
        going.set(passenger.target, (going.get(passenger.target) ?? 0) + 1);
      }
    }
  );

  for (const target of [...candidates]
    .filter(
      (tile: Tile): boolean => !home.has(tile) && (going.get(tile) ?? 0) < share
    )
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

  const found = destination(
    dependencies,
    player,
    memory,
    unit,
    role,
    candidates
  );

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

  if (
    embark &&
    (passenger.role !== 'invader' ||
      mustered(dependencies, player, memory, passenger))
  ) {
    overseasStateFor(memory).origins.set(unit, landmassOf(dependencies, tile));

    // The `instanceof` narrows it to a type that isn't assignable to `Action` (civ-clone/web-renderer#21).
    unit.action(embark as unknown as Action);

    return true;
  }

  noOrders(dependencies, unit);

  return true;
};

// The invaders going for `target`, that have reached their port or set sail.
export const invadersFor = (
  memory: Memory,
  target: Tile
): [Unit, Passenger][] =>
  [...overseasStateFor(memory).passengers.entries()].filter(
    ([unit, passenger]): boolean =>
      passenger.role === 'invader' &&
      passenger.target === target &&
      passenger.since !== null &&
      !unit.destroyed()
  );

// How long the first of the invaders going for `target` has waited.
export const musterWaited = (
  dependencies: Dependencies,
  memory: Memory,
  target: Tile
): number =>
  Math.max(
    0,
    ...invadersFor(memory, target).map(
      ([, passenger]): number => dependencies.turn.value() - passenger.since!
    )
  );

// Whether the invaders going for `passenger`'s target are strong enough to take it (`MUSTER`), or have waited long
//  enough (`MUSTER_WAIT`).
export const mustered = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  passenger: Passenger
): boolean => {
  const city = dependencies.cityRegistry.getByTile(passenger.target);

  if (
    city === null ||
    musterWaited(dependencies, memory, passenger.target) >= MUSTER_WAIT
  ) {
    return true;
  }

  const landmass = landmassOf(dependencies, passenger.target),
    { attack } = militaryStrength(
      invadersFor(memory, passenger.target).map(([unit]): Unit => unit),
      dependencies.ruleRegistry
    ),
    { defence } = militaryStrength(
      dependencies.unitRegistry
        .getByPlayer(city.player())
        .filter((unit: Unit): boolean => landmass.has(unit.tile())),
      dependencies.ruleRegistry
    );

  return (
    attack *
      product(
        dependencies.ruleRegistry,
        AttackConfidence,
        player,
        city.player()
      ) >=
    MUSTER * defence
  );
};

// A number from 0 to 99 for `unit`, the same every turn, to pick a share of a player's units by.
const shareOf = (unit: Unit): number =>
  [...unit.id()].reduce(
    (hash: number, character: string): number =>
      (hash * 31 + character.charCodeAt(0)) % 100,
    7
  );

// How few sites for cities a landmass has left, by the survey's board, for it to count as filling up.
export const SCARCE_SITES = 6;

// Whether `unit`'s landmass is filling up, with fewer than `SCARCE_SITES` sites left (Dom, on
//  civ-clone/web-renderer#374). Counting a landmass shared with another player too sent Expansionists away from room
//  they had at home, and they founded fewer cities.
const homeIsFillingUp = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
): boolean => {
  const home = landmassOf(dependencies, unit.tile());

  return (
    memory.targets.goodSitesForCities.filter((tile: Tile): boolean =>
      home.has(tile)
    ).length < SCARCE_SITES
  );
};

// Whether `unit`, a founder, is one of the share its leader sends overseas before its landmass is full, once it's
//  filling up (`OverseasSettlers`, civ-clone/web-renderer#374). Sent while there was still plenty of room
//  at home, Expansionists founded fewer cities in all.
export const settlesOverseas = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): boolean =>
  isFounder(unit) &&
  shareOf(unit) <
    100 * sum(dependencies.ruleRegistry, OverseasSettlers, player) &&
  homeIsFillingUp(dependencies, memory, unit);

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

// The player's cities that are short of the defenders they keep, wherever they are.
export const citiesShortOfDefenders = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  player: Player
): Tile[] =>
  dependencies.cityRegistry
    .getByPlayer(player)
    .filter(
      (city: City): boolean =>
        defendersIn(dependencies, city).length <
        defendersKept(dependencies, knowledge, city)
    )
    .map((city: City): Tile => city.tile());

// The candidates `unit`'s role chooses from: land to explore, sites for cities, cities short of defenders, or, for an
//  escort, the targets of the founders it could go with.
export const candidatesFor = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  player: Player,
  memory: Memory,
  unit: Unit,
  role: Role
): Tile[] =>
  role === 'explorer'
    ? memory.targets.landTilesToExplore
    : role === 'founder'
    ? memory.targets.goodSitesForCities
    : role === 'garrison'
    ? citiesShortOfDefenders(dependencies, knowledge, player)
    : role === 'invader'
    ? invasionTargets(dependencies, player, unit)
    : [...overseasStateFor(memory).passengers.entries()]
        .filter(
          ([other, passenger]) => other !== unit && passenger.role === 'founder'
        )
        .map(([, passenger]) => passenger.target);

// A defender with nothing to do on its own landmass goes to a city of the player's on another one that's short of
//  defenders, one at a time for each city (civ-clone/web-renderer#441): a new city overseas is founded with a single
//  escort, and its garrison grows only if it can build one.
export const planGarrison = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  player: Player,
  memory: Memory,
  unit: Unit
): Passenger | null =>
  isDefender(unit)
    ? planPassenger(
        dependencies,
        player,
        memory,
        unit,
        'garrison',
        citiesShortOfDefenders(dependencies, knowledge, player)
      )
    : null;

// An attacker: a land unit with more attack than defence, not a worker.
const isInvader = (unit: Unit): boolean =>
  unit instanceof Land &&
  !isFounder(unit) &&
  unit.attack().value() > unit.defence().value();

// The cities of `player`'s rival, one enemy at a time (`rivalOf`), on another landmass than `unit`'s, where it's weaker than
//  `player`, its units there against all of `player`'s, as its leader sees it (`AttackConfidence`): an Aggressive leader
//  takes on a stronger enemy than a Friendly one (civ-clone/web-renderer#374).
export const invasionTargets = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile[] => {
  const home = landmassOf(dependencies, unit.tile()),
    power = powerOfPlayer(dependencies, player),
    // Each owner's power on each landmass, worked out once: `continentOf` gives each landmass one set a turn.
    defended = new Map<Player, Map<Set<Tile>, number>>(),
    defenceOf = (owner: Player, landmass: Set<Tile>): number => {
      if (!defended.has(owner)) {
        defended.set(owner, new Map());
      }

      const byLandmass = defended.get(owner)!;

      if (!byLandmass.has(landmass)) {
        byLandmass.set(
          landmass,
          powerOf(
            dependencies,
            dependencies.unitRegistry
              .getByPlayer(owner)
              .filter((other: Unit): boolean => landmass.has(other.tile()))
          )
        );
      }

      return byLandmass.get(landmass)!;
    };

  const rival = rivalOf(dependencies, player);

  return knownEnemyCities(dependencies, player)
    .filter(
      (city: City): boolean =>
        city.player() === rival &&
        !home.has(city.tile()) &&
        defenceOf(city.player(), landmassOf(dependencies, city.tile())) <
          confidentPower(dependencies, player, city.player(), power)
    )
    .map((city: City): Tile => city.tile());
};

// An attacker with no enemy city it can reach, and nothing to explore, goes for one overseas (civ-clone/web-renderer#374),
//  up to `INVADERS` to a city, so that a ferry sails with a load.
export const planInvasion = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Passenger | null =>
  isInvader(unit)
    ? planPassenger(
        dependencies,
        player,
        memory,
        unit,
        'invader',
        invasionTargets(dependencies, player, unit)
      )
    : null;

// Whether `ship` could sail alongside `port`: a water tile beside it is one it can reach.
export const canBerthAt = (ship: Unit, port: City): boolean => {
  const reachable = reachableTiles(ship);

  return port
    .tile()
    .getNeighbours()
    .some(
      (tile: Tile): boolean =>
        tile.isWater() && (reachable === null || reachable.has(tile))
    );
};

// Whether `unit`, a ship, is busy ferrying: it has passengers aboard, or took or sailed for some in the last turn.
export const isFerrying = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
): boolean =>
  (unit instanceof NavalTransport &&
    (unit as unknown as { hasCargo(): boolean }).hasCargo()) ||
  (overseasStateFor(memory).ferried.get(unit) ?? -Infinity) >=
    dependencies.turn.value() - 1;

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
