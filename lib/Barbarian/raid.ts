// Civ1: how a barbarian unit moves (v474.05 `AIEngine.cs` `F0_25fb_362d_MoveBarbarianUnit`), for `BarbarianClient`'s
//  `Raid` strategy (civ-clone/web-renderer#169).
import {
  Attack,
  CaptureCity,
  Disembark,
  Fortify,
  Move,
  SneakAttack,
  SneakCaptureCity,
} from '@civ-clone/library-unit/Actions';
import { Diplomat } from '@civ-clone/civ1-unit/Units';
import { Irrigation, Mine } from '@civ-clone/civ1-world/TileImprovements';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import LandMass from '@civ-clone/core-world/LandMass';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import cityGold from '@civ-clone/civ1-barbarians/lib/cityGold';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import { nearPole } from '@civ-clone/civ1-barbarians/lib/polar';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

// A barbarian within this many of v474.05's 50 rows of either edge leaves the map.
export const POLAR_ROWS = 2;
// Every fourth turn, staggered by unit, a raider too far from any city, or on the wrong continent, gives up.
export const STRANDED_EVERY = 4;
export const TOO_FAR = 8;
// How near a city a ship must be to land its raiders.
export const LANDING_DISTANCE = 8;
// How near a friendly unit the leader walks to.
export const LEADER_FOLLOWS = 4;

const STEP_LIMIT = 50;

// How far `to` is from `from` on one axis, the short way round a wrapping world: negative for west or north.
const wrappedDelta = (from: number, to: number, size: number): number => {
  const delta = (((to - from) % size) + size) % size;

  return delta > size / 2 ? delta - size : delta;
};

const landMassOf = (tile: Tile): LandMass | null =>
  tile
    .map()
    .landMasses()
    .find((landMass: LandMass): boolean => landMass.hasTile(tile)) ?? null;

export const liveCities = (dependencies: Dependencies): City[] =>
  dependencies.cityRegistry
    .entries()
    .filter((city: City): boolean => !city.destroyed());

export const nearestCity = (tile: Tile, cities: City[]): City | null =>
  cities.reduce(
    (nearest: City | null, city: City): City =>
      nearest === null ||
      tile.distanceFrom(city.tile()) < tile.distanceFrom(nearest.tile())
        ? city
        : nearest,
    null
  );

// Takes `action` and says whether it did anything, as `moveUnit`'s `takeAction` does, so a step that changes nothing
//  isn't taken again for ever.
const takeAction = (unit: Unit, action: Action): boolean => {
  const tile = unit.tile(),
    moves = unit.moves().value();

  unit.action(action);

  return (
    !unit.active() || unit.tile() !== tile || unit.moves().value() !== moves
  );
};

const standDown = (dependencies: Dependencies, unit: Unit): void => {
  if (unit.active() && !unit.destroyed() && unit.moves().value() > 0) {
    noOrders(dependencies, unit);
  }
};

// The plain step onto a square: not an `Embark` or `Disembark`, which extend `Move` and would put a raider back on its
//  ship.
const plainMove = (actions: Action[]): Action | undefined =>
  actions.find((action: Action): boolean => action.constructor === Move);

const ownCityAt = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): City | null => {
  const city = dependencies.cityRegistry.getByTile(tile);

  return city !== null && city.player() === player ? city : null;
};

export type Step = { action: Action; score: number; to: Tile };

/**
 * The best step from where `unit` stands, scored as v474.05 does (`AIEngine.cs` L2412-2440): 0–5 at random, +6 onto
 * irrigation or a mine, +4 onto any square but the unit's own city, +99 to attack a unit that isn't a Diplomat, +2 for
 * each axis on which the step agrees with the way to `target` (straight on scores +4, a diagonal +2). An enemy city
 * next door is always entered, defended or not. `null` when no neighbour can be stepped onto or attacked.
 */
