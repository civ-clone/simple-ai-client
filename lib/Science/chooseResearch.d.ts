import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '../Dependencies';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
export declare const chooseResearch: (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  wanted?: (typeof Advance)[]
) => void;
export default chooseResearch;
