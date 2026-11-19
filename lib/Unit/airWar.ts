// Generic: aircraft, missiles, nuclear weapons and paratroopers at war (civ-clone/web-renderer#1124). Only for a ruleset
//  that says what each unit type is for with base-unit-role's `UnitRoles` (Civ2's `@UNITS` roles): a ruleset that
//  declares no roles (Civ1) has none of these kinds, so its aircraft do what they always have.
//
// After the original's computer players (OpenCiv2 `ai.cpp`), in our own terms:
//  - a **fighter** (an air superiority type) goes for the nearest enemy unit it would beat, alone or in the air, nearer
//    for a unit with a range or a lone one, when it can strike and still get back to refuel (`ai_air_pick_target`,
//    `ai_air_strike_target`, `:2575-2747`); otherwise it waits in, or flies back to, the nearest of its player's cities;
//  - a **bomber**, helicopter or cruise missile (an attack type that flies) raids the enemy city in reach this turn that
//    scores best: its size × 10, less 25 for each unit there, 40 more on the landmass the unit is over, 60 more for each
//    of its player's units beside it (`ai_air_raid_city`, `:2490`), then flies back to refuel;
//  - a **nuclear weapon** (a type that `Detonates`), only for a leader whose attack trait is aggressive, goes for the
//    enemy city the original's `ai_nuke_pick_target` (`:2335`) would: larger than 4, without an SDI Defence, of a
//    player at war whose military is more than half its own (and has no nuclear weapons), or more than half again as
//    large, or that it holds a vendetta against; scored by the enemy units around it, less 2 for each square of its own
//    and 99 for each of a third player not at war (the barbarians' count for nothing), plus half its size; only from a
//    player with two or more, and only once the score reaches 10 (less for a player with fewer than 5 cities). The
//    original's "at war" is no peace and a nuclear threat; here it's a war in force. The original moves the weapon
//    straight beside a target in reach of any of its player's cities; here it flies, so it takes only targets it can
//    reach this turn from where it is;
//  - a **paratrooper** (a type that can `Paradrop`), unmoved in its player's city and not its last defender, drops into
//    an empty enemy city at war within its range (`ai_orders_paratrooper`, `:3315`); otherwise it's a land unit like
//    any other.
// An enemy is a player with no treaty (`isEnemy`), barbarians included; nuclear weapons and paratroopers want a war.
import { Air, Land } from '@civ-clone/library-unit/Types';
import {
  AirSuperiorityRole,
  AttackRole,
} from '@civ-clone/base-unit-role/Roles';
import { ATTACK_ODDS, attackOdds } from './attackOdds';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import { hasRole, roleOf } from '@civ-clone/base-unit-role/roleOf';
import { hasTrait, isA } from '@civ-clone/core-unit/traits';
import Aggressive from '@civ-clone/base-leader-trait-aggression/Aggression/Aggressive';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import Memory, { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import Paradrop from '@civ-clone/base-unit-trait-paradrop/Paradrop';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import Terraforms from '@civ-clone/base-unit-trait-terraforms/Terraforms';
import NonCombatant from '@civ-clone/base-unit-trait-non-combatant/NonCombatant';
import Tile from '@civ-clone/core-world/Tile';
import Trait from '@civ-clone/core-civilization/Trait';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { liveCities } from '../City/liveCities';
import movesBetween from '../movesBetween';
import { fuelFor } from './fuel';
import { isEnemy } from '../Player/rivals';
import hasVendetta from '@civ-clone/library-diplomacy/lib/holds';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import leaderTraits from '@civ-clone/base-leader-personality/lib/leaderTraits';
import { powerOfPlayer } from '../Player/rivals';
import { refuels } from '@civ-clone/base-unit-fuel/lib/fuelRules';

export type AirKind = 'fighter' | 'striker' | 'missile' | 'nuclear';

// What `UnitType` (a class) is for in the air, by the ruleset's roles, or `null` for a type that doesn't fly or has no
//  role.
export const airKindOf = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): AirKind | null => {
  if (!Object.prototype.isPrototypeOf.call(Air, UnitType)) {
    return null;
  }

  const Type = UnitType as typeof Unit;

  if (roleOf(Type, ruleRegistry) === null) {
    return null;
  }

  if (hasTrait(Type, Detonates, ruleRegistry)) {
    return 'nuclear';
  }

  if (hasRole(Type, AirSuperiorityRole, ruleRegistry)) {
    return 'fighter';
  }

  if (!hasRole(Type, AttackRole, ruleRegistry)) {
    return null;
  }

  return hasTrait(Type, SingleUse, ruleRegistry) ? 'missile' : 'striker';
};

