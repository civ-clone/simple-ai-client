import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
export interface GovernmentPolicy {
  revolutionTurns: number;
}
export declare const defaultGovernmentPolicy: GovernmentPolicy;
export declare const republicScore: (
  dependencies: Dependencies,
  player: Player
) => number;
export declare const preferredGovernment: (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
) => typeof Government;
export declare const startRevolution: (
  dependencies: Dependencies,
  player: Player,
  policy?: GovernmentPolicy
) => void;
export declare const pickGovernment: (
  dependencies: Dependencies,
  playerGovernment: PlayerGovernment
) => void;
