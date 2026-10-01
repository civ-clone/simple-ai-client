import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Unit from '@civ-clone/core-unit/Unit';
export interface MartialLawPolicy {
  limit(dependencies: Dependencies, city: City): number;
}
export declare const martialLawUnitsWanted: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
) => number;
export declare const defendersWanted: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
) => number;
export declare const isDefender: (unit: Unit) => boolean;
export declare const defendersIn: (
  dependencies: Dependencies,
  city: City
) => Unit[];
