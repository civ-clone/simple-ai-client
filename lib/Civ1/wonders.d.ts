import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Wonder from '@civ-clone/core-wonder/Wonder';
export declare const isUsefulWonder: (
  dependencies: Dependencies,
  player: Player,
  WonderType: typeof Wonder
) => boolean;
export default isUsefulWonder;
