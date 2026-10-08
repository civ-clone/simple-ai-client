import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import { SetHomeCity } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
export declare const takeUpStation: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  unit: Unit,
  city: City,
  setHomeCity: SetHomeCity | undefined
) => boolean;
export default takeUpStation;
