import { FuelState } from '@civ-clone/base-unit-fuel/lib/reach';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
export declare const fuelFor: (
  dependencies: Dependencies,
  unit: Unit
) => FuelState | null;
export declare const fuelCanReturn: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  action: Action
) => boolean | null;
export declare const withFuel: (knowledge: Knowledge) => Knowledge;
export default withFuel;
