// Generic: keeps the player's cities out of civil disorder before its turn ends (civ-clone/web-renderer#156), rather
//  than reacting once the engine has found them in it. The ruleset's own `CivilDisorder` rules say whether a city is in
//  disorder: this only changes what the city's citizens do and what it builds, and asks those rules again after each
//  change.
//
// It runs once the player's units have moved (`AfterTurn`), because where they stand changes how unhappy a city is:
//  martial law, units away from home. Nothing between then and the engine's own check at the player's next turn start
//  puts the Entertainers back to work. `assignWorkers` (run by `reviewCities`, and by the engine's `TileReassigned` and
//  growth rules) only places citizens who have no job, and a city that shrinks loses its specialists first. So a city
//  calmed here is still calm when the engine checks, unless something else changes first: an enemy stands on a tile
//  it works, or it loses a unit. A city that will grow at that turn start is calmed for the size it will be.
import {
  Food,
  Production,
  Trade,
  Unhappiness,
} from '@civ-clone/library-city/Yields';
import {
  reduceYield,
  reduceYields,
} from '@civ-clone/core-yield/lib/reduceYields';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory, { UncalmedReason } from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Specialist from '@civ-clone/core-city/Specialist';
import SpendCost from '@civ-clone/core-treasury/SpendCost';
import Tile from '@civ-clone/core-world/Tile';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import Yield from '@civ-clone/core-yield/Yield';
import { changeWorkedTile } from '@civ-clone/library-city/lib/assignWorkers';

// Why a city was left to fall into disorder: `Memory` in `base-strategy-ai` explains each reason.
export type { UncalmedReason };

// The ruleset's part. `Civ1/disorder` has Civ1's.
export interface DisorderPolicy {
  // What a city that started the turn in disorder builds, in order of preference: the first it can build.
  calmingImprovements: IBuildable[];
  // The share of the player's treasury such a city may spend hurrying it.
  purchaseShare: number;
  // How many more of `city`'s citizens are unhappy once it has grown by one.
  unhappinessOnGrowth(dependencies: Dependencies, city: City): number;
  // Whether `city` started this turn in civil disorder.
  wasInDisorder(dependencies: Dependencies, city: City): boolean;
}

// The functions below take `city`'s yields, as it stands, from a caller that has them already: working them out isn't
//  cheap (civ-clone/web-renderer#315).
const foodBalance = (yields: Yield[]): number => reduceYield(yields, Food);

// Whether the ruleset's rules find `city` in civil disorder as it stands, or, given `extraUnhappiness`, with that many
//  more unhappy citizens. Those take the place of content (or failing that, happy) citizens rather than adding to them,
//  which can only make disorder likelier, so this errs on the side of an Entertainer too many.
export const inDisorder = (
  dependencies: Dependencies,
  city: City,
  extraUnhappiness: number = 0,
  yields: Yield[] = city.yields()
): boolean =>
  dependencies.ruleRegistry
    .process(
      CivilDisorder,
      city,
      extraUnhappiness > 0
        ? [...yields, new Unhappiness(extraUnhappiness)]
        : yields
    )
    .some((result: boolean): boolean => result);

// Whether `city` will grow at the player's next turn start, with the food it has now.
export const willGrow = (
  dependencies: Dependencies,
  city: City,
  yields: Yield[] = city.yields()
): boolean => {
  const cityGrowth = dependencies.cityGrowthRegistry.getByCity(city);

  return (
    cityGrowth.progress().value() + foodBalance(yields) >=
    cityGrowth.cost().value()
  );
};

// Whether `city` is in disorder as it stands (`now`), or will be once it grows at the next turn start (`growth`).
const disorderRisk = (
  dependencies: Dependencies,
  policy: DisorderPolicy,
  city: City,
  yields: Yield[]
): 'now' | 'growth' | null => {
  if (inDisorder(dependencies, city, 0, yields)) {
    return 'now';
  }

  if (!willGrow(dependencies, city, yields)) {
    return null;
  }

  const unhappiness = policy.unhappinessOnGrowth(dependencies, city);

  return unhappiness > 0 && inDisorder(dependencies, city, unhappiness, yields)
    ? 'growth'
    : null;
};