// Whether `UnitType` is a paratrooper: a type with a role that can `Paradrop`.
export const isParatrooperType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean =>
  roleOf(UnitType as typeof Unit, ruleRegistry) !== null &&
  hasTrait(UnitType as typeof Unit, Paradrop, ruleRegistry);

// The range of a paratrooper's drop, @COSMIC's 10 in Civ2.
export const PARADROP_RANGE = 10;

// How far (in tiles) an enemy aircraft from one of a player's cities makes the city want a fighter, and how far an
//  enemy land unit.
export const AIR_THREAT_DISTANCE = 8;
export const LAND_THREAT_DISTANCE = 3;

// Strikers (bombers, helicopters) a player wants for each 3 of its cities while an enemy city is in reach, and the most.
export const STRIKERS_PER_CITY = 1 / 3;
export const MAX_STRIKERS = 4;

// Cruise missiles a player wants for each 4 of its cities while an enemy city is in reach, and the most.
export const MISSILES_PER_CITY = 1 / 4;
export const MAX_MISSILES = 2;

// The nuclear weapons a player keeps while a target is in reach: the original fires only with two or more.
export const NUCLEAR_WANTED = 2;

// Paratroopers a player wants for each 4 of its cities while a weakly held enemy city is in drop range, and the most.
export const PARATROOPERS_PER_CITY = 1 / 4;
export const MAX_PARATROOPERS = 2;

// What each kind scores in production when the player has none of those it wants (`ProductionPolicy#needs`'s scale).
export const AIR_NEEDS: { [kind in AirKind | 'paratrooper']: number } = {
  fighter: 2,
  striker: 2,
  missile: 1,
  nuclear: 2,
  paratrooper: 1,
};

// Whether `player`'s leader's attack trait is aggressive (base-leader-trait-aggression's `Aggressive`).
export const isAggressive = (
  dependencies: Dependencies,
  player: Player
): boolean =>
  leaderTraits(dependencies.traitRegistry, player).some(
    (trait: Trait): boolean => trait instanceof Aggressive
  );

const atWar = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  other !== player &&
  treatyLevel(dependencies, player, other) === TreatyLevel.War;

const hostile = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean => other !== player && isEnemy(dependencies, player, other);

// The squares `unit` can refuel on: its player's cities and the squares its player's other units are on (a carrier),
//  wherever the ruleset's `Refuel` rules say it refuels.
const refuellingTiles = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile[] =>
  [
    ...new Set<Tile>([
      ...dependencies.cityRegistry
        .getByPlayer(player)
        .map((city: City): Tile => city.tile()),
      ...dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other: Unit): boolean => other !== unit && !other.destroyed())
        .map((other: Unit): Tile => other.tile()),
    ]),
  ].filter((tile: Tile): boolean =>
    refuels(dependencies.ruleRegistry, unit, tile)
  );

// How far `tile` is from the nearest square `unit` refuels on: `Infinity` with none.
const homeDistance = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  tile: Tile,
  home: Tile[] = refuellingTiles(dependencies, player, unit)
): number =>
  home.reduce(
    (nearest: number, other: Tile): number =>
      Math.min(nearest, movesBetween(tile, other)),
    Infinity
  );

// The squares `unit` could strike `target` from this turn and still get back to refuel before its fuel runs out,
//  nearest it first: where it stands, if that's beside the target, or a square beside the target it can reach with a
//  move to spare for the attack (none with another player's units on it). A missile (`SingleUse`) only needs to reach
//  it; a unit whose attack ends its turn (a bomber) gets home on its later turns' moves; another (a fighter) on the
//  moves it has left after the attack. A unit with no fuel (a helicopter) only needs to reach it. `home` is the squares
//  it refuels on.
export const strikeSquares = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile,
  home: Tile[] = refuellingTiles(dependencies, player, unit)
): Tile[] => {
  const moves = unit.moves().value(),
    state = fuelFor(dependencies, unit),
    from = unit.tile(),
    // Where it stands, if that's beside the target; a nuclear weapon only from an empty square that isn't a city, as
    //  any other square it would strike from (`besideFor`).
    squares = (
      target.isNeighbourOf(from) && !unit.hasTrait(Detonates)
        ? [from]
        : besideFor(dependencies, player, unit, target)
    ).filter(
      (square: Tile): boolean => movesBetween(square, from) + 1 <= moves
    );

  if (state === null) {
    return squares;
  }

  if (unit.hasTrait(SingleUse)) {
    return squares.filter(
      (square: Tile): boolean => movesBetween(square, from) + 1 <= state.reach
    );
  }

  return squares.filter((square: Tile): boolean => {
    const left = unit.hasTrait(AttackEndsTurn)
      ? state.reach - moves
      : state.reach - movesBetween(square, from) - 1;

    return homeDistance(dependencies, player, unit, square, home) <= left;
  });
};

