// Civ1: what a city builds next: defenders first, then Settlers, attackers when there's a war to fight, and otherwise
//  a random pick of what's available, never a Palace.
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import { Production } from '@civ-clone/civ1-world/Yields';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import { TargetBoard } from '../Memory';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';

// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
export const buildItemInCity = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): void => {
  const tile = city.tile(),
    cityBuild = dependencies.cityBuildRegistry.getByCity(city),
    tileUnits = dependencies.unitRegistry.getByTile(tile),
    available = cityBuild.available(),
    restrictions: IConstructor[] = [Palace, Settlers],
    availableFiltered = available.filter(
      (buildItem: BuildItem): boolean =>
        !restrictions.includes(buildItem.item()) &&
        // TODO: Add auto-wonders or have more logic around this
        !Object.prototype.isPrototypeOf.call(Wonder, buildItem.item())
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
    getUnitByYield = (YieldType: typeof Yield) => {
      const [[UnitType]] = availableUnits
        .map((buildItem: BuildItem): [typeof Unit, Yield] => {
          const UnitType = buildItem.item() as unknown as typeof Unit,
            unitYield = new YieldType();

          dependencies.ruleRegistry.process(BaseYield, UnitType, unitYield);

          return [UnitType as typeof Unit, unitYield];
        })
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
    dependencies.unitRegistry.getByTile(tile).length < 2 &&
    getDefensiveUnit()
  ) {
    cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

    return;
  }

  const cityGrowth = dependencies.cityGrowthRegistry.getByCity(
    cityBuild.city()
  );

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
    targets.citiesToLiberate.length > 0 ||
    targets.enemyCitiesToAttack.length > 0 ||
    targets.enemyUnitsToAttack.length > 4
  ) {
    cityBuild.build(getOffensiveUnit() as unknown as typeof Buildable);

    return;
  }

  if (
    // TODO: the inner `filter` returns an array, which is always truthy, so this counts every unit on the tile. Kept:
    //  #153 changes no play.
    tileUnits.filter((unit) =>
      dependencies.unitImprovementRegistry
        .getByUnit(unit)
        .filter((improvement) => improvement instanceof Fortified)
    ).length < 2 ||
    targets.undefendedCities.length
  ) {
    cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

    return;
  }

  // If we have resources to burn, build a wonder
  if (
    cityBuild
      .city()
      .yields()
      .filter((cityYield) => cityYield instanceof Production)
      .some((cityYield) => cityYield.value() > 4)
  ) {
    const wonders = availableWonders.map((cityBuild) => cityBuild.item());

    cityBuild.build(
      wonders[Math.floor(dependencies.randomNumberGenerator() * wonders.length)]
    );
  }

  // TODO: replaces the Wonder chosen above, so this never builds one. Kept: #153 changes no play.
  if (randomSelection) {
    cityBuild.build(randomSelection);
  }
};

export default buildItemInCity;
