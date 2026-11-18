// Generic: warships and submarines at war (civ-clone/web-renderer#1128). Only for a ruleset that says what each unit
//  type is for with base-unit-role's `UnitRoles` (Civ2's `@UNITS` roles): a naval superiority type that carries no
//  aircraft (a warship or a submarine, not a carrier) is a warship here. A ruleset that declares no roles (Civ1) has none,
//  so its ships keep exploring and ferrying as they always have. A naval superiority type that ferries land units (Civ2's
//  Frigate) stays a ferry.
//
// After the original's computer players (OpenCiv2 `ai_orders_ship_goal_war`, `ai.cpp:3823`, and the transport's escort
//  goal in `ai_orders_transport_unload`, `:3981`), in our own terms. Each turn a warship, in order:
//  - **strikes** an enemy ship beside it that it would beat (`attackOdds`), or else a city beside it it would bombard;
//  - **escorts** one of its player's loaded transports at sea within its reach that no other warship escorts, sailing
//    alongside it (to defend its square) or, failing that, for where it's going;
//  - **hunts** the nearest enemy ship within its reach that it would beat, a loaded transport counting as half as far;
//  - **bombards** a coastal city of an enemy's, a surface ship only, whose defender it would beat, from the sea beside it;
//    one with the player's own land units near it counting as half as far, as the original's air raids weigh them;
//  - otherwise does what any ship does (`MissionAndMove`: exploring, hunting further afield, standing down).
// An enemy is a player the computer player has no treaty with (`isEnemy`), the barbarians among them.
import {
  Air,
  Land,
  Naval,
  NavalTransport,
} from '@civ-clone/library-unit/Types';
import { ATTACK_ODDS, attackOdds } from './attackOdds';
import { hasTrait, isA, traitsOf } from '@civ-clone/core-unit/traits';
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory, { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import { NavalSuperiorityRole } from '@civ-clone/base-unit-role/Roles';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Submerged from '@civ-clone/base-unit-trait-submerged/Submerged';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';
import { healsThisTurn } from './retreatToHeal';
import { isEnemy } from '../Player/rivals';
import { isOnSea } from '../City/explorerShip';
import { reachableTiles } from '@civ-clone/base-strategy-ai/lib/Unit/reachable';
import { isFerry, isFerryType } from './carriesUnits';
import { isFerrying } from './overseas';

// How many turns of its moves away a warship looks for a ship to hunt or a city to bombard.
export const NAVAL_REACH_TURNS = 3;

// How many turns of its moves away a warship looks for a transport to escort.
export const ESCORT_REACH_TURNS = 2;

// How far (in tiles) from one of a player's coastal cities an enemy ship, or an enemy's coastal city, makes the city want
//  a warship (`navalThreatsNear`): about two turns of a Destroyer's.
export const NAVAL_THREAT_DISTANCE = 12;

// Warships a player wants for each of its coastal cities with an enemy ship or coastal city in reach, rounded up.
export const WARSHIPS_PER_THREATENED_CITY = 0.5;

// What a warship scores in production when the player has none of those it wants, against the other needs
//  (`ProductionPolicy#needs`): under a reinforcement (3), over a Caravan (1).
export const WARSHIP_NEED = 2;

// Whether `UnitType` (a class) is a warship: a naval superiority type, by the ruleset's roles, that carries no aircraft
//  and no passengers.
export const isWarshipType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean =>
  Object.prototype.isPrototypeOf.call(Naval, UnitType) &&
  hasRole(UnitType as typeof Unit, NavalSuperiorityRole, ruleRegistry) &&
  !traitsOf(UnitType as typeof Unit, Carries, ruleRegistry).some(
    (carries: Carries): boolean => carries.carries(Air, ruleRegistry)
  ) &&
  // A ship that ferries land units (Civ2's Frigate) is a ferry first, as it always was: as a warship it would hold on
  //  to its passengers to escort itself.
  !isFerryType(UnitType, ruleRegistry);

export const isWarship = (unit: Unit, ruleRegistry: RuleRegistry): boolean =>
  isWarshipType(unit.constructor, ruleRegistry);

// Whether `UnitType` stays under water: a submarine attacks only at sea, so never bombards a city.
export const isSubmergedType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean => hasTrait(UnitType as typeof Unit, Submerged, ruleRegistry);

// Whether `unit` is another player's that `player` would fight: one it has no treaty with.
const hostile = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): boolean =>
  unit.player() !== player &&
  !unit.destroyed() &&
  isEnemy(dependencies, player, unit.player());

