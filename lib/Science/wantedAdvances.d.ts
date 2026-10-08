import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Trait from '@civ-clone/core-civilization/Trait';
export interface WantedAdvancesPolicy {
  always: (typeof Advance)[];
  byTrait: [typeof Trait, (typeof Advance)[]][];
}
export declare const wantedAdvances: (
  dependencies: Dependencies,
  player: Player,
  policy: WantedAdvancesPolicy
) => (typeof Advance)[];
export declare const scienceStopped: (
  dependencies: Dependencies,
  player: Player,
  policy: WantedAdvancesPolicy
) => boolean;
export default wantedAdvances;