export const bestStep = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile | null
): Step | null => {
  const from = unit.tile(),
    world = from.map(),
    towards = target
      ? [
          Math.sign(wrappedDelta(from.x(), target.x(), world.width())),
          Math.sign(wrappedDelta(from.y(), target.y(), world.height())),
        ]
      : null;

  let best: Step | null = null;

  for (const to of from.getNeighbours()) {
    const actions = unit.actions(to),
      enemy = dependencies.unitRegistry
        .getByTile(to)
        .find((other: Unit): boolean => other.player() !== player),
      city = dependencies.cityRegistry.getByTile(to),
      capture = actions.find(
        (action: Action): boolean =>
          action instanceof CaptureCity || action instanceof SneakCaptureCity
      ),
      attack = actions.find(
        (action: Action): boolean =>
          action instanceof Attack || action instanceof SneakAttack
      ),
      fight = capture ?? attack,
      action = fight ?? (enemy ? null : plainMove(actions));

    if (!action) {
      continue;
    }

    if (fight && city !== null && city.player() !== player) {
      return { action, score: Infinity, to };
    }

    let score = Math.floor(dependencies.randomNumberGenerator() * 6);

    if (
      dependencies.tileImprovementRegistry
        .getByTile(to)
        .some(
          (improvement: TileImprovement): boolean =>
            improvement instanceof Irrigation || improvement instanceof Mine
        )
    ) {
      score += 6;
    }

    if (ownCityAt(dependencies, player, to) === null) {
      score += 4;
    }

    if (attack && enemy && !(enemy instanceof Diplomat)) {
      score += 99;
    }

    if (towards !== null) {
      const direction = [
        Math.sign(wrappedDelta(from.x(), to.x(), world.width())),
        Math.sign(wrappedDelta(from.y(), to.y(), world.height())),
      ];

      [0, 1].forEach((axis: number): void => {
        if (direction[axis] === towards[axis]) {
          score += 2;
        }
      });
    }

    if (best === null || score > best.score) {
      best = { action, score, to };
    }
  }

  return best;
};

// Steps `unit` towards `target` (or wherever scores best) until its moves are spent, it reaches `stopAt`, or it enters
//  a city of its own (a capture), then stands it down. Returns whether it stopped for one of the last two.
const march = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile | null,
  stopAt: Tile | null = null
): boolean => {
  let stopped = false;

  for (
    let steps = 0;
    unit.active() &&
    !unit.destroyed() &&
    unit.moves().value() > 0 &&
    steps < STEP_LIMIT;
    steps++
  ) {
    const step = bestStep(dependencies, player, unit, target);

    if (step === null || !takeAction(unit, step.action)) {
      break;
    }

    if (
      unit.destroyed() ||
      unit.tile() === stopAt ||
      ownCityAt(dependencies, player, unit.tile()) !== null
    ) {
      stopped = true;

      break;
    }
  }

  if (!stopped) {
    standDown(dependencies, unit);
  }

  return stopped;
};

// Whether `city`'s owner is worth raiding: not the barbarians themselves, and not a civilization with fewer than 2
//  cities and under 100 gold (`AIEngine.cs` L2343-2347).
const worthRaiding = (dependencies: Dependencies, city: City): boolean => {
  const owner = city.player();

  if (isBarbarian(owner)) {
    return false;
  }

  return (
    dependencies.cityRegistry.getByPlayer(owner).length >= 2 ||
    dependencies.playerTreasuryRegistry
      .getByPlayerAndType(owner, Gold)
      .value() >= 100
  );
};

// In one of its own cities, a raider holds it when it is alone there or a defender (`AIEngine.cs` L2280): fortified
//  if it can be, standing down otherwise. Returns whether it stayed.
const holdCity = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): boolean => {
  const tile = unit.tile();

  if (
    ownCityAt(dependencies, player, tile) === null ||
    (dependencies.unitRegistry
      .getByTile(tile)
      .filter((other: Unit): boolean => other !== unit).length > 0 &&
      unit.defence().value() < unit.attack().value())
  ) {
    return false;
  }

  const fortify = unit
    .actions()
    .find((action: Action): boolean => action instanceof Fortify);

  if (fortify) {
    unit.action(fortify);
  }

  standDown(dependencies, unit);

  return true;
};

