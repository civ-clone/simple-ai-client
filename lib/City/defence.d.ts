import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Unit from '@civ-clone/core-unit/Unit';
export declare const defendersWanted: (
  dependencies: Dependencies,
  city: City
) => number;
export declare const defendersIn: (
  dependencies: Dependencies,
  city: City
) => Unit[];
