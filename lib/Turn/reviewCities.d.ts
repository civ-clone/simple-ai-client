import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
export declare const reviewCities: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  knowledge: Knowledge
) => void;
export default reviewCities;
