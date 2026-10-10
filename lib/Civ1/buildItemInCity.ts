// Civ1: what a city builds next: a defender while it has fewer than it wants or martial law could use another unit, explorers while there's land to explore
//  that they could reach from the city and the player has fewer out and on order than it wants, Settlers while the
//  player has fewer out and on order than it wants and they'd have a city site or a terrain job to go to, attackers
//  while there's a war to fight and the player has fewer than it wants, a defender for a city of the player's that has
//  none, a Wonder in the player's most productive city, and otherwise a random pick of the rest, never a Palace or a
//  ship. Apart from a missing defender, each is only started if the city can finish it within the policy's `buildTurns`
//  for its kind, at its net shields; when nothing is left that it can, the cheapest improvement worth having
//  (civ-clone/web-renderer#212). Apart from a missing defender, explorers and Settlers, no unit is started that would
//  leave the city no shields to spare once it has to support it (civ-clone/web-renderer#229).
import BuildWeight from '@civ-clone/base-leader-personality/Rules/Player/BuildWeight';
import Expansion from '@civ-clone/base-leader-personality/Rules/Player/Expansion';
import { product } from '@civ-clone/base-leader-personality/lib/combine';
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { wantsUnit } from '../City/defence';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import { Land, Naval, Worker } from '@civ-clone/library-unit/Types';
import {
  Barracks,
  CityWalls,
  Palace,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import Tile from '@civ-clone/core-world/Tile';
import civ1Knowledge from './knowledge';
import reachableLandToExplore from '../City/explorers';
import { landReachableFrom } from '../City/explorers';
import { civ1TerrainPolicy } from './terrain';
import {
  hasOpenTerrainJob,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import buildTime, { finishesWithin, netShields } from '../City/buildTime';
import isUsefulWonder from './wonders';
import Yield from '@civ-clone/core-yield/Yield';

// How many of each kind of unit a player wants, which decides when its cities stop building units and turn to
//  improvements and Wonders. `ChooseProduction` asks for one per player. The leader's personality scales the Settlers
//  wanted (`Expansion`) and weighs the random pick (`BuildWeight`) on top of it (civ-clone/web-renderer#157).
export interface ProductionPolicy {
  // Attackers wanted for each of the player's cities while there's something to attack.
  attackersPerCity: number;
  // Units wanted out exploring while there's land to explore that a city could reach: `explorers`, and
  //  `explorersPerCity` more per city, but never more than `maxExplorers` (civ-clone/web-renderer#229).
  explorers: number;
  explorersPerCity: number;
  maxExplorers: number;
  // Settlers wanted, out and on order: `settlers`, and `settlersPerCity` more per city, rounded down, all times the
  //  leader's `Expansion`. Counting those on order kept the Settlers a player has in check, but at 3 for any number of
  //  cities it cost players cities by turn 300 in the arena (civ-clone/web-renderer#229).
  settlers: number;
  settlersPerCity: number;
  // The most turns a city spends on each kind of build, at its net shields (`lib/City/buildTime`). A city builds a
  //  missing defender however long it takes, the soonest it can, and Settlers whatever it makes: the arena found that
  //  any limit on Settlers, even only keeping a city on 0 net shields off them, cost the player cities and score
  //  (civ-clone/web-renderer#212).
  buildTurns: {
    improvement: number;
    unit: number;
    wonder: number;
  };
  // The fewest net shields a city makes to start a Wonder, however many it has stored.
  wonderShields: number;
}

export const defaultProductionPolicy: ProductionPolicy = {
  attackersPerCity: 1,
  explorers: 3,
  explorersPerCity: 2,
  maxExplorers: 6,
  settlers: 3,
  settlersPerCity: 0.5,
  buildTurns: {
    improvement: 40,
    unit: 10,
    wonder: 100,
  },
  wonderShields: 2,
};

// A unit built to attack rather than defend.
export const isAttacker = (unit: Unit): boolean =>
  unit instanceof Land && unit.attack().value() > unit.defence().value();

// A land unit that can fight and is out of the player's cities: exploring, or on its way to a target.
const isExploring = (dependencies: Dependencies, unit: Unit): boolean =>
  unit instanceof Land &&
  !(unit instanceof Worker) &&
  unit.attack().value() > 0 &&
  dependencies.cityRegistry.getByTile(unit.tile()) === null;

// Whether one of the player's units is Settlers it has for founding cities, and so counts towards the policy's
//  `settlers` (and keeps its home city from building more): all of its Settlers but its terrain workers
//  (civ-clone/web-renderer#234), as many as Civ1's terrain policy wants, the first to take their jobs. Settlers on
//  terrain jobs beyond those still count: they took a job for want of a city site, and leaving them all out had cities
//  build Settlers for jobs alone, which cost players score and shields by turn 300 in the arena.
export const isFoundingSettlers = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): boolean => {
  if (!(unit instanceof Settlers)) {
    return false;
  }

  const jobs = terrainJobs(dependencies.memoryRegistry.memoryFor(player));

  return (
    !jobs.has(unit) ||
    ![...jobs.keys()]
      .slice(0, civ1TerrainPolicy.workersWanted(dependencies, player))
      .includes(unit)
  );
};

// Whether Settlers built in `city` would have something to do: a city site on the board they could walk to, or a
//  terrain job there no unit of the player's has claimed. With neither, they'd join a city (`lib/Unit/idleWorker`),
//  which gives back the citizen they cost but not the shields.
const settlersWouldHaveWork = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): boolean => {
  const reachable = landReachableFrom(city.tile());

  return (
    targets.goodSitesForCities.some((tile: Tile): boolean =>
      reachable.has(tile)
    ) ||
    hasOpenTerrainJob(
      dependencies,
      player,
      dependencies.memoryRegistry.memoryFor(player),
      civ1TerrainPolicy,
      reachable
    )
  );
};

