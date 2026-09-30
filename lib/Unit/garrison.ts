// Generic: a unit in one of the player's cities fortifies there if the city needs more defenders, or if it can relieve
//  a weaker one.
import Dependencies from '../Dependencies';
import { Fortified } from '@civ-clone/library-unit/UnitImprovements';
import { Fortify } from '@civ-clone/library-unit/Actions';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';

// Returns whether the unit fortified. `tileUnits` is what was on `tile` when the unit's turn began.
export const garrison = (
  dependencies: Dependencies,
  unit: Unit,
  tile: Tile,
  tileUnits: Unit[],
  fortify: Fortify | undefined
): boolean => {
  // TODO: check for defence values and activate weaker for disband/upgrade/scouting
  const [cityUnitWithLowerDefence] = tileUnits.filter(
      (tileUnit: Unit): boolean =>
        dependencies.unitImprovementRegistry
          .getByUnit(tileUnit)
          .some(
            (improvement: UnitImprovement): boolean =>
              improvement instanceof Fortified
          ) && unit.defence().value() > tileUnit.defence().value()
    ),
    city = dependencies.cityRegistry.getByTile(tile);

  if (
    fortify &&
    city &&
    (cityUnitWithLowerDefence ||
      tileUnits.length <=
        Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5))
  ) {
    unit.action(fortify);

    if (cityUnitWithLowerDefence) {
      cityUnitWithLowerDefence.activate();
    }

    return true;
  }

  return false;
};

export default garrison;