// A transport of another player's with land units aboard.
const isLoadedTransport = (dependencies: Dependencies, unit: Unit): boolean =>
  isFerry(unit, dependencies.ruleRegistry) &&
  (unit as unknown as NavalTransport).hasCargo();

// How far `unit` could sail in `turns` turns, in tiles.
const reachOf = (unit: Unit, turns: number): number =>
  Math.max(1, Math.floor(unit.movement().value())) * turns;

// The water tiles beside `tile`, nearest `unit` first.
const waterBeside = (unit: Unit, tile: Tile): Tile[] =>
  tile
    .getNeighbours()
    .filter((neighbour: Tile): boolean => neighbour.isWater())
    .sort(
      (a: Tile, b: Tile): number =>
        a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
    );

// Sets `unit` off for the first of `ranked` it has a path to (`ranked` is tried as given), or, when it's next to it
//  already, clears its path so that the move executor's step takes the battle. Returns whether there was one.
const sailFor = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  ranked: Tile[]
): boolean => {
  // Only worked out if there's a tile to check: a search for a tile on another sea covers all of this one.
  let reachable: Set<Tile> | null | undefined;

  for (const tile of ranked) {
    if (tile === unit.tile()) {
      memory.unitPathData.delete(unit);

      return true;
    }

    if (reachable === undefined) {
      reachable = reachableTiles(unit, dependencies.turn.value());
    }

    if (reachable !== null && !reachable.has(tile)) {
      continue;
    }

    const path = Path.for(
      unit,
      unit.tile(),
      tile,
      dependencies.pathFinderRegistry
    );

    if (path) {
      memory.unitPathData.set(unit, path);
      navalPaths.set(unit, path);

      return true;
    }
  }

  return false;
};

// The warships whose path a naval task set, so that it's dropped once they have no task: another strategy would
//  otherwise follow it to where a target was.
const navalPaths = new WeakMap<Unit, Path>();

// Drops the path a naval task gave `unit`, if that's still the path it has (not one another strategy has set since).
export const dropNavalPath = (memory: Memory, unit: Unit): void => {
  const path = navalPaths.get(unit);

  navalPaths.delete(unit);

  if (path !== undefined && memory.unitPathData.get(unit) === path) {
    memory.unitPathData.delete(unit);
  }
};

export interface NavalTask {
  task: 'hunt' | 'escort' | 'bombard';
  // The tile next to the warship to attack now, if its target is beside it.
  strike: Tile | null;
  // The transport it escorts.
  escorting?: Unit;
}

// Which warship escorts which transport, per player's memory, worked out afresh each turn.
interface EscortState {
  turn: number;
  escorts: Map<Unit, Unit>;
}

const escortStates = new WeakMap<Memory, EscortState>();

const escortsFor = (
  dependencies: Dependencies,
  memory: Memory
): Map<Unit, Unit> => {
  const turn = dependencies.turn.value(),
    state = escortStates.get(memory);

  if (state && state.turn === turn) {
    return state.escorts;
  }

  const fresh: EscortState = { turn, escorts: new Map() };

  escortStates.set(memory, fresh);

  return fresh.escorts;
};

