import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
export declare const isOnSea: (city: City, seaSize?: number) => boolean;
export declare const reachesSeaToExplore: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
) => boolean;
export declare const explorerShipFor: (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  knowledge: Knowledge
) => typeof Buildable | null;
export default explorerShipFor;
