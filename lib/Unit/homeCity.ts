// Generic: a unit taking up station in one of the player's cities, as its garrison or waiting there for orders, makes
//  that city its home, so that a city's defenders are its own units and are supported by it, under any government. A
//  unit passing through, or on its way somewhere, keeps its home.
//
// Not when the city couldn't support it: if a unit more would leave the city no shields to spare (by the ruleset's
//  `Knowledge#unitSupport`), the unit stays homed where it is. Martial law is unaffected either way: it counts the units
//  in a city, wherever they're from.
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import { SetHomeCity } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
import { netShields } from '../City/buildTime';

// `setHomeCity` is the unit's action from the start of its turn: only used while the unit is still where it was then.
//  Returns whether the city is now the unit's home.
export const takeUpStation = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  unit: Unit,
  city: City,
  setHomeCity: SetHomeCity | undefined
): boolean => {
  if (unit.city() === city) {
    return true;
  }

  if (
    !setHomeCity ||
    setHomeCity.from() !== unit.tile() ||
    city.tile() !== unit.tile() ||
    city.player() !== unit.player() ||
    netShields(city) - knowledge.unitSupport(dependencies, city) <= 0
  ) {
    return false;
  }

  unit.action(setHomeCity);

  return unit.city() === city;
};

export default takeUpStation;