// The enemy ships `unit` could hunt: on the target board, at sea, within its reach and beaten at the odds it wants,
//  nearest first, a loaded transport as if half as far.
export const huntTargets = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Tile[] => {
  const reach = reachOf(unit, NAVAL_REACH_TURNS),
    weight = new Map<Tile, number>(),
    weighed = (tile: Tile): number => {
      if (!weight.has(tile)) {
        weight.set(
          tile,
          tile.distanceFrom(unit.tile()) /
            (dependencies.unitRegistry
              .getByTile(tile)
              .some(
                (other: Unit): boolean =>
                  hostile(dependencies, player, other) &&
                  isLoadedTransport(dependencies, other)
              )
              ? 2
              : 1)
        );
      }

      return weight.get(tile)!;
    };

  return memory.targets.enemyUnitsToAttack
    .filter(
      (tile: Tile): boolean =>
        tile.isWater() &&
        tile.distanceFrom(unit.tile()) <= reach &&
        dependencies.unitRegistry
          .getByTile(tile)
          .some(
            (other: Unit): boolean =>
              hostile(dependencies, player, other) && isA(other, Naval)
          ) &&
        attackOdds(dependencies, unit, tile) >= ATTACK_ODDS
    )
    .sort((a: Tile, b: Tile): number => weighed(a) - weighed(b));
};

// The coastal enemy cities `unit` could bombard (an enemy's, or one of its player's that an enemy holds): a surface
//  ship's, within its reach, with a defender it would beat,
//  nearest first, one with the player's own land units within 2 of it as if half as far.
export const bombardTargets = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Tile[] => {
  if (isSubmergedType(unit.constructor, dependencies.ruleRegistry)) {
    return [];
  }

  const reach = reachOf(unit, NAVAL_REACH_TURNS),
    ownLand = dependencies.unitRegistry
      .getByPlayer(player)
      .filter(
        (own: Unit): boolean =>
          isA(own, Land) && !own.destroyed() && own.tile().isLand()
      )
      .map((own: Unit): Tile => own.tile()),
    weight = new Map<Tile, number>(),
    weighed = (tile: Tile): number => {
      if (!weight.has(tile)) {
        weight.set(
          tile,
          tile.distanceFrom(unit.tile()) /
            (ownLand.some((own: Tile): boolean => own.distanceFrom(tile) <= 2)
              ? 2
              : 1)
        );
      }

      return weight.get(tile)!;
    };

  return [
    ...memory.targets.enemyCitiesToAttack,
    ...memory.targets.citiesToLiberate,
  ]
    .filter((tile: Tile): boolean => {
      const city = dependencies.cityRegistry.getByTile(tile);

      return (
        city !== null &&
        tile.isCoast() &&
        tile.distanceFrom(unit.tile()) <= reach &&
        isEnemy(dependencies, player, city.player()) &&
        dependencies.unitRegistry
          .getByTile(tile)
          .some((other: Unit): boolean => !other.destroyed()) &&
        attackOdds(dependencies, unit, tile) >= ATTACK_ODDS
      );
    })
    .sort((a: Tile, b: Tile): number => weighed(a) - weighed(b));
};

// The player's loaded transports at sea within `unit`'s reach with no other warship escorting them, nearest first; none
//  for a submarine.
export const transportsToEscort = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Unit[] => {
  // A submarine can't keep up with a transport, and defends badly against ships.
  if (isSubmergedType(unit.constructor, dependencies.ruleRegistry)) {
    return [];
  }

  const reach = reachOf(unit, ESCORT_REACH_TURNS),
    escorts = escortsFor(dependencies, memory);

  return dependencies.unitRegistry
    .getByPlayer(player)
    .filter((transport: Unit): boolean => {
      // Unclaimed, claimed by `unit`, or claimed by a warship since sunk or gone to heal (`RetreatToHeal` takes a
      //  damaged one before it's asked again).
      const by = escorts.get(transport);

      return (
        !transport.destroyed() &&
        transport.tile().isWater() &&
        isLoadedTransport(dependencies, transport) &&
        transport.tile().distanceFrom(unit.tile()) <= reach &&
        (by === undefined ||
          by === unit ||
          by.destroyed() ||
          healsThisTurn(dependencies, by))
      );
    })
    .sort(
      (a: Unit, b: Unit): number =>
        a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile())
    );
};

