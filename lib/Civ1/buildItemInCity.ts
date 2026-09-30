// Civ1: what a city builds next: a defender while it has fewer than it wants, explorers while there's land to explore
//  and the player has fewer out than it wants, Settlers, attackers while there's a war to fight and the player has
//  fewer than it wants, a defender for a city of the player's that has none, a Wonder in the player's most productive
//  city, and otherwise a random pick of the rest, never a Palace or a ship.
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { defendersIn, defendersWanted } from '../City/defence';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import { Land, Naval, Worker } from '@civ-clone/library-unit/Types';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import { Production } from '@civ-clone/civ1-world/Yields';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import { TargetBoard } from '../Memory';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// How many of each kind of unit a player wants, which decides when its cities stop building units and turn to
//  improvements and Wonders. `ChooseProduction` asks for one per player, which is where civ-clone/web-renderer#157's
//  leader traits (Ideology, Mood) come in.
export interface ProductionPolicy {
  // Attackers wanted for each of the player's cities while there's something to attack.
  attackersPerCity: number;
  // Units wanted out exploring while there's land to explore: `explorers`, and `explorersPerCity` more per city.
  explorers: number;
  explorersPerCity: number;
}

export const defaultProductionPolicy: ProductionPolicy = {
  attackersPerCity: 1,
  explorers: 3,
  explorersPerCity: 2,
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

const production = (city: City): number =>
  reduceYield(city.yields(), Production);

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
      (other: City): boolean => production(other) <= production(city)
    )
  );
};

// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
export const buildItemInCity = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  policy: ProductionPolicy = defaultProductionPolicy
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
    randomSelection =
      availableFiltered[
        Math.floor(
          availableFiltered.length * dependencies.randomNumberGenerator()
        )
      ].item(),
    baseYield = (buildItem: BuildItem, YieldType: typeof Yield): Yield => {
      const unitYield = new YieldType();

      dependencies.ruleRegistry.process(
        BaseYield,
        buildItem.item() as unknown as typeof Unit,
        unitYield
      );

      return unitYield;
    },
    getUnitByYield = (YieldType: typeof Yield) => {
      const [[UnitType]] = availableUnits
        .map((buildItem: BuildItem): [typeof Unit, Yield] => [
          buildItem.item() as unknown as typeof Unit,
          baseYield(buildItem, YieldType),
        ])
        .sort(
          (
            [, unitYieldA]: [typeof Unit, Yield],
            [, unitYieldB]: [typeof Unit, Yield]
          ): number => unitYieldB.value() - unitYieldA.value()
        );

      return UnitType;
    },
    getDefensiveUnit = (
      (UnitType?: typeof Unit): (() => typeof Unit) =>
      (): typeof Unit =>
        UnitType || (UnitType = getUnitByYield(Defence))
    )(),
    getOffensiveUnit = (
      (UnitType?: typeof Unit): (() => typeof Unit) =>
      (): typeof Unit =>
        UnitType || (UnitType = getUnitByYield(Attack))
    )();

  if (
    defendersIn(dependencies, city).length <
      defendersWanted(dependencies, city) &&
    getDefensiveUnit()
  ) {
    cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

    return;
  }

  const cityGrowth = dependencies.cityGrowthRegistry.getByCity(
      cityBuild.city()
    ),
    cities = dependencies.cityRegistry.getByPlayer(player).length;

  if (
    targets.landTilesToExplore.length > 0 &&
    dependencies.unitRegistry
      .getByPlayer(player)
      .filter((unit: Unit): boolean => isExploring(dependencies, unit)).length <
      policy.explorers + policy.explorersPerCity * cities
  ) {
    // The cheapest land unit that can fight.
    const [explorer] = availableUnits
      .filter(
        (buildItem: BuildItem): boolean =>
          Object.prototype.isPrototypeOf.call(Land, buildItem.item()) &&
          baseYield(buildItem, Attack).value() > 0
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
      .some((unit: Unit): boolean => unit instanceof Settlers) &&
    // TODO: use expansionist leader trait
    dependencies.unitRegistry
      .getByPlayer(player)
      .filter((unit: Unit): boolean => unit instanceof Settlers).length < 3 &&
    cityGrowth.size() > 1
  ) {
    cityBuild.build(Settlers as unknown as typeof Buildable);

    return;
  }

  if (
    (targets.citiesToLiberate.length > 0 ||
      targets.enemyCitiesToAttack.length > 0 ||
      targets.enemyUnitsToAttack.length > 4) &&
    dependencies.unitRegistry.getByPlayer(player).filter(isAttacker).length <
      policy.attackersPerCity * cities
  ) {
    cityBuild.build(getOffensiveUnit() as unknown as typeof Buildable);

    return;
  }

  if (targets.undefendedCities.length) {
    cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

    return;
  }

  // One Wonder at a time, in the city that can build it soonest. (This used to need a single Production yield over 4,
  //  but a city's yields come one per tile and unit, so no city ever had one.)
  if (
    availableWonders.length > 0 &&
    shouldBuildWonder(dependencies, player, city)
  ) {
    const wonders = availableWonders.map((cityBuild) => cityBuild.item());

    cityBuild.build(
      wonders[Math.floor(dependencies.randomNumberGenerator() * wonders.length)]
    );

    return;
  }

  if (randomSelection) {
    cityBuild.build(randomSelection);
  }
};

export default buildItemInCity;
