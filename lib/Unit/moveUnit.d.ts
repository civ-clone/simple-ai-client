import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const actionsToTake: (actions: Action[]) => Action[];
export declare const actionToTake: (
  dependencies: Dependencies,
  player: Player,
  actions: Action[]
) => Action | null;
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
  onIdle?: () => boolean;
}
export declare const moveUnit: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  { stopAtPathEnd, wander, onIdle }?: MoveOptions
) => Promise<void>;
export declare const travelToPathEnd: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
) => Promise<void>;
export default moveUnit;
