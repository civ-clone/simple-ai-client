import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
export declare const transportResearch: (
  dependencies: Dependencies,
  playerResearch: PlayerResearch
) => typeof Advance | null;
export default transportResearch;