// Whether `unit` could strike `target` this turn and get back to refuel (`strikeSquares`).
export const canStrike = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile,
  home?: Tile[]
): boolean =>
  strikeSquares(dependencies, player, unit, target, home).length > 0;

// Sets `unit` off for the first of `ranked` it has a path to, costing no more than `budget` says for that square (a
//  path round other players' units or cities can cost more than the moves between). Returns whether there was one.
const flyTo = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  ranked: Tile[],
  budget: (tile: Tile) => number = (): number => Infinity
): boolean => {
  for (const tile of ranked) {
    if (tile === unit.tile()) {
      memory.unitPathData.delete(unit);

      return true;
    }

    const path = Path.for(
      unit,
      unit.tile(),
      tile,
      dependencies.pathFinderRegistry
    );

    if (path && path.movementCost() <= budget(tile)) {
      memory.unitPathData.set(unit, path);

      return true;
    }
  }

  return false;
};

// The most a path to `square`, beside `unit`'s target, may cost: a move to spare for the attack, and for a fuelled
//  unit whose attack doesn't end its turn (a fighter), the way home after it too.
const strikeBudget = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  home: Tile[]
): ((square: Tile) => number) => {
  const moves = unit.moves().value(),
    state = fuelFor(dependencies, unit);

  return (square: Tile): number =>
    state === null || unit.hasTrait(SingleUse) || unit.hasTrait(AttackEndsTurn)
      ? moves - 1
      : Math.min(
          moves - 1,
          state.reach -
            1 -
            homeDistance(dependencies, player, unit, square, home)
        );
};

// The squares beside `target` `unit` could strike from, nearest it first (in moves): not one with another player's
//  units on it, which can't be moved to, nor one it would land on to refuel (a city of its player's, a carrier), which
//  ends its turn there, unless it stands on it already; for a nuclear weapon, only an empty square that isn't a city,
//  as the original's (it would be caught in its own blast).
const besideFor = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile
): Tile[] => {
  const nuclear = unit.hasTrait(Detonates);

  return target
    .getNeighbours()
    .filter((tile: Tile): boolean => {
      const units = dependencies.unitRegistry
        .getByTile(tile)
        .filter((other: Unit): boolean => !other.destroyed());

      // A nuclear weapon's own square counts as empty: it fires from where it stands when that's beside its target.
      if (nuclear) {
        return (
          units.every((other: Unit): boolean => other === unit) &&
          dependencies.cityRegistry.getByTile(tile) === null &&
          (tile === unit.tile() ||
            !refuels(dependencies.ruleRegistry, unit, tile))
        );
      }

      return (
        units.every((other: Unit): boolean => other.player() === player) &&
        (tile === unit.tile() ||
          !refuels(dependencies.ruleRegistry, unit, tile))
      );
    })
    .sort(
      (a: Tile, b: Tile): number =>
        movesBetween(a, unit.tile()) - movesBetween(b, unit.tile())
    );
};

