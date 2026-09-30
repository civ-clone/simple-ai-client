// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { Fortifiable } from '@civ-clone/library-unit/Types';
import Unit from '@civ-clone/core-unit/Unit';

// One defender, and one more for each five sizes over five.
export const defendersWanted = (
  dependencies: Dependencies,
  city: City
): number =>
  Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5);

// The units on the city's tile that could defend it, fortified or not.
export const defendersIn = (dependencies: Dependencies, city: City): Unit[] =>
  dependencies.unitRegistry
    .getByTile(city.tile())
    .filter(
      (unit: Unit): boolean =>
        unit instanceof Fortifiable && unit.defence().value() > 0
    );
