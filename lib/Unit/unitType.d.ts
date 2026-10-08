import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Yield from '@civ-clone/core-yield/Yield';
export declare const baseYieldOf: (
  dependencies: Dependencies,
  UnitType: object,
  YieldType: typeof Yield
) => number;
export default baseYieldOf;
