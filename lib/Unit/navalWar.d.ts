import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory, { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const NAVAL_REACH_TURNS = 3;
export declare const ESCORT_REACH_TURNS = 2;
export declare const NAVAL_THREAT_DISTANCE = 12;
export declare const WARSHIPS_PER_THREATENED_CITY = 0.5;
export declare const WARSHIP_NEED = 2;
export declare const isWarshipType: (
  UnitType: object,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const isWarship: (
  unit: Unit,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const isSubmergedType: (
  UnitType: object,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const dropNavalPath: (memory: Memory, unit: Unit) => void;
export interface NavalTask {
  task: 'hunt' | 'escort' | 'bombard';
  strike: Tile | null;
  escorting?: Unit;
}
export declare const huntTargets: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => Tile[];
export declare const bombardTargets: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => Tile[];
export declare const transportsToEscort: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => Unit[];
export declare const strikeBeside: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => Tile | null;
export declare const planNavalTask: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => NavalTask | null;
export declare const navalThreatsNear: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
) => {
  ships: Tile[];
  cities: Tile[];
};
export declare const warshipsWanted: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
) => {
  wanted: number;
  have: number;
  submarines: boolean;
} | null;
export default planNavalTask;
