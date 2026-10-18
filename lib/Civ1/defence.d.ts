import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
export declare const THREAT_RADIUS = 3;
export declare const THREAT_CAP = 3;
export declare const threatened: (
  dependencies: Dependencies,
  city: City
) => boolean;
export declare const attackersNear: (
  dependencies: Dependencies,
  city: City
) => number;
export declare const isCapital: (
  dependencies: Dependencies,
  city: City
) => boolean;
export declare const defendersWanted: (
  dependencies: Dependencies,
  city: City
) => number;
export declare const defendersKept: (
  dependencies: Dependencies,
  city: City
) => number;
