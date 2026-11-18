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
//    player at war whose military is half its own or more (and has no nuclear weapons), or half again as large, scored
//    by the enemy units around it, less 2 for each square of its own and 99 for each of a third player not at war, plus
//    half its size; only from a player with two or more, and only once the score reaches 10 (less for a player with
//    fewer than 5 cities);
//  - a **paratrooper** (a type that can `Paradrop`), unmoved in its player's city, drops into an empty enemy city at war
//    within its range, or beside it (`ai_orders_paratrooper`, `:3315`); otherwise it stays.
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
import Tile from '@civ-clone/core-world/Tile';
import Trait from '@civ-clone/core-civilization/Trait';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { fuelFor } from './fuel';
import { isEnemy } from '../Player/rivals';
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
      Math.min(nearest, tile.distanceFrom(other)),
    Infinity
  );

// Whether `unit` could strike `target` this turn and still get back to refuel before its fuel runs out: a missile only
//  needs to reach it; a unit whose attack ends its turn (a bomber) has its later turns' moves; another (a fighter) the
//  moves it has left after the strike. A unit with no fuel (a helicopter) can always.
export const canStrike = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile
): boolean => {
  const distance = target.distanceFrom(unit.tile()),
    moves = Math.floor(unit.moves().value());

  if (distance > moves) {
    return false;
  }

  const state = fuelFor(dependencies, unit);

  if (state === null || unit.hasTrait(SingleUse)) {
    return true;
  }

  const left = unit.hasTrait(AttackEndsTurn)
    ? state.reach - unit.moves().value()
    : state.reach - distance;

  // From beside the target, where it strikes from.
  return homeDistance(dependencies, player, unit, target) - 1 <= left;
};

// Sets `unit` off for the first of `ranked` it has a path to. Returns whether there was one.
const flyTo = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  ranked: Tile[]
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

    if (path) {
      memory.unitPathData.set(unit, path);

      return true;
    }
  }

  return false;
};

// The squares beside `target` `unit` could strike from, nearest it first: a square with another player's units on it
//  can't be moved to.
const besideFor = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile
): Tile[] =>
  target
    .getNeighbours()
    .filter((tile: Tile): boolean =>
      dependencies.unitRegistry
        .getByTile(tile)
        .every((other: Unit): boolean => other.player() === player)
    )
    .sort(
      (a: Tile, b: Tile): number =>
        a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
    );

// The enemy unit `unit`, a fighter, goes for: on the target board, a unit in the air or alone on its square, that it
//  would beat, the nearest by the original's score (twice the distance, 1 less for one with a range, 1 less again for
//  one alone). `null` with none.
export const fighterTarget = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
): Tile | null => {
  let best: Tile | null = null,
    bestScore = Infinity;

  memory.targets.enemyUnitsToAttack.forEach((tile: Tile): void => {
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

    if (attackOdds(dependencies, unit, tile) < ATTACK_ODDS) {
      return;
    }

    const score =
      tile.distanceFrom(unit.tile()) * 2 -
      (enemies.some(
        (other: Unit): boolean => fuelFor(dependencies, other) !== null
      )
        ? 1
        : 0) -
      (units.length === 1 ? 1 : 0);

    if (score < bestScore) {
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
  unit: Unit
): Tile | null => {
  const own = dependencies.unitRegistry
      .getByPlayer(player)
      .filter((other: Unit): boolean => !other.destroyed())
      .map((other: Unit): Tile => other.tile()),
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
      !canStrike(dependencies, player, unit, tile) ||
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
          .filter((neighbour: Tile): boolean => own.includes(neighbour)).length;

    if (score >= bestScore) {
      bestScore = score;
      best = tile;
    }
  });

  return best;
};

// Whether `city` has an SDI Defence, which stops a nuclear attack near it.
const hasSdi = (dependencies: Dependencies, city: City): boolean =>
  dependencies.cityImprovementRegistry
    .getByCity(city)
    .some(
      (improvement: CityImprovement): boolean =>
        improvement instanceof SdiDefence
    );

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
    reach = Math.floor(unit.movement().value()),
    hasNuclear = (other: Player): boolean =>
      dependencies.unitRegistry
        .getByPlayer(other)
        .some(
          (otherUnit: Unit): boolean =>
            !otherUnit.destroyed() && otherUnit.hasTrait(Detonates)
        );
  let best: Tile | null = null,
    bestScore = -1;

  dependencies.cityRegistry.entries().forEach((city: City): void => {
    const owner = city.player(),
      size = dependencies.cityGrowthRegistry.getByCity(city).size();

    if (
      owner === player ||
      !atWar(dependencies, player, owner) ||
      size <= 4 ||
      hasSdi(dependencies, city)
    ) {
      return;
    }

    const theirPower = powerOfPlayer(dependencies, owner);

    if (
      !(
        theirPower * 2 >= ownPower * 3 ||
        (!hasNuclear(owner) && theirPower * 2 >= ownPower)
      )
    ) {
      return;
    }

    let score = Math.floor(size / 2);

    [city.tile(), ...city.tile().getNeighbours()].forEach(
      (tile: Tile): void => {
        const units = dependencies.unitRegistry
          .getByTile(tile)
          .filter((other: Unit): boolean => !other.destroyed());

        if (units.length === 0) {
          return;
        }

        const tileOwner = units[0].player();

        if (tileOwner === player) {
          score -= 2;
        } else if (atWar(dependencies, player, tileOwner)) {
          score += units.length;
        } else {
          score -= 99;
        }
      }
    );

    if (
      score > bestScore &&
      ownCities.some(
        (own: City): boolean => own.tile().distanceFrom(city.tile()) <= reach
      )
    ) {
      bestScore = score;
      best = city.tile();
    }
  });

  return best !== null &&
    bestScore >= 10 - Math.max(0, 5 - ownCities.length) &&
    canStrike(dependencies, player, unit, best)
    ? best
    : null;
};

