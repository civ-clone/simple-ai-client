import Dependencies from './Dependencies';
import Player from '@civ-clone/core-player/Player';
import Trait from '@civ-clone/core-civilization/Trait';
export declare const leaderTraits: (
  dependencies: Dependencies,
  player: Player
) => Trait[];
export declare const mood: (
  dependencies: Dependencies,
  player: Player
) => number;
export declare const policy: (
  dependencies: Dependencies,
  player: Player
) => number;
export declare const ideology: (
  dependencies: Dependencies,
  player: Player
) => number;