// The tiles `city` works, other than its centre, in the order their citizens are made Entertainers: the least food
//  first, then the fewest shields, then the least trade, so the city keeps as much food as it can. Ties keep the order
//  the tiles were taken in.
export const leastValuableWorkedTiles = (
  dependencies: Dependencies,
  city: City
): Tile[] =>
  dependencies.workedTileRegistry
    .getByCity(city)
    .map((workedTile: WorkedTile): Tile => workedTile.tile())
    .filter((tile: Tile): boolean => tile !== city.tile())
    .map((tile: Tile): [Tile, number[]] => [
      tile,
      reduceYields(tile.yields(city.player()), Food, Production, Trade),
    ])
    .sort(
      ([, a]: [Tile, number[]], [, b]: [Tile, number[]]): number =>
        a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
    )
    .map(([tile]: [Tile, number[]]): Tile => tile);

// Puts `city`'s Entertainers, the ruleset's first kind of specialist (what a citizen becomes when taken off a tile),
//  back to work on the best tiles free, as `assignWorkers` places any citizen without a job. A citizen with no tile to
//  work becomes one again. Other kinds of specialist are left as they are.
export const releaseEntertainers = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
): void => {
  const [DefaultType] = dependencies.availableSpecialistRegistry.entries();

  if (!DefaultType) {
    return;
  }

  const entertainers = dependencies.specialistRegistry
    .getByCity(city)
    .filter(
      (specialist: Specialist): boolean => specialist instanceof DefaultType
    );

  if (entertainers.length === 0) {
    return;
  }

  dependencies.specialistRegistry.unregister(...entertainers);

  knowledge.assignWorkers(dependencies, city);
};

// Takes `tile`'s citizen off it to be an Entertainer, or puts an Entertainer back on it, as a player clicking the tile
//  on the city map does.
const toggleTile = (dependencies: Dependencies, city: City, tile: Tile) =>
  changeWorkedTile(
    city,
    tile,
    dependencies.playerWorldRegistry,
    dependencies.cityGrowthRegistry,
    dependencies.workedTileRegistry,
    dependencies.specialistRegistry,
    dependencies.availableSpecialistRegistry
  );

// Starts from `city` with every Entertainer back at work, then makes Entertainers from its least valuable worked tiles
//  (`leastValuableWorkedTiles`), one at a time, until the ruleset's rules find it calm, both as it is and, if it will
//  grow, at its new size. Returns `null` once it's calm, or why it couldn't be calmed (`UncalmedReason`).
//
// An Entertainer that would leave the city short of food isn't made, and none after it: the tiles that follow give at
//  least as much food. Short of food means a deficit, even one the food store would cover for a turn (that's where
//  civ-clone/web-renderer#154's luxury rate comes in). An Entertainer the city only needs at its new size isn't made
//  if it would stop the city growing either. An Entertainer taken from a tile that gives no food is always made.
//
// A city that can't be calmed keeps the Entertainers that keep it calm as it stands, if any do, and otherwise has them
//  all put back to work: they'd cost it food and shields and leave it in disorder all the same.
export const calmCity = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City,
  policy: DisorderPolicy
): UncalmedReason | null => {
  releaseEntertainers(dependencies, knowledge, city);

  // `city`'s yields as it stands, worked out again after each tile is toggled.
  let yields = city.yields(),
    risk = disorderRisk(dependencies, policy, city, yields);

  if (risk === null) {
    return null;
  }

  const taken: Tile[] = [];

  // How many of `taken` keep the city calm as it stands, once that's known.
  let calmAsItStands: number | null = risk === 'growth' ? 0 : null,
    reason: UncalmedReason = 'tiles';

  for (const tile of leastValuableWorkedTiles(dependencies, city)) {
    const before = foodBalance(yields);

    toggleTile(dependencies, city, tile);

    yields = city.yields();

    const after = foodBalance(yields),
      lessFood = after < before;

    if (lessFood && after < 0) {
      reason = 'food';
    } else if (
      lessFood &&
      risk === 'growth' &&
      !willGrow(dependencies, city, yields)
    ) {
      reason = 'growth';
    } else {
      taken.push(tile);

      risk = disorderRisk(dependencies, policy, city, yields);

      if (risk === null) {
        return null;
      }

      if (risk === 'growth' && calmAsItStands === null) {
        calmAsItStands = taken.length;
      }

      continue;
    }

    toggleTile(dependencies, city, tile);

    break;
  }

  if (calmAsItStands === null) {
    releaseEntertainers(dependencies, knowledge, city);

    return reason;
  }

  taken
    .slice(calmAsItStands)
    .forEach((tile: Tile) => toggleTile(dependencies, city, tile));

  return reason;
};