// Where `unit`, a paratrooper in its player's city with all its moves, drops: an empty city of a player at war within
//  its range, the largest, onto the city itself or, failing that, the empty square beside it furthest from where it
//  stands (the original also counts the square's defence and a fortress there, which aren't read here); `null` with
//  none, or where one of its player's units is beside the city already, as the original.
export const paradropTarget = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Tile | null => {
  const from = unit.tile(),
    city = dependencies.cityRegistry.getByTile(from);

  if (
    city === null ||
    city.player() !== player ||
    unit.moves().value() < unit.movement().value()
  ) {
    return null;
  }

  const [target] = dependencies.cityRegistry
    .entries()
    .filter(
      (other: City): boolean =>
        atWar(dependencies, player, other.player()) &&
        other.tile().distanceFrom(from) <= PARADROP_RANGE &&
        dependencies.unitRegistry
          .getByTile(other.tile())
          .every((other: Unit): boolean => other.destroyed())
    )
    .sort(
      (a: City, b: City): number =>
        dependencies.cityGrowthRegistry.getByCity(b).size() -
        dependencies.cityGrowthRegistry.getByCity(a).size()
    );

  if (!target) {
    return null;
  }

  const around = [target.tile(), ...target.tile().getNeighbours()].filter(
    (tile: Tile): boolean =>
      tile.isLand() && tile.distanceFrom(from) <= PARADROP_RANGE
  );

  if (
    around.some((tile: Tile): boolean =>
      dependencies.unitRegistry
        .getByTile(tile)
        .some(
          (other: Unit): boolean =>
            other.player() === player && !other.destroyed()
        )
    )
  ) {
    return null;
  }

  const [best] = around
    .filter((tile: Tile): boolean =>
      dependencies.unitRegistry
        .getByTile(tile)
        .every((other: Unit): boolean => other.destroyed())
    )
    .map((tile: Tile): [Tile, number] => [
      tile,
      (tile === target.tile() ? 500 : 0) + tile.distanceFrom(from),
    ])
    .sort(([, a], [, b]): number => b - a);

  return best ? best[0] : null;
};

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

  const target =
    kind === 'fighter'
      ? fighterTarget(dependencies, player, memory, unit)
      : kind === 'nuclear'
      ? nuclearTarget(dependencies, player, unit)
      : raidTarget(dependencies, player, memory, unit);

  if (
    target !== null &&
    (kind !== 'fighter' || canStrike(dependencies, player, unit, target))
  ) {
    if (target.isNeighbourOf(unit.tile())) {
      memory.unitPathData.delete(unit);

      return { task: 'strike', target };
    }

    if (
      flyTo(
        dependencies,
        memory,
        unit,
        besideFor(dependencies, player, unit, target)
      )
    ) {
      return { task: 'strike', target };
    }
  }

  // Nothing to strike: where it refuels, or back to the nearest such square.
  const home = refuellingTiles(dependencies, player, unit);

  if (home.includes(unit.tile()) || (kind !== 'fighter' && home.length === 0)) {
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
          a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
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
//  - a paratrooper while a city of a player at war with at most one unit in it is in drop range: one for each 4
//    cities, at most 2.
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
      tile.distanceFrom(city.tile()) <= distance,
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
          .filter((unit: Unit): boolean => !unit.destroyed()).length <= 1
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

    const targets = enemyCitiesNear(
      reach,
      (other: City): boolean =>
        atWar(dependencies, player, other.player()) &&
        dependencies.cityGrowthRegistry.getByCity(other).size() > 4
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
