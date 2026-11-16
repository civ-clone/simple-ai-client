import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
export declare const hasChangeRules: (dependencies: Dependencies) => boolean;
export declare const progressAfterChange: (
  dependencies: Dependencies,
  cityBuild: CityBuild,
  to: IBuildable
) => number;
export declare const changeLosesShields: (
  dependencies: Dependencies,
  cityBuild: CityBuild,
  to: IBuildable
) => boolean;
export default progressAfterChange;
