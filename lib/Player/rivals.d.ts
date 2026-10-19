import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const atPeace: (
  dependencies: Dependencies,
  player: Player,
  other: Player
) => boolean;
export declare const isEnemy: (
  dependencies: Dependencies,
  player: Player,
  other: Player
) => boolean;
export declare const powerOf: (
  dependencies: Dependencies,
  units: Unit[]
) => number;
export declare const powerOfPlayer: (
  dependencies: Dependencies,
  player: Player
) => number;
export declare const confidentPower: (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  power?: number
) => number;
export declare const knownEnemyCities: (
  dependencies: Dependencies,
  player: Player
) => City[];
export declare const rivalOf: (
  dependencies: Dependencies,
  player: Player
) => Player | null;
export default rivalOf;
