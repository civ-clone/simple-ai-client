import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const hasStepWorthTaking: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
) => boolean;
export interface MoveOptions {
  wander?: boolean;
  stopAtPathEnd?: boolean;
}
export declare const moveUnit: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  { stopAtPathEnd, wander }?: MoveOptions
) => Promise<void>;
export default moveUnit;
