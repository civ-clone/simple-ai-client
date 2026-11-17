import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
export declare const CITIZEN = 2;
export declare const SHIELD = 1;
export declare const FOOD = 1;
type CityFacts = {
  squares: {
    food: number;
    shields: number;
    trade: number;
  }[];
  trade: number;
  supported: number;
  aggressive: number;
  inCity: number;
  unhappy: number;
  distance: number;
  size: number;
};
/**
 * What `GovernmentType` would be worth to `player`, by its terms, or `null` where the rule set gives none. Only a
 *  comparison between governments means anything.
 */
export declare const governmentScore: (
  dependencies: Dependencies,
  player: Player,
  GovernmentType: typeof Government,
  facts?: CityFacts[]
) => number | null;
/** What each of `player`'s cities has, for `governmentScore`. */
export declare const cityFactsOf: (
  dependencies: Dependencies,
  player: Player
) => CityFacts[];
/**
 * Whether the rule set numbers every one of `available` (so the scores can be compared), and so the player chooses by
 *  them. Civ1's numbers none.
 */
export declare const scoresGovernments: (
  dependencies: Dependencies,
  available: (typeof Government)[]
) => boolean;
export declare const REVOLUTION_PAYBACK = 16;
/**
 * The government of `available` worth most to `player` (`governmentScore`), a later one winning a tie, as the
 *  original's does. The one it has keeps it unless another is worth more by a sixteenth of its cities' trade
 *  (`REVOLUTION_PAYBACK`).
 */
export declare const bestGovernment: (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
) => typeof Government | null;
export declare const SCORE_TURNS = 8;
/** `bestGovernment`, worked out again only every `SCORE_TURNS` turns or when `available` changes. */
export declare const bestGovernmentLately: (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
) => typeof Government | null;
export default governmentScore;
