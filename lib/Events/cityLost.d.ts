import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
export declare const cityLost: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  by: Player | null,
  destroyed: boolean
) => void;
export default cityLost;
