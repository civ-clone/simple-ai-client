import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
export declare const militaryPower: (
  dependencies: Dependencies,
  player: Player,
  of: Player
) => number;
export declare const shouldAttack: (
  dependencies: Dependencies,
  player: Player,
  enemy: Player
) => boolean;
export default shouldAttack;
