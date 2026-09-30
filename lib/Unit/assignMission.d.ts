import Dependencies from '../Dependencies';
import Memory from '../Memory';
import Unit from '@civ-clone/core-unit/Unit';
export type Mission = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => boolean;
export declare const defendUndefendedCity: Mission;
export declare const liberateCity: Mission;
export declare const attackEnemyUnits: Mission;
export declare const attackEnemyCity: Mission;
export declare const exploreLand: Mission;
export declare const exploreSea: Mission;
export declare const missions: Mission[];
export declare const assignMission: (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => void;
export default assignMission;