// The tile beside `unit` it would strike now, if any: an enemy ship to hunt, or else an enemy city to bombard. Reads only.
export const strikeBeside = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Tile | null =>
  strikeBesideOf(
    unit,
    huntTargets(dependencies, player, memory, unit),
    bombardTargets(dependencies, player, memory, unit)
  );

const strikeBesideOf = (
  unit: Unit,
  hunt: Tile[],
  bombard: Tile[]
): Tile | null => {
  const beside = (tile: Tile): boolean => tile.isNeighbourOf(unit.tile());

  return hunt.find(beside) ?? bombard.find(beside) ?? null;
};

// Gives `unit`, a warship, its task for the turn: a path for it (`memory.unitPathData`), or the tile beside it to strike
//  now. `null` when it has none of its own, leaving it to the missions every unit has.
export const planNavalTask = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): NavalTask | null => {
  // Next to its prey, or a city to bombard, it strikes, escorting or not (a claim it had stands: it sails on to it once
  //  it has struck).
  const hunt = huntTargets(dependencies, player, memory, unit),
    bombard = bombardTargets(dependencies, player, memory, unit),
    strike = strikeBesideOf(unit, hunt, bombard);

  if (strike !== null) {
    memory.unitPathData.delete(unit);

    return {
      task:
        dependencies.cityRegistry.getByTile(strike) === null
          ? 'hunt'
          : 'bombard',
      strike,
    };
  }

  const escorts = escortsFor(dependencies, memory);

  // A warship escorts one transport at a time: whatever it had claimed before this plan is let go.
  escorts.forEach((escort: Unit, transport: Unit): void => {
    if (escort === unit) {
      escorts.delete(transport);
    }
  });

  for (const transport of transportsToEscort(
    dependencies,
    player,
    memory,
    unit
  )) {
    // Alongside it, so that it defends the transport's square; or, where it can't get there, where it's going.
    const heading = memory.unitPathData.get(transport)?.end() ?? null,
      destinations = [
        transport.tile(),
        ...(heading && heading.isWater() ? [heading] : []),
      ];

    escorts.set(transport, unit);

    if (destinations.includes(unit.tile())) {
      memory.unitPathData.delete(unit);

      return { task: 'escort', strike: null, escorting: transport };
    }

    if (sailFor(dependencies, memory, unit, destinations)) {
      return { task: 'escort', strike: null, escorting: transport };
    }

    escorts.delete(transport);
  }

  // Otherwise it sails for the sea beside its prey.
  for (const tile of hunt) {
    if (sailFor(dependencies, memory, unit, waterBeside(unit, tile))) {
      return { task: 'hunt', strike: null };
    }
  }

  for (const tile of bombard) {
    if (sailFor(dependencies, memory, unit, waterBeside(unit, tile))) {
      return { task: 'bombard', strike: null };
    }
  }

  dropNavalPath(memory, unit);

  return null;
};

// The tiles of enemy ships and enemy coastal cities within `NAVAL_THREAT_DISTANCE` of `city`, from the player's target
//  board: what makes a coastal city want a warship.
export const navalThreatsNear = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): { ships: Tile[]; cities: Tile[] } => {
  const near = (tile: Tile): boolean =>
    tile.distanceFrom(city.tile()) <= NAVAL_THREAT_DISTANCE;

  return {
    ships: targets.enemyUnitsToAttack.filter(
      (tile: Tile): boolean =>
        tile.isWater() &&
        near(tile) &&
        dependencies.unitRegistry
          .getByTile(tile)
          .some(
            (other: Unit): boolean =>
              hostile(dependencies, player, other) && isA(other, Naval)
          )
    ),
    cities: [
      ...targets.enemyCitiesToAttack,
      ...targets.citiesToLiberate,
    ].filter((tile: Tile): boolean => {
      const other = dependencies.cityRegistry.getByTile(tile);

      return (
        other !== null &&
        tile.isCoast() &&
        near(tile) &&
        isEnemy(dependencies, player, other.player())
      );
    }),
  };
};

