import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Yield from '@civ-clone/core-yield/Yield';
export declare const netShields: (city: City, yields?: Yield[]) => number;
export declare const buildTime: (
  dependencies: Dependencies,
  city: City,
  shields?: number
) => (buildItem: BuildItem) => number;
export declare const finishesWithin: (turns: number, limit: number) => boolean;
export default buildTime;