// The enemy unit `unit`, a fighter, goes for: on the target board, a unit in the air or alone on its square, that it
//  would beat and can strike and get back from (`canStrike`), the nearest by the original's score (twice the distance, 1 less for one with a range, 1 less again for
//  one alone). `null` with none.
export const fighterTarget = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home: Tile[] = refuellingTiles(dependencies, player, unit)
): Tile | null => {
  const moves = unit.moves().value();
  let best: Tile | null = null,
    bestScore = Infinity;

  memory.targets.enemyUnitsToAttack.forEach((tile: Tile): void => {
    if (movesBetween(tile, unit.tile()) > moves) {
      return;
    }

    const units = dependencies.unitRegistry
        .getByTile(tile)
        .filter((other: Unit): boolean => !other.destroyed()),
      enemies = units.filter((other: Unit): boolean =>
        hostile(dependencies, player, other.player())
      );

    if (enemies.length === 0 || enemies.length !== units.length) {
      return;
    }

    const flying = enemies.some((other: Unit): boolean => isA(other, Air));

    if (!flying && units.length > 1) {
      return;
    }

    if (
      !canStrike(dependencies, player, unit, tile, home) ||
      attackOdds(dependencies, unit, tile) < ATTACK_ODDS
    ) {
      return;
    }

    const score =
      movesBetween(tile, unit.tile()) * 2 -
      (enemies.some(
        (other: Unit): boolean => fuelFor(dependencies, other) !== null
      )
        ? 1
        : 0) -
      (units.length === 1 ? 1 : 0);

    // The last of equally good targets, as the original's `<=`.
    if (score <= bestScore) {
      bestScore = score;
      best = tile;
    }
  });

  return best;
};

// The enemy city `unit`, a bomber, helicopter or missile, raids this turn: in its reach, defended (a city with no one
//  in it is for land units to take), one it would beat, scoring best by the original's `ai_air_raid_city`. `null` with
//  none.
export const raidTarget = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home: Tile[] = refuellingTiles(dependencies, player, unit)
): Tile | null => {
  const own = new Set<Tile>(
      dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other: Unit): boolean => !other.destroyed())
        .map((other: Unit): Tile => other.tile())
    ),
    over = unit.tile().isLand()
      ? continentOf(dependencies.turn.value(), unit.tile())
      : null;
  let best: Tile | null = null,
    bestScore = -Infinity;

  [
    ...memory.targets.enemyCitiesToAttack,
    ...memory.targets.citiesToLiberate,
  ].forEach((tile: Tile): void => {
    const city = dependencies.cityRegistry.getByTile(tile),
      defenders = dependencies.unitRegistry
        .getByTile(tile)
        .filter((other: Unit): boolean => !other.destroyed());

    if (
      city === null ||
      !hostile(dependencies, player, city.player()) ||
      defenders.length === 0 ||
      movesBetween(tile, unit.tile()) > unit.moves().value() ||
      !canStrike(dependencies, player, unit, tile, home) ||
      attackOdds(dependencies, unit, tile) < ATTACK_ODDS
    ) {
      return;
    }

    const score =
      dependencies.cityGrowthRegistry.getByCity(city).size() * 10 -
      25 * defenders.length +
      (over?.has(tile) ? 40 : 0) +
      60 *
        tile
          .getNeighbours()
          .filter((neighbour: Tile): boolean => own.has(neighbour)).length;

    if (score >= bestScore) {
      bestScore = score;
      best = tile;
    }
  });

  return best;
};

// How far from a nuclear attack's target another player's city with an SDI Defence stops it (Civ2's 3).
export const SDI_RANGE = 3;

// Whether a nuclear attack on `target` by `player` would be stopped: a city of another player's with an SDI Defence
//  within `SDI_RANGE` of it, as Civ2's rule stops one (the weapon is lost).
const sdiProtected = (
  dependencies: Dependencies,
  player: Player,
  target: Tile
): boolean =>
  liveCities(dependencies).some(
    (city: City): boolean =>
      city.player() !== player &&
      movesBetween(city.tile(), target) <= SDI_RANGE &&
      dependencies.cityImprovementRegistry
        .getByCity(city)
        .some(
          (improvement: CityImprovement): boolean =>
            improvement instanceof SdiDefence
        )
  );