// How many warships `player` wants, how many it has (and has on order), and whether `city` may build a submarine, when
//  `city` (a coastal city on the sea) should build one; otherwise `null`. A city builds them while an enemy ship or an
//  enemy's coastal city is within reach of it, as the original builds naval units only in a coastal city on open water
//  (`city_choose_production`, `city_production.cpp:1906-1911`); or, while any of the player's coastal cities is, for
//  its transports in use (`isFerrying`), to escort them. It wants one for every two such cities, and one for each
//  transport in use. A submarine can neither bombard nor keep up with a transport, so it builds one only for ships to
//  hunt and only while it has more surface warships than submarines.
// The number of `player`'s coastal cities with an enemy ship or an enemy's coastal city within reach. Production runs it
//  for every city that chooses, so it's kept for the rest of the turn once the player's own survey has filled the board
//  this turn (`Memory#surveyedTurn`), and never from a board left from an earlier turn (a choice made during another
//  player's turn, from `unitDestroyed`).
const threatenedCounts = new WeakMap<
  TargetBoard,
  { turn: number; count: number }
>();

const threatenedPorts = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard
): number => {
  const turn = dependencies.turn.value(),
    memory = dependencies.memoryRegistry.memoryFor(player),
    surveyed = memory.targets === targets && memory.surveyedTurn === turn,
    known = surveyed ? threatenedCounts.get(targets) : undefined;

  if (known && known.turn === turn) {
    return known.count;
  }

  const count = dependencies.cityRegistry
    .getByPlayer(player)
    .filter((other: City): boolean => {
      if (!other.tile().isCoast() || !isOnSea(other)) {
        return false;
      }

      const near = navalThreatsNear(dependencies, player, targets, other);

      return near.ships.length > 0 || near.cities.length > 0;
    }).length;

  if (surveyed) {
    threatenedCounts.set(targets, { turn, count });
  }

  return count;
};

export const warshipsWanted = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): { wanted: number; have: number; submarines: boolean } | null => {
  const threatenedHere = navalThreatsNear(dependencies, player, targets, city),
    here = threatenedHere.ships.length > 0 || threatenedHere.cities.length > 0,
    memory = dependencies.memoryRegistry.memoryFor(player),
    units = dependencies.unitRegistry.getByPlayer(player),
    ferrying = units.filter(
      (unit: Unit): boolean =>
        isFerry(unit, dependencies.ruleRegistry) &&
        isFerrying(dependencies, memory, unit)
    ).length;

  if (!here && ferrying === 0) {
    return null;
  }

  // This city counts whatever was kept, as it may have become threatened since.
  const threatened = Math.max(
    threatenedPorts(dependencies, player, targets),
    here ? 1 : 0
  );

  if (threatened === 0) {
    return null;
  }

  const isWarshipItem = (item: object): boolean =>
      isWarshipType(item, dependencies.ruleRegistry),
    warships = units.filter((unit: Unit): boolean =>
      isWarshipItem(unit.constructor)
    ),
    submerged = warships.filter((unit: Unit): boolean =>
      isSubmergedType(unit.constructor, dependencies.ruleRegistry)
    ).length,
    surface = warships.length - submerged,
    onOrder = dependencies.cityRegistry
      .getByPlayer(player)
      .filter((other: City): boolean => {
        const building = dependencies.cityBuildRegistry
          .getByCity(other)
          .building();

        return building !== null && isWarshipItem(building.item());
      }).length;

  return {
    wanted: Math.ceil(threatened * WARSHIPS_PER_THREATENED_CITY) + ferrying,
    have: warships.length + onOrder,
    // Only for ships to hunt, while surface warships outnumber submarines and there are enough of them to escort the
    //  transports in use, as submarines don't.
    submarines:
      threatenedHere.ships.length > 0 &&
      surface > submerged &&
      surface >= ferrying,
  };
};

export default planNavalTask;
