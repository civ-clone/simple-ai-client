import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
export declare const wantedAdvances: (
  dependencies: Dependencies,
  player: Player
) => (typeof Advance)[] | null;
export declare const scienceStopped: (
  dependencies: Dependencies,
  player: Player
) => boolean;
export default wantedAdvances;