// Whether `city` could be a nuclear weapon's target for `player` (the original's `ai_nuke_pick_target`, short of the
//  weapon's reach and the score around it): larger than 4, with no other player's SDI Defence within 3 of it (the
//  original looks only at the city's own; Civ2's rule stops a strike near any), of a player at war more than half as
//  strong as `player` (with no nuclear weapons) or half again as strong, or that `player` holds a vendetta against.
export const isNuclearTargetCity = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  ownPower: number = powerOfPlayer(dependencies, player),
  powerOf: (other: Player) => number = (other: Player): number =>
    powerOfPlayer(dependencies, other),
  hasNuclear: (other: Player) => boolean = (other: Player): boolean =>
    dependencies.unitRegistry
      .getByPlayer(other)
      .some(
        (otherUnit: Unit): boolean =>
          !otherUnit.destroyed() && otherUnit.hasTrait(Detonates)
      )
): boolean => {
  const owner = city.player();

  if (
    owner === player ||
    !atWar(dependencies, player, owner) ||
    dependencies.cityGrowthRegistry.getByCity(city).size() <= 4 ||
    sdiProtected(dependencies, player, city.tile())
  ) {
    return false;
  }

  const theirPower = powerOf(owner);

  return (
    theirPower * 2 > ownPower * 3 ||
    hasVendetta(player, owner, dependencies.interactionRegistry) ||
    (!hasNuclear(owner) && theirPower * 2 > ownPower)
  );
};

// The enemy city `unit`, a nuclear weapon, goes for, after the original's `ai_nuke_pick_target`; `null` with none, or
//  when its player's leader isn't aggressive, or it has fewer than 2 such weapons.
export const nuclearTarget = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile | null => {
  if (!isAggressive(dependencies, player)) {
    return null;
  }

  const ownNuclear = dependencies.unitRegistry
    .getByPlayer(player)
    .filter(
      (other: Unit): boolean =>
        !other.destroyed() &&
        airKindOf(other.constructor, dependencies.ruleRegistry) === 'nuclear'
    ).length;

  if (ownNuclear < 2) {
    return null;
  }

  const ownCities = dependencies.cityRegistry.getByPlayer(player),
    ownPower = powerOfPlayer(dependencies, player),
    powers = new Map<Player, number>(),
    powerOf = (other: Player): number => {
      if (!powers.has(other)) {
        powers.set(other, powerOfPlayer(dependencies, other));
      }

      return powers.get(other)!;
    },
    home = refuellingTiles(dependencies, player, unit),
    nuclearOwners = new Map<Player, boolean>(),
    hasNuclear = (other: Player): boolean => {
      if (!nuclearOwners.has(other)) {
        nuclearOwners.set(
          other,
          dependencies.unitRegistry
            .getByPlayer(other)
            .some(
              (otherUnit: Unit): boolean =>
                !otherUnit.destroyed() && otherUnit.hasTrait(Detonates)
            )
        );
      }

      return nuclearOwners.get(other)!;
    };
  let best: Tile | null = null,
    bestScore = -1;

  // The registry's entries include destroyed cities; `getByTile` and `getByPlayer` don't.
  // Only cities the player has seen (its world), as the target board's are.
  const known = dependencies.playerWorldRegistry.getByPlayer(player);

  liveCities(dependencies)
    .filter((city: City): boolean => known.includes(city.tile()))
    .forEach((city: City): void => {
      if (
        !isNuclearTargetCity(
          dependencies,
          player,
          city,
          ownPower,
          powerOf,
          hasNuclear
        )
      ) {
        return;
      }

      const size = dependencies.cityGrowthRegistry.getByCity(city).size();

      let score = Math.floor(size / 2);

      [city.tile(), ...city.tile().getNeighbours()].forEach(
        (tile: Tile): void => {
          // The weapon itself isn't counted: the original's isn't beside its target when it scores it.
          const units = dependencies.unitRegistry
            .getByTile(tile)
            .filter(
              (other: Unit): boolean => !other.destroyed() && other !== unit
            );

          if (units.length === 0) {
            return;
          }

          const tileOwner = units[0].player();

          // The barbarians' squares count for nothing either way, as in the original.
          if (isBarbarian(tileOwner)) {
            return;
          }

          if (tileOwner === player) {
            score -= 2;
          } else if (atWar(dependencies, player, tileOwner)) {
            score += units.length;
          } else {
            score -= 99;
          }
        }
      );

      // In reach of this weapon this turn: the original moves it straight beside any target in reach of one of its
      //  player's cities.
      if (
        score > bestScore &&
        canStrike(dependencies, player, unit, city.tile(), home)
      ) {
        bestScore = score;
        best = city.tile();
      }
    });

  return best !== null && bestScore >= 10 - Math.max(0, 5 - ownCities.length)
    ? best
    : null;
};

