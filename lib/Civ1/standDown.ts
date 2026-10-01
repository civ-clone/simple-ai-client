// Civ1: when a unit with nothing to do is worth disbanding: when its home city pays shields to support it and has none
//  to spare, so that keeping it costs the city everything it could build. Under Anarchy and Despotism a city supports
//  as many units as its size for nothing (`civ1-city`'s `Cost` rules), so those are never disbanded; under the other
//  governments every unit costs its city a shield.
import City from '@civ-clone/core-city/City';
import {
  Production,
  UnitSupportProduction,
} from '@civ-clone/library-city/Yields';
import { StandDownPolicy } from '../Unit/standDown';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// Net shields, after unit support, at or below which an idle unit the city pays for is disbanded.
export const DISBAND_AT_NET_SHIELDS = 0;

export const civ1StandDownPolicy: StandDownPolicy = {
  disband: (dependencies, unit) => {
    const city = unit.city() as City | null;

    if (!city) {
      return false;
    }

    const yields = city.yields();

    return (
      yields.some(
        (cityYield: Yield): boolean =>
          cityYield instanceof UnitSupportProduction &&
          cityYield.unit() === unit
      ) && reduceYield(yields, Production) <= DISBAND_AT_NET_SHIELDS
    );
  },
};

export default civ1StandDownPolicy;
