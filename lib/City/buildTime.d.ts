import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
export declare const netShields: (city: City) => number;
export declare const buildTime: (
  dependencies: Dependencies,
  city: City
) => (buildItem: BuildItem) => number;
export default buildTime;