// The value of a unit type's `YieldType` (`Attack`, `Defence`) before anything modifies it.
const baseYield = (
  dependencies: Dependencies,
  item: object,
  YieldType: typeof Yield
): number => {
  const unitYield = new YieldType();

  dependencies.ruleRegistry.process(
    BaseYield,
    item as unknown as typeof Unit,
    unitYield
  );

  return unitYield.value();
};

const isLandUnitType = (item: object): boolean =>
  Object.prototype.isPrototypeOf.call(Land, item);

// A unit type built to attack rather than defend, as `isAttacker` judges a unit.
const isAttackerType = (dependencies: Dependencies, item: object): boolean =>
  isLandUnitType(item) &&
  baseYield(dependencies, item, Attack) >
    baseYield(dependencies, item, Defence);

// A unit type that can explore: a land unit that can fight, not a worker.
const isExplorerType = (dependencies: Dependencies, item: object): boolean =>
  isLandUnitType(item) &&
  !Object.prototype.isPrototypeOf.call(Worker, item) &&
  baseYield(dependencies, item, Attack) > 0;

// How many of the player's units match `isUnit`, and how many more its cities are building that match `isType`, so
//  that cities choosing in the same turn don't all build the last one wanted.
const unitsAndOrders = (
  dependencies: Dependencies,
  player: Player,
  isUnit: (unit: Unit) => boolean,
  isType: (item: object) => boolean
): number =>
  dependencies.unitRegistry.getByPlayer(player).filter(isUnit).length +
  dependencies.cityRegistry
    .getByPlayer(player)
    .filter((city: City): boolean => {
      const building = dependencies.cityBuildRegistry
        .getByCity(city)
        .building();

      return building !== null && isType(building.item());
    }).length;

