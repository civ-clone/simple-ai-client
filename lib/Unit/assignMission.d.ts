import { Mission } from '@civ-clone/base-strategy-ai/lib/Unit/mission';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import {
  exploreLand,
  exploreSea,
} from '@civ-clone/base-strategy-explore/lib/Unit/explore';
import Unit from '@civ-clone/core-unit/Unit';
export declare const defendUndefendedCity: Mission;
export declare const liberateCity: Mission;
export declare const attackEnemyUnits: Mission;
export declare const attackEnemyCity: Mission;
export type { Mission };
export { exploreLand, exploreSea };
export declare const missions: Mission[];
export declare const assignMission: (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => void;
export default assignMission;
