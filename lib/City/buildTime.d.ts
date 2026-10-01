import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
export declare const netShields: (city: City) => number;
export declare const buildTime: (
  dependencies: Dependencies,
  city: City,
  shields?: number
) => (buildItem: BuildItem) => number;
export declare const finishesWithin: (turns: number, limit: number) => boolean;
export default buildTime;