// Where `unit`, a paratrooper in its player's city with all its moves, could drop, best first: onto an empty city of a player at war
//  within its range, the largest (the original's `ai_orders_paratrooper` takes the first in its list of cities),
//  passing over one where a unit of its player's stands beside it already; `null` with none, or when it's the last unit that could defend its own
//  city. (The original picks the city's square too, scoring it 500 against the squares around, so that's always where
//  it lands.)
export const paradropTargets = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile[] => {
  const from = unit.tile(),
    city = dependencies.cityRegistry.getByTile(from),
    live = (tile: Tile): Unit[] =>
      dependencies.unitRegistry
        .getByTile(tile)
        .filter((other: Unit): boolean => !other.destroyed());

  if (
    city === null ||
    city.player() !== player ||
    unit.moves().value() < unit.movement().value() ||
    !live(from).some(
      (other: Unit): boolean =>
        other !== unit &&
        other.player() === player &&
        isA(other, Land) &&
        !other.hasTrait(Terraforms) &&
        !other.hasTrait(NonCombatant) &&
        other.defence().value() > 0
    )
  ) {
    return [];
  }

  const known = dependencies.playerWorldRegistry.getByPlayer(player);

  return liveCities(dependencies)
    .filter(
      (other: City): boolean =>
        known.includes(other.tile()) &&
        atWar(dependencies, player, other.player()) &&
        movesBetween(other.tile(), from) <= PARADROP_RANGE &&
        live(other.tile()).length === 0 &&
        !other
          .tile()
          .getNeighbours()
          .some((tile: Tile): boolean =>
            live(tile).some((own: Unit): boolean => own.player() === player)
          )
    )
    .sort(
      (a: City, b: City): number =>
        dependencies.cityGrowthRegistry.getByCity(b).size() -
        dependencies.cityGrowthRegistry.getByCity(a).size()
    )
    .map((city: City): Tile => city.tile());
};

// The first of `paradropTargets`, or `null` with none.
export const paradropTarget = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile | null => paradropTargets(dependencies, player, unit)[0] ?? null;

export interface AirTask {
  task: 'strike' | 'home' | 'stay' | 'paradrop';
  // The tile beside the aircraft to attack now, or the tile to drop on.
  target: Tile | null;
}

// Gives `unit` (an aircraft, missile or nuclear weapon of a kind `airKindOf` knows) its task for the turn, with a path
//  where it moves (`memory.unitPathData`).
export const planAirTask = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): AirTask | null => {
  const kind = airKindOf(unit.constructor, dependencies.ruleRegistry);

  if (kind === null) {
    return null;
  }

  const home = refuellingTiles(dependencies, player, unit),
    target =
      kind === 'fighter'
        ? fighterTarget(dependencies, player, memory, unit, home)
        : kind === 'nuclear'
        ? nuclearTarget(dependencies, player, unit)
        : raidTarget(dependencies, player, memory, unit, home);

  if (target !== null) {
    const squares = strikeSquares(dependencies, player, unit, target, home);

    if (squares.includes(unit.tile())) {
      memory.unitPathData.delete(unit);

      return { task: 'strike', target };
    }

    if (
      flyTo(
        dependencies,
        memory,
        unit,
        squares,
        strikeBudget(dependencies, player, unit, home)
      )
    ) {
      return { task: 'strike', target };
    }
  }

  return planHome(dependencies, player, memory, unit, home);
};

// Where `unit` goes with nothing to strike: stays where it refuels (or heals, for one with no fuel, a helicopter), or
//  flies back to the nearest such square. With nowhere to go, it stays.
export const planHome = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home: Tile[] = refuellingTiles(dependencies, player, unit)
): AirTask => {
  if (home.includes(unit.tile()) || home.length === 0) {
    memory.unitPathData.delete(unit);

    return { task: 'stay', target: null };
  }

  if (
    flyTo(
      dependencies,
      memory,
      unit,
      [...home].sort(
        (a: Tile, b: Tile): number =>
          movesBetween(a, unit.tile()) - movesBetween(b, unit.tile())
      )
    )
  ) {
    return { task: 'home', target: null };
  }

  return { task: 'stay', target: null };
};

