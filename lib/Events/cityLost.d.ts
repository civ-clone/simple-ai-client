import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
export declare const cityLost: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  by: Player | null,
  destroyed: boolean
) => void;
export default cityLost;
