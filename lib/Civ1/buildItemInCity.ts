// Civ1: what a city builds next: a defender while it has fewer than it wants or martial law could use another unit,
//  and otherwise what it needs most of one ranking (civ-clone/web-renderer#378): explorers while there's land to
//  explore that they could reach from the city, Settlers while they'd have a city site or a terrain job to go to,
//  attackers while there's a war to fight, a defender for a city of the player's that has none, each scored by how far
//  the player is short of what it wants, against the improvements and Wonders the ruleset's `BuildPriority` scores
//  (civ-clone/web-renderer#194), all but explorers weighed by the leader. A Wonder only in the player's most productive
//  city, one at a time; never a Palace or a ship. Apart from a missing defender and Settlers, each is only started if
//  the city can finish it within the policy's `buildTurns` for its kind, at its net shields; when nothing is left that
//  it can, the cheapest improvement worth having (civ-clone/web-renderer#212). Apart from a missing defender, explorers
//  and Settlers, no unit is started that would leave the city no shields to spare once it has to support it
//  (civ-clone/web-renderer#229).
import { canFerryFromLandmassOf } from '../Unit/overseas';
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
import reachableLandToExplore, { continentOf } from '../City/explorers';
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
import rankBuildItems, {
  RankedBuildItem,
} from '@civ-clone/core-city-build/lib/rankBuildItems';

// How many of each kind of unit a player wants, which decides when its cities stop building units and turn to
//  improvements and Wonders. `ChooseProduction` asks for one per player. The leader's personality scales the Settlers
//  wanted (`Expansion`) and weighs everything a city could build but explorers (`BuildWeight`) on top of it
//  (civ-clone/web-renderer#157, civ-clone/web-renderer#378).
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
  // What each kind of unit scores when the player has none of those it wants, against what a city's improvements score
  //  by the ruleset's `BuildPriority` (a Temple for one unhappy citizen is 4, an improvement it needs nothing of at
  //  most 0.1). It falls as the player gets closer to what it wants, and the leader's `BuildWeight` weighs it like
  //  anything else, so a leader who favours improvements builds fewer units (civ-clone/web-renderer#378), except for
  //  `explorer`: exploring is for every leader. Besides:
  //  - `army` is what an attacker scores when the player wants no more: just under an improvement a city needs nothing
  //    of, so that it's built when that improvement would cost the city more than it makes, or the leader favours units;
  //  - `fortification` is the most Barracks and City Walls score before the leader weighs them: Civ1's ruleset
  //    puts them before anything else in a city under threat, which is right for a city on Auto, that builds only
  //    improvements, but would keep a computer player's cities from the units that fight;
  //  - `wonder` is added to what the ruleset scores each Wonder the player's most productive city could build and would
  //    have use for (`isUsefulWonder`).
  needs: {
    army: number;
    attacker: number;
    explorer: number;
    fortification: number;
    reinforcement: number;
    settlers: number;
    wonder: number;
  };
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
  needs: {
    army: 0.09,
    attacker: 4,
    explorer: 6,
    fortification: 1.5,
    reinforcement: 3,
    settlers: 4,
    wonder: 3,
  },
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

// Whether Settlers built in `city` would have something to do: a city site on the board they could walk or sail to, or a
//  terrain job there no unit of the player's has claimed. With neither, they'd join a city (`lib/Unit/idleWorker`),
//  which gives back the citizen they cost but not the shields.
const settlersWouldHaveWork = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): boolean => {
  const reachable = continentOf(dependencies.turn.value(), city.tile());

  return (
    targets.goodSitesForCities.some((tile: Tile): boolean =>
      reachable.has(tile)
    ) ||
    // A site overseas, from a landmass the player can sail from (`lib/Unit/overseas`, civ-clone/web-renderer#374).
    (targets.goodSitesForCities.some(
      (tile: Tile): boolean => !reachable.has(tile)
    ) &&
      canFerryFromLandmassOf(dependencies, player, city.tile())) ||
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

// Improvements only worth building on purpose: the fallback leaves them until last.
const onPurposeOnly: (typeof Barracks)[] = [Barracks, CityWalls];

// The order `buildItemInCity` falls back on, when a city needs nothing it can finish soon: improvements worth having,
//  then units it can support, then Barracks and City Walls, which cost upkeep for nothing in peace, then units it can't.
const fallbackRank = (buildItem: BuildItem, affordable: boolean): number =>
  Object.prototype.isPrototypeOf.call(Unit, buildItem.item())
    ? affordable
      ? 1
      : 3
    : onPurposeOnly.includes(buildItem.item() as typeof Barracks)
    ? 2
    : 0;

// How much `player`'s leader favours building `buildItem` (`BuildWeight`), 1 for no preference.
export const leaderWeight =
  (dependencies: Dependencies, player: Player) =>
  (buildItem: BuildItem): number =>
    product(dependencies.ruleRegistry, BuildWeight, player, buildItem.item());

// What `city` needs most of `buildItems`, by the ruleset's `BuildPriority` (`rankBuildItems`, as a player's city on
//  Auto ranks them), weighed by the leader's preferences (civ-clone/web-renderer#194).
export const rankScored = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  buildItems: BuildItem[],
  yields: Yield[] = city.yields()
): RankedBuildItem[] =>
  rankBuildItems(
    dependencies.cityBuildRegistry.getByCity(city),
    dependencies.ruleRegistry,
    (): boolean => true,
    leaderWeight(dependencies, player),
    buildItems,
    yields
  );

export const rankImprovements = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  buildItems: BuildItem[],
  yields: Yield[] = city.yields()
): BuildItem[] =>
  rankScored(dependencies, player, city, buildItems, yields).map(
    ({ buildItem }) => buildItem
  );

