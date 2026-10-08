import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
export interface MartialLawPolicy {
  limit(dependencies: Dependencies, city: City): number;
  wouldUse(dependencies: Dependencies, UnitType: object): boolean;
}
export declare const martialLawUnitsWanted: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City,
  yields?: Yield[]
) => number;
export declare const defendersWanted: (
  dependencies: Dependencies,
  city: City
) => number;
export declare const martialLawUnitsIn: (
  city: City,
  yields?: Yield[]
) => Unit[];
export declare const wantsDefender: (
  dependencies: Dependencies,
  city: City
) => boolean;
export declare const wantsMartialLawUnit: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City,
  yields?: Yield[]
) => boolean;
export declare const wantsUnit: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
) => boolean;
export declare const keepsOrder: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City,
  unit: Unit
) => boolean;
export declare const isDefender: (unit: Unit) => boolean;
export declare const isDefenderType: (
  dependencies: Dependencies,
  UnitType: object
) => boolean;
export declare const defendersIn: (
  dependencies: Dependencies,
  city: City
) => Unit[];