/**
 * The leader (the group's Diplomat): he stays with a stack, and otherwise walks to a friendly unit within 4 squares,
 * stopping when he reaches it. What becomes of him when he's stranded, and when he enters a city, is
 * civ-clone/web-renderer#171.
 */
export const leader = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): void => {
  const here = dependencies.unitRegistry
    .getByTile(unit.tile())
    .filter(
      (other: Unit): boolean =>
        other !== unit &&
        other.player() === player &&
        !(other instanceof Diplomat)
    );

  if (here.length > 0) {
    standDown(dependencies, unit);

    return;
  }

  const friend = dependencies.unitRegistry
    .getByPlayer(player)
    .filter(
      (other: Unit): boolean =>
        other !== unit &&
        !(other instanceof Diplomat) &&
        other.tile().isLand() &&
        unit.tile().distanceFrom(other.tile()) < LEADER_FOLLOWS
    )
    .sort(
      (a: Unit, b: Unit): number =>
        unit.tile().distanceFrom(a.tile()) - unit.tile().distanceFrom(b.tile())
    )[0];

  if (!friend) {
    standDown(dependencies, unit);

    return;
  }

  march(dependencies, player, unit, friend.tile(), friend.tile());
  standDown(dependencies, unit);
};

/**
 * A raider's turn: off the map near the poles; every fourth turn, gone if stranded; in a city of its own, held when
 * alone or a defender; otherwise marching on the nearest city of a civilization worth raiding on its continent,
 * attacking what it meets, and holding a city it takes.
 */
export const raid = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): void => {
  const tile = unit.tile();

  if (nearPole(tile, POLAR_ROWS)) {
    unit.destroy();

    return;
  }

  if (unit instanceof Diplomat) {
    leader(dependencies, player, unit);

    return;
  }

  const cities = liveCities(dependencies),
    nearest = nearestCity(tile, cities),
    stagger = dependencies.unitRegistry.entries().indexOf(unit);

  if (
    nearest !== null &&
    (stagger + dependencies.turn.value()) % STRANDED_EVERY === 0 &&
    (landMassOf(tile) !== landMassOf(nearest.tile()) ||
      tile.distanceFrom(nearest.tile()) > TOO_FAR)
  ) {
    unit.destroy();

    return;
  }

  if (holdCity(dependencies, player, unit)) {
    return;
  }

  const target =
    nearest !== null &&
    landMassOf(tile) === landMassOf(nearest.tile()) &&
    worthRaiding(dependencies, nearest)
      ? nearest.tile()
      : null;

  if (march(dependencies, player, unit, target) && !unit.destroyed()) {
    // It took a city: hold it.
    if (!holdCity(dependencies, player, unit)) {
      standDown(dependencies, unit);
    }
  }
};

// Lands `ship`'s cargo on an empty square beside it, on the continent of the nearest city if that city is within
//  reach: each unit is woken (it was stowed asleep) and disembarks, which ends its moves for the turn. Returns whether
//  it landed anyone.
const tryLanding = (
  dependencies: Dependencies,
  player: Player,
  ship: NavalTransport
): boolean => {
  const tile = ship.tile(),
    cargo = ship.cargo(),
    nearest = nearestCity(tile, liveCities(dependencies));

  if (
    cargo.length === 0 ||
    nearest === null ||
    tile.distanceFrom(nearest.tile()) > LANDING_DISTANCE
  ) {
    return false;
  }

  const landMass = landMassOf(nearest.tile()),
    landing = tile
      .getNeighbours()
      .find(
        (neighbour: Tile): boolean =>
          neighbour.isLand() &&
          !nearPole(neighbour, POLAR_ROWS) &&
          dependencies.cityRegistry.getByTile(neighbour) === null &&
          dependencies.unitRegistry.getByTile(neighbour).length === 0 &&
          landMassOf(neighbour) === landMass
      );

  if (!landing) {
    return false;
  }

  const landed = cargo.filter((unit: Unit): boolean => {
    // Woken first: `Disembark` leaves a stowed unit's `Stowed` busy state alone, and a busy unit is never active again.
    unit.activate();

    const disembark = unit
      .actions(landing)
      .find((action: Action): boolean => action instanceof Disembark);

    if (!disembark) {
      return false;
    }

    unit.action(disembark);

    return unit.tile() === landing;
  });

  if (landed.length === 0) {
    return false;
  }

  dependencies.engine.emit('barbarians:landed', player, nearest, landing);

  return true;
};

