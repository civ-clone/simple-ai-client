import { Terms } from '@civ-clone/base-government-terms/lib/terms';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
export declare const governmentOf: (
  dependencies: Dependencies,
  player: Player
) => typeof Government | null;
export declare const playerGovernmentTerm: <K extends keyof Terms>(
  dependencies: Dependencies,
  player: Player,
  key: K
) => Terms[K] | undefined;
export declare const cityGovernmentTerm: <K extends keyof Terms>(
  dependencies: Dependencies,
  city: City,
  key: K
) => Terms[K] | undefined;
