import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const unitDestroyed: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  buildItemInCity: (city: City) => void
) => void;
export default unitDestroyed;