// The water squares beside `city`, nearest to `from` first, that `ship` can sail to from `from` (its own square left
//  out: being there already is no way forward), each with its path.
const approaches = (
  dependencies: Dependencies,
  ship: Unit,
  from: Tile,
  city: City
): Path[] =>
  city
    .tile()
    .getNeighbours()
    .filter(
      (neighbour: Tile): boolean => neighbour.isWater() && neighbour !== from
    )
    .sort(
      (a: Tile, b: Tile): number => from.distanceFrom(a) - from.distanceFrom(b)
    )
    .map(
      (end: Tile): Path | null =>
        (Path.for(ship, from, end, dependencies.pathFinderRegistry) as
          | Path
          | undefined) ?? null
    )
    .filter((path: Path | null): path is Path => path !== null);

/**
 * A raiding ship's turn: off the map near the poles; gone once empty; lands its raiders beside it when a city is
 * within 8 (`tryLanding`), before and after sailing; otherwise sails for the city with the best gold for the distance
 * that it can reach a sea square beside, or is gone when there is none.
 */
export const sail = (
  dependencies: Dependencies,
  player: Player,
  ship: NavalTransport
): void => {
  const tile = ship.tile(),
    // A transport is a `Unit` at runtime; its type's keys differ, which is all the cast papers over.
    asUnit = ship as unknown as Unit;

  if (nearPole(tile, POLAR_ROWS)) {
    ship.destroy();

    return;
  }

  if (ship.cargo().length === 0) {
    ship.destroy();

    return;
  }

  if (tryLanding(dependencies, player, ship)) {
    standDown(dependencies, asUnit);

    return;
  }

  const gold = (city: City): number =>
      cityGold(city, {
        cities: dependencies.cityRegistry,
        cityGrowth: dependencies.cityGrowthRegistry,
        playerTreasuries: dependencies.playerTreasuryRegistry,
      }),
    targets = liveCities(dependencies)
      .filter((city: City): boolean => !isBarbarian(city.player()))
      .map((city: City): [City, number] => [
        city,
        Math.floor((gold(city) + 50) / (tile.distanceFrom(city.tile()) + 1)),
      ])
      .filter(([, score]: [City, number]): boolean => score > 0)
      .sort(([, a]: [City, number], [, b]: [City, number]): number => b - a);

  let path: Path | null = null;

  for (const [city] of targets) {
    [path] = approaches(dependencies, asUnit, tile, city);

    if (path) {
      break;
    }
  }

  if (path === null) {
    ship.destroy();

    return;
  }

  for (
    let steps = 0;
    asUnit.active() &&
    asUnit.moves().value() > 0 &&
    path.length > 0 &&
    steps < STEP_LIMIT;
    steps++
  ) {
    const next = path.shift()!;

    if (!next.isNeighbourOf(asUnit.tile())) {
      break;
    }

    const move = plainMove(asUnit.actions(next));

    if (!move || !takeAction(asUnit, move)) {
      break;
    }
  }

  // Arrived with moves to spare: land now rather than next turn.
  if (asUnit.active() && asUnit.moves().value() > 0) {
    tryLanding(dependencies, player, ship);
  }

  standDown(dependencies, asUnit);
};