// What `player` wants of `kind`, given `city` could build one, as `[wanted, have]` (have counting those on order); `null`
//  when `city` shouldn't build one. `reach` is how far the kind reaches from the city in squares (its type's moves):
//  - a fighter while an enemy aircraft is within 8 of the city or an enemy land unit within 3: one more than the enemy
//    aircraft in reach of it, at most one for each of its player's cities;
//  - a bomber or helicopter while a defended enemy city is in reach: one for each 3 cities, at most 4; a cruise
//    missile the same, one for each 4 cities, at most 2;
//  - a nuclear weapon, for an aggressive leader, while a city larger than 4 of a player at war is in reach: 2;
//  - a paratrooper while an empty city of a player at war is in drop range: one for each 4 cities, at most 2.
export const airWanted = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  kind: AirKind | 'paratrooper',
  reach: number
): [number, number] | null => {
  const cities = dependencies.cityRegistry.getByPlayer(player),
    units = dependencies.unitRegistry
      .getByPlayer(player)
      .filter((unit: Unit): boolean => !unit.destroyed()),
    isKind = (UnitType: object): boolean =>
      kind === 'paratrooper'
        ? isParatrooperType(UnitType, dependencies.ruleRegistry)
        : airKindOf(UnitType, dependencies.ruleRegistry) === kind,
    have =
      units.filter((unit: Unit): boolean => isKind(unit.constructor)).length +
      cities.filter((other: City): boolean => {
        const building = dependencies.cityBuildRegistry
          .getByCity(other)
          .building();

        return building !== null && isKind(building.item());
      }).length,
    near = (tile: Tile, distance: number): boolean =>
      movesBetween(tile, city.tile()) <= distance,
    enemyCitiesNear = (distance: number, test: (other: City) => boolean) =>
      [...targets.enemyCitiesToAttack, ...targets.citiesToLiberate]
        .map((tile: Tile): City | null =>
          dependencies.cityRegistry.getByTile(tile)
        )
        .filter(
          (other: City | null): other is City =>
            other !== null && near(other.tile(), distance) && test(other)
        );

  if (kind === 'fighter') {
    const enemiesNear = targets.enemyUnitsToAttack.flatMap(
        (tile: Tile): Unit[] =>
          dependencies.unitRegistry
            .getByTile(tile)
            .filter(
              (other: Unit): boolean =>
                !other.destroyed() &&
                hostile(dependencies, player, other.player())
            )
      ),
      aircraft = enemiesNear.filter(
        (other: Unit): boolean =>
          isA(other, Air) && near(other.tile(), AIR_THREAT_DISTANCE)
      ),
      landThreat = enemiesNear.some(
        (other: Unit): boolean =>
          isA(other, Land) && near(other.tile(), LAND_THREAT_DISTANCE)
      );

    if (aircraft.length === 0 && !landThreat) {
      return null;
    }

    // The original keeps fewer than the strongest person's bombers and helicopters + 2; with no person here, 1 more
    //  than the enemy aircraft in reach of its cities.
    return [Math.min(cities.length, aircraft.length + 1), have];
  }

  if (kind === 'paratrooper') {
    const weak = enemyCitiesNear(
      PARADROP_RANGE,
      (other: City): boolean =>
        atWar(dependencies, player, other.player()) &&
        dependencies.unitRegistry
          .getByTile(other.tile())
          .filter((unit: Unit): boolean => !unit.destroyed()).length === 0
    );

    return weak.length === 0
      ? null
      : [
          Math.min(
            MAX_PARATROOPERS,
            Math.ceil(cities.length * PARATROOPERS_PER_CITY)
          ),
          have,
        ];
  }

  if (kind === 'nuclear') {
    if (!isAggressive(dependencies, player)) {
      return null;
    }

    const ownPower = powerOfPlayer(dependencies, player),
      targets = enemyCitiesNear(reach, (other: City): boolean =>
        isNuclearTargetCity(dependencies, player, other, ownPower)
      );

    return targets.length === 0 ? null : [NUCLEAR_WANTED, have];
  }

  const defended = enemyCitiesNear(
    reach,
    (other: City): boolean =>
      hostile(dependencies, player, other.player()) &&
      dependencies.unitRegistry
        .getByTile(other.tile())
        .some((unit: Unit): boolean => !unit.destroyed())
  );

  if (defended.length === 0) {
    return null;
  }

  return kind === 'missile'
    ? [
        Math.min(MAX_MISSILES, Math.ceil(cities.length * MISSILES_PER_CITY)),
        have,
      ]
    : [
        Math.min(MAX_STRIKERS, Math.ceil(cities.length * STRIKERS_PER_CITY)),
        have,
      ];
};

export default planAirTask;
