import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Unit from '@civ-clone/core-unit/Unit';
export declare const unitSupport: (
  dependencies: Dependencies,
  city: City,
  UnitType?: typeof Unit | null
) => number;
export default unitSupport;
