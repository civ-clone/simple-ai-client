import Memory from '../Memory';
import { ActionLookup } from '../actionLookup';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export type TerrainImprovement = 'irrigation' | 'mine' | 'road';
export interface TerrainJobValue {
  improvement: TerrainImprovement;
  value: number;
  turns: number;
}
export interface TerrainPolicy {
  jobs(
    dependencies: Dependencies,
    player: Player,
    tile: Tile
  ): TerrainJobValue[];
  workersWanted(dependencies: Dependencies, player: Player): number;
}
export interface TerrainJob {
  improvement: TerrainImprovement;
  tile: Tile;
}
export declare const PATH_TRIES = 3;
export declare const UNPATHABLE_TURNS = 10;
export declare const unpathableTiles: (
  memory: Memory,
  unit: Unit,
  turn: number
) => Map<Tile, number>;
export declare const terrainJobs: (memory: Memory) => Map<Unit, TerrainJob>;
export declare const chooseTerrainJob: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  policy: TerrainPolicy,
  unit: Unit,
  excluded?: Set<Tile>
) => TerrainJob | null;
export declare const dropTerrainJob: (memory: Memory, unit: Unit) => void;
export declare const terrainWork: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: TerrainPolicy,
  unit: Unit,
  actions: ActionLookup
) => Promise<boolean>;
export default terrainWork;