// Not `localeCompare`, which depends on the host's locale, as in `rankBuildItems`.
const compareNames = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

// `ranked` together, an item that appears more than once scoring what its entries add up to, highest first, then the
//  cheaper, then by name, as `rankBuildItems` breaks ties. Anything scoring 0 or less is left out.
export const rankWithUnits = (ranked: RankedBuildItem[]): RankedBuildItem[] =>
  [
    ...ranked
      .reduce((scores: Map<BuildItem, number>, { buildItem, score }) => {
        const same =
          [...scores.keys()].find(
            (other: BuildItem): boolean => other.item() === buildItem.item()
          ) ?? buildItem;

        return scores.set(same, (scores.get(same) ?? 0) + score);
      }, new Map<BuildItem, number>())
      .entries(),
  ]
    .map(([buildItem, score]): RankedBuildItem => ({ buildItem, score }))
    .filter(({ score }): boolean => score > 0)
    .sort(
      (a: RankedBuildItem, b: RankedBuildItem): number =>
        b.score - a.score ||
        a.buildItem.cost().value() - b.buildItem.cost().value() ||
        compareNames(a.buildItem.item().name, b.buildItem.item().name)
    );

// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn.
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
        // Ships are built on purpose, where there's sea to explore, not ranked here.
        !Object.prototype.isPrototypeOf.call(Naval, buildItem.item())
    ),
    availableWonders = available.filter((buildItem: BuildItem): boolean =>
      Object.prototype.isPrototypeOf.call(Wonder, buildItem.item())
    ),
    availableUnits = availableFiltered.filter((buildItem: BuildItem): boolean =>
      Object.prototype.isPrototypeOf.call(Unit, buildItem.item())
    ),
    yields = city.yields(),
    shields = netShields(city, yields),
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
    cities = dependencies.cityRegistry.getByPlayer(player).length,
    weight = leaderWeight(dependencies, player),
    itemFor = (item: unknown): BuildItem | undefined =>
      available.find(
        (buildItem: BuildItem): boolean => buildItem.item() === item
      ),
    // The units the player is short of, each scored by how short it is: `policy.needs` for one it wants and has none
    //  of, less for each it has or has on order, and weighed by the leader unless `weighed` is false
    //  (civ-clone/web-renderer#378).
    unitNeeds: RankedBuildItem[] = [],
    addNeed = (
      buildItem: BuildItem | undefined,
      need: number,
      have: number,
      wanted: number,
      weighed: boolean = true
    ): void => {
      if (buildItem === undefined || wanted <= 0 || have >= wanted) {
        return;
      }

      unitNeeds.push({
        buildItem,
        score:
          ((need * (wanted - have)) / wanted) *
          (weighed ? weight(buildItem) : 1),
      });
    };

  // Explorers count whether they're exploring or not: a unit out of the player's cities with nothing left that it can
  //  reach to explore is still one more than the player needs. And only land a unit from this city could reach counts:
  //  the coast of another continent, seen from a ship or across the water, kept the list from ever emptying. With
  //  nothing to explore the continent isn't needed, so it isn't looked up.
  if (
    targets.landTilesToExplore.length > 0 &&
    reachableLandToExplore(
      city,
      targets.landTilesToExplore,
      continentOf(dependencies.turn.value(), city.tile())
    ) > 0
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

    addNeed(
      explorer,
      policy.needs.explorer,
      unitsAndOrders(
        dependencies,
        player,
        (unit: Unit): boolean => isExploring(dependencies, unit),
        (item: object): boolean => isExplorerType(dependencies, item)
      ),
      Math.min(
        policy.maxExplorers,
        policy.explorers + policy.explorersPerCity * cities
      ),
      // Exploring is for every leader, not only those who favour fighting units: weighing explorers by the leader cost
      //  a seventh of the land explored by turn 150 in the arena.
      false
    );
  }

  // Always Build Cities
  if (
    !dependencies.unitRegistry
      .getByCity(cityBuild.city())
      .some((unit: Unit): boolean =>
        isFoundingSettlers(dependencies, player, unit)
      ) &&
    cityGrowth.size() > 1 &&
    // With no city site they could walk to and no terrain job, they'd join a city (civ-clone/web-renderer#243).
    settlersWouldHaveWork(dependencies, player, targets, city)
  ) {
    addNeed(
      itemFor(Settlers),
      policy.needs.settlers,
      unitsAndOrders(
        dependencies,
        player,
        (unit: Unit): boolean => isFoundingSettlers(dependencies, player, unit),
        (item: object): boolean =>
          item === (Settlers as unknown as typeof Buildable)
      ),
      product(dependencies.ruleRegistry, Expansion, player) *
        (policy.settlers + Math.floor(policy.settlersPerCity * cities))
    );
  }

  if (
    targets.citiesToLiberate.length > 0 ||
    targets.enemyCitiesToAttack.length > 0 ||
    targets.enemyUnitsToAttack.length > 4
  ) {
    addNeed(
      itemFor(getOffensiveUnit()),
      policy.needs.attacker,
      unitsAndOrders(
        dependencies,
        player,
        isAttacker,
        (item: object): boolean => isAttackerType(dependencies, item)
      ),
      policy.attackersPerCity * cities
    );
  }

  // An army, however peaceful the world.
  addNeed(itemFor(getOffensiveUnit()), policy.needs.army, 0, 1);

  // A defender for another city, only one this city can finish within the policy's turns.
  if (targets.undefendedCities.length > 0) {
    addNeed(
      itemFor(
        chooseUnit(
          dependencies,
          city,
          affordableUnits,
          Defence,
          policy,
          false,
          turnsToBuild
        )
      ),
      policy.needs.reinforcement,
      0,
      1
    );
  }

  // One Wonder at a time, in the city that makes the most shields, and only one that would do something for the player
  //  that the city makes enough shields to finish within the policy's turns.
  const wonders =
    shields >= policy.wonderShields &&
    shouldBuildWonder(dependencies, player, city)
      ? availableWonders.filter(
          (buildItem: BuildItem): boolean =>
            finishesWithin(turnsToBuild(buildItem), policy.buildTurns.wonder) &&
            isUsefulWonder(
              dependencies,
              player,
              buildItem.item() as unknown as typeof Wonder
            )
        )
      : [];

  // What the city needs most, the units above against the improvements and Wonders it needs by the ruleset's
  //  `BuildPriority`, as a player's city on Auto ranks them (civ-clone/web-renderer#194), all weighed by the leader
  //  (civ-clone/web-renderer#378). Barracks and City Walls are among the improvements it could need, but are only
  //  needed at war.
  const [needed] = rankWithUnits([
    ...unitNeeds,
    ...rankScored(
      dependencies,
      player,
      city,
      [
        ...availableFiltered.filter(
          (buildItem: BuildItem): boolean =>
            !isUnitItem(buildItem) &&
            finishesWithin(
              turnsToBuild(buildItem),
              policy.buildTurns.improvement
            )
        ),
      ],
      yields
    ).map(
      ({ buildItem, score }: RankedBuildItem): RankedBuildItem => ({
        buildItem,
        score: onPurposeOnly.includes(buildItem.item() as typeof Barracks)
          ? Math.min(score, policy.needs.fortification * weight(buildItem))
          : score,
      })
    ),
    ...rankScored(dependencies, player, city, wonders, yields),
    ...wonders.map(
      (buildItem: BuildItem): RankedBuildItem => ({
        buildItem,
        score: policy.needs.wonder * weight(buildItem),
      })
    ),
  ]);

  if (needed) {
    cityBuild.build(needed.buildItem.item());

    return;
  }

  // Nothing it needs that it can finish soon, so the cheapest thing worth having once it can (`fallbackRank`).
  const [cheapest] = [...availableFiltered].sort(
    (a: BuildItem, b: BuildItem): number =>
      fallbackRank(a, affordable(a)) - fallbackRank(b, affordable(b)) ||
      a.cost().value() - b.cost().value()
  );

  if (cheapest) {
    cityBuild.build(cheapest.item());
  }
};

export default buildItemInCity;
