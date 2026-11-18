import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory, { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export type AirKind = 'fighter' | 'striker' | 'missile' | 'nuclear';
export declare const airKindOf: (
  UnitType: object,
  ruleRegistry: RuleRegistry
) => AirKind | null;
export declare const isParatrooperType: (
  UnitType: object,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const PARADROP_RANGE = 10;
export declare const AIR_THREAT_DISTANCE = 8;
export declare const LAND_THREAT_DISTANCE = 3;
export declare const STRIKERS_PER_CITY: number;
export declare const MAX_STRIKERS = 4;
export declare const MISSILES_PER_CITY: number;
export declare const MAX_MISSILES = 2;
export declare const NUCLEAR_WANTED = 2;
export declare const PARATROOPERS_PER_CITY: number;
export declare const MAX_PARATROOPERS = 2;
export declare const AIR_NEEDS: {
  [kind in AirKind | 'paratrooper']: number;
};
export declare const isAggressive: (
  dependencies: Dependencies,
  player: Player
) => boolean;
export declare const strikeSquares: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile,
  home?: Tile[]
) => Tile[];
export declare const canStrike: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile,
  home?: Tile[]
) => boolean;
export declare const fighterTarget: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home?: Tile[]
) => Tile | null;
export declare const raidTarget: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home?: Tile[]
) => Tile | null;
export declare const SDI_RANGE = 3;
export declare const isNuclearTargetCity: (
  dependencies: Dependencies,
  player: Player,
  city: City,
  ownPower?: number,
  powerOf?: (other: Player) => number,
  hasNuclear?: (other: Player) => boolean
) => boolean;
export declare const nuclearTarget: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => Tile | null;
export declare const paradropTargets: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => Tile[];
export declare const paradropTarget: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => Tile | null;
export interface AirTask {
  task: 'strike' | 'home' | 'stay' | 'paradrop';
  target: Tile | null;
}
export declare const planAirTask: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit
) => AirTask | null;
export declare const planHome: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  home?: Tile[]
) => AirTask;
export declare const airWanted: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  kind: AirKind | 'paratrooper',
  reach: number
) => [number, number] | null;
export default planAirTask;