// For a city that started the turn in disorder: builds the first of `improvements` it can (one it has already isn't
//  available), unless it's building one of them already. It doesn't switch when it has more shields in hand than the
//  improvement costs, since the rest would be thrown away when it's finished. Returns what the city is building to calm
//  itself, or `null`.
export const buildToCalm = (
  dependencies: Dependencies,
  city: City,
  improvements: IBuildable[]
): IBuildable | null => {
  const cityBuild = dependencies.cityBuildRegistry.getByCity(city),
    building = cityBuild.building();

  if (building !== null && improvements.includes(building.item())) {
    return building.item();
  }

  const available = cityBuild.available(),
    [buildItem] = improvements
      .map((improvement: IBuildable): BuildItem | undefined =>
        available.find(
          (buildItem: BuildItem): boolean => buildItem.item() === improvement
        )
      )
      .filter(
        (buildItem: BuildItem | undefined): buildItem is BuildItem =>
          buildItem !== undefined
      );

  if (!buildItem || cityBuild.progress().value() > buildItem.cost().value()) {
    return null;
  }

  cityBuild.build(buildItem.item());

  return buildItem.item();
};

// Spends up to `share` of the player's treasury on what `city` is building: the whole of it, through the treasury, if
//  the ruleset's price is within that, or otherwise as many shields as that buys at the same price per shield. That's
//  exact for an improvement, whose price is the same for each shield left. Returns what it spent.
export const hurry = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  share: number
): number => {
  const cityBuild = dependencies.cityBuildRegistry.getByCity(city),
    remaining = cityBuild.remaining();

  if (cityBuild.building() === null || !(remaining > 0)) {
    return 0;
  }

  for (const treasury of dependencies.playerTreasuryRegistry.getByPlayer(
    player
  )) {
    const [spendCost] = treasury
      .cost(city)
      .filter(
        (spendCost: SpendCost): boolean =>
          spendCost.resource() === treasury.yield()
      );

    if (!spendCost) {
      continue;
    }

    const budget = Math.floor(treasury.value() * share),
      price = spendCost.value();

    if (price <= budget) {
      treasury.buy(city);

      return price;
    }

    const shields = Math.floor((budget * remaining) / price),
      cost = Math.ceil((shields * price) / remaining);

    if (shields < 1) {
      return 0;
    }

    cityBuild.add(new Yield(shields));
    treasury.subtract(cost);

    return cost;
  }

  return 0;
};

// Calms each of the player's cities again (`calmCity`), after something that changes how happy they all are at once,
//  such as the luxury rate. Unlike `preventDisorder`, it doesn't switch production or buy anything: that was done
//  already. Notes the cities left in disorder in `memory` afresh.
export const calmCities = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: DisorderPolicy
): void => {
  memory.uncalmedCities.clear();

  dependencies.cityRegistry.getByPlayer(player).forEach((city: City): void => {
    const reason = calmCity(dependencies, knowledge, city, policy);

    if (reason !== null) {
      memory.uncalmedCities.set(city, reason);
    }
  });
};

// The whole pass over the player's cities, at the end of its turn. Notes in `memory` the cities left in disorder, and
//  why, for whatever can calm them another way (civ-clone/web-renderer#154's luxury rate).
export const preventDisorder = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: DisorderPolicy
): void => {
  memory.uncalmedCities.clear();

  dependencies.cityRegistry.getByPlayer(player).forEach((city: City): void => {
    if (
      policy.wasInDisorder(dependencies, city) &&
      buildToCalm(dependencies, city, policy.calmingImprovements) !== null
    ) {
      hurry(dependencies, player, city, policy.purchaseShare);
    }

    const reason = calmCity(dependencies, knowledge, city, policy);

    if (reason !== null) {
      memory.uncalmedCities.set(city, reason);
    }
  });
};

export default preventDisorder;
