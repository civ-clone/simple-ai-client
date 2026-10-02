// Generic: what a type of unit is like before anything modifies it, for judging a unit a city might build.
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import Dependencies from '../Dependencies';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';

// The value of a unit type's `YieldType` (`Attack`, `Defence`) by the ruleset's `BaseYield` rules.
export const baseYieldOf = (
  dependencies: Dependencies,
  UnitType: object,
  YieldType: typeof Yield
): number => {
  const unitYield = new YieldType();

  dependencies.ruleRegistry.process(
    BaseYield,
    UnitType as unknown as typeof Unit,
    unitYield
  );

  return unitYield.value();
};

export default baseYieldOf;