// The unit among `buildItems` to build for its `YieldType` (`Attack` for an attacker, `Defence` for a defender), its
//  cost weighed against its strength (civ-clone/web-renderer#212): of the units `city` can finish within the policy's
//  `buildTurns.unit`, the most `YieldType` per shield, then the most `YieldType`, then the cheapest. When it can finish
//  none of them that soon, the one it can finish soonest, then the cheapest, if `orSoonest`; otherwise none. Units with
//  no `YieldType` aren't considered. Obsolete units are never among `buildItems`: the ruleset doesn't offer them.
export const chooseUnit = (
  dependencies: Dependencies,
  city: City,
  buildItems: BuildItem[],
  YieldType: typeof Yield,
  policy: ProductionPolicy = defaultProductionPolicy,
  orSoonest: boolean = false,
  turnsToBuild: (buildItem: BuildItem) => number = buildTime(dependencies, city)
): typeof Unit | undefined => {
  const candidates = buildItems
      .map((buildItem: BuildItem) => ({
        UnitType: buildItem.item() as unknown as typeof Unit,
        cost: buildItem.cost().value(),
        strength: baseYield(dependencies, buildItem.item(), YieldType),
        turns: turnsToBuild(buildItem),
      }))
      .filter(({ strength }): boolean => strength > 0),
    soon = candidates.filter(({ turns }): boolean =>
      finishesWithin(turns, policy.buildTurns.unit)
    ),
    [best] =
      soon.length > 0 || !orSoonest
        ? soon.sort(
            (a, b): number =>
              b.strength / b.cost - a.strength / a.cost ||
              b.strength - a.strength ||
              a.cost - b.cost
          )
        : candidates.sort(
            (a, b): number =>
              (a.turns === b.turns ? 0 : a.turns - b.turns) ||
              a.cost - b.cost ||
              b.strength - a.strength
          );

  return best?.UnitType;
};

// Whether `city` should be the one to build the player's next Wonder: none of its cities is building one, and none
//  produces more.
const shouldBuildWonder = (
  dependencies: Dependencies,
  player: Player,
  city: City
): boolean => {
  const cities = dependencies.cityRegistry.getByPlayer(player);

  return (
    !cities.some((other: City): boolean => {
      const building = dependencies.cityBuildRegistry
        .getByCity(other)
        .building();

      return (
        building !== null &&
        Object.prototype.isPrototypeOf.call(Wonder, building.item())
      );
    }) &&
    cities.every(
      (other: City): boolean => netShields(other) <= netShields(city)
    )
  );
};

// One of `weighted`, each as likely as its weight, from a single `random` draw in [0, 1). With every weight 1 it's
//  `items[Math.floor(items.length * random)]`.
const weightedPick = <T>(
  weighted: [T, number][],
  random: number
): T | undefined => {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0),
    target = total * random;

  let reached = 0;

  for (const [item, weight] of weighted) {
    reached += weight;

    if (target < reached) {
      return item;
    }
  }

  return weighted[weighted.length - 1]?.[0];
};

// Improvements only worth building on purpose, never picked at random.
const onPurposeOnly: (typeof Barracks)[] = [Barracks, CityWalls];

// The order `buildItemInCity` falls back on, when a city can finish nothing soon: improvements worth having, then the
//  others, then units.
const fallbackRank = (buildItem: BuildItem): number =>
  Object.prototype.isPrototypeOf.call(Unit, buildItem.item())
    ? 2
    : onPurposeOnly.includes(buildItem.item() as typeof Barracks)
    ? 1
    : 0;

// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
export const buildItemInCity = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  policy: ProductionPolicy = defaultProductionPolicy,
  knowledge: Knowledge = civ1Knowledge
): void => {
  const cityBuild = dependencies.cityBuildRegistry.getByCity(city),
    available = cityBuild.available(),
    restrictions: IConstructor[] = [Palace, Settlers],
    availableFiltered = available.filter(
      (buildItem: BuildItem): boolean =>
        !restrictions.includes(buildItem.item()) &&
        !Object.prototype.isPrototypeOf.call(Wonder, buildItem.item()) &&
        // Ships are built on purpose, where there's sea to explore, not picked at random.
        !Object.prototype.isPrototypeOf.call(Naval, buildItem.item())
    ),
    availableWonders = available.filter((buildItem: BuildItem): boolean =>
      Object.prototype.isPrototypeOf.call(Wonder, buildItem.item())
    ),
    availableUnits = availableFiltered.filter((buildItem: BuildItem): boolean =>
      Object.prototype.isPrototypeOf.call(Unit, buildItem.item())
    ),
    shields = netShields(city),
    turnsToBuild = buildTime(dependencies, city, shields),
    isUnitItem = (buildItem: BuildItem): boolean =>
      Object.prototype.isPrototypeOf.call(Unit, buildItem.item()),
    // Whether the city would still have shields to spare once it had another unit to support (civ-clone/web-renderer#229).
    //  Under Monarchy every unit costs a shield, and a city whose units eat all it makes builds nothing else.
    //  Diplomats and Caravans cost no support, so they're always affordable.
    affordable = (buildItem: BuildItem): boolean =>
      !isUnitItem(buildItem) ||
      shields -
        knowledge.unitSupport(
          dependencies,
          city,
          buildItem.item() as unknown as typeof Unit
        ) >
        0,
    // The units the city can support another of, for anything but a defender it's missing.
    affordableUnits = availableUnits.filter(affordable),
    // The rest, that the city can finish within the policy's turns for a unit or an improvement, and can support if
    //  it's a unit. Barracks and City Walls are only worth building on purpose.
    finishable = availableFiltered.filter(
      (buildItem: BuildItem): boolean =>
        affordable(buildItem) &&
        !onPurposeOnly.includes(buildItem.item() as typeof Barracks) &&
        finishesWithin(
          turnsToBuild(buildItem),
          isUnitItem(buildItem)
            ? policy.buildTurns.unit
            : policy.buildTurns.improvement
        )
    ),
    randomSelection = weightedPick(
      finishable.map((buildItem: BuildItem): [BuildItem, number] => [
        buildItem,
        product(
          dependencies.ruleRegistry,
          BuildWeight,
          player,
          buildItem.item()
        ),
      ]),
      dependencies.randomNumberGenerator()
    )?.item(),
    // A defender for this city: the soonest it can, if it can't finish one within the policy's turns.
    getDefensiveUnit = (
      (UnitType?: typeof Unit): (() => typeof Unit | undefined) =>
      (): typeof Unit | undefined =>
        UnitType ||
        (UnitType = chooseUnit(
          dependencies,
          city,
          availableUnits,
          Defence,
          policy,
          true,
          turnsToBuild
        ))
    )(),
    // Only a unit that counts as an attacker, so that building one gets the player closer to what it wants.
    getOffensiveUnit = (): typeof Unit | undefined =>
      chooseUnit(
        dependencies,
        city,
        affordableUnits.filter((buildItem: BuildItem): boolean =>
          isAttackerType(dependencies, buildItem.item())
        ),
        Attack,
        policy,
        false,
        turnsToBuild
      );

  if (wantsUnit(dependencies, knowledge, city) && getDefensiveUnit()) {
    cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

    return;
  }

  const cityGrowth = dependencies.cityGrowthRegistry.getByCity(
      cityBuild.city()
    ),
    cities = dependencies.cityRegistry.getByPlayer(player).length;

  // Explorers count whether they're exploring or not: a unit out of the player's cities with nothing left that it can
  //  reach to explore is still one more than the player needs. And only land a unit from this city could reach counts:
  //  the coast of another continent, seen from a ship or across the water, kept the list from ever emptying.
  if (
    unitsAndOrders(
      dependencies,
      player,
      (unit: Unit): boolean => isExploring(dependencies, unit),
      (item: object): boolean => isExplorerType(dependencies, item)
    ) <
      Math.min(
        policy.maxExplorers,
        policy.explorers + policy.explorersPerCity * cities
      ) &&
    reachableLandToExplore(city, targets.landTilesToExplore) > 0
  ) {
    // The cheapest land unit that can fight, if the city can finish it within the policy's turns, whether or not the city
    //  has shields to spare to support it. With units that have nothing left to do standing down rather than wandering
    //  (civ-clone/web-renderer#230), explorers are what explores, and keeping them to cities with shields to spare cost
    //  players a tenth of what they had explored by turn 300 in the arena.
    const [explorer] = availableUnits
      .filter(
        (buildItem: BuildItem): boolean =>
          isExplorerType(dependencies, buildItem.item()) &&
          finishesWithin(turnsToBuild(buildItem), policy.buildTurns.unit)
      )
      .sort(
        (a: BuildItem, b: BuildItem): number =>
          a.cost().value() - b.cost().value()
      );

    if (explorer) {
      cityBuild.build(explorer.item());

      return;
    }
  }

  // Always Build Cities
  if (
    available.some(
      (buildItem: BuildItem) =>
        buildItem.item() === (Settlers as unknown as typeof Buildable)
    ) &&
    !dependencies.unitRegistry
      .getByCity(cityBuild.city())
      .some((unit: Unit): boolean =>
        isFoundingSettlers(dependencies, player, unit)
      ) &&
    unitsAndOrders(
      dependencies,
      player,
      (unit: Unit): boolean => isFoundingSettlers(dependencies, player, unit),
      (item: object): boolean =>
        item === (Settlers as unknown as typeof Buildable)
    ) <
      product(dependencies.ruleRegistry, Expansion, player) *
        (policy.settlers + Math.floor(policy.settlersPerCity * cities)) &&
    cityGrowth.size() > 1 &&
    // With no city site they could walk to and no terrain job, they'd join a city (civ-clone/web-renderer#243).
    settlersWouldHaveWork(dependencies, player, targets, city)
  ) {
    cityBuild.build(Settlers as unknown as typeof Buildable);

    return;
  }

  const offensiveUnit = getOffensiveUnit();

  if (
    offensiveUnit &&
    (targets.citiesToLiberate.length > 0 ||
      targets.enemyCitiesToAttack.length > 0 ||
      targets.enemyUnitsToAttack.length > 4) &&
    unitsAndOrders(dependencies, player, isAttacker, (item: object): boolean =>
      isAttackerType(dependencies, item)
    ) <
      policy.attackersPerCity * cities
  ) {
    cityBuild.build(offensiveUnit as unknown as typeof Buildable);

    return;
  }

  // A defender for another city, only one this city can finish within the policy's turns.
  const reinforcement =
    targets.undefendedCities.length > 0
      ? chooseUnit(
          dependencies,
          city,
          affordableUnits,
          Defence,
          policy,
          false,
          turnsToBuild
        )
      : undefined;

  if (reinforcement) {
    cityBuild.build(reinforcement as unknown as typeof Buildable);

    return;
  }

  // One Wonder at a time, in the city that can build it soonest, and only one that would do something for the player
  //  that the city makes enough shields to finish within the policy's turns.
  const usefulWonders = availableWonders.filter(
    (buildItem: BuildItem): boolean =>
      finishesWithin(turnsToBuild(buildItem), policy.buildTurns.wonder) &&
      isUsefulWonder(
        dependencies,
        player,
        buildItem.item() as unknown as typeof Wonder
      )
  );

  if (
    usefulWonders.length > 0 &&
    shields >= policy.wonderShields &&
    shouldBuildWonder(dependencies, player, city)
  ) {
    const wonders = usefulWonders.map((cityBuild) => cityBuild.item());

    cityBuild.build(
      wonders[Math.floor(dependencies.randomNumberGenerator() * wonders.length)]
    );

    return;
  }

  if (randomSelection) {
    cityBuild.build(randomSelection);

    return;
  }

  // Nothing it can finish soon, so the cheapest thing worth having once it can: an improvement, as a unit would cost
  //  shields to support that the city doesn't have. Barracks and City Walls are only worth building on purpose. A
  //  unit it couldn't support only if there's nothing else at all.
  const affordableItems = availableFiltered.filter(affordable),
    [cheapest] = [
      ...(affordableItems.length > 0 ? affordableItems : availableFiltered),
    ].sort(
      (a: BuildItem, b: BuildItem): number =>
        fallbackRank(a) - fallbackRank(b) || a.cost().value() - b.cost().value()
    );

  if (cheapest) {
    cityBuild.build(cheapest.item());
  }
};

export default buildItemInCity;
