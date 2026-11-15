import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const RETREAT_BELOW: number;
export declare const FACILITY_PREFERENCE = 3;
export declare const RETREAT_RANGE = 8;
export declare const healingFacilityFor: (
  unit: Unit
) => typeof CityImprovement | null;
export declare const restsHere: (
  dependencies: Dependencies,
  unit: Unit
) => boolean;
export declare const needsHealing: (unit: Unit) => boolean;
export declare const healsThisTurn: (
  dependencies: Dependencies,
  unit: Unit
) => boolean;
export declare const healingCities: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => City[];
export declare const retreatToHeal: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
) => Promise<boolean>;
export default retreatToHeal;
