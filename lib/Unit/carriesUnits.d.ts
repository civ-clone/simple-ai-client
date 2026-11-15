import { NavalTransport } from '@civ-clone/library-unit/Types';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
export declare const carriesUnits: (unit: Unit) => unit is NavalTransport;
export declare const carriesUnitsType: (
  UnitType: object,
  ruleRegistry: RuleRegistry
) => boolean;
export default carriesUnits;
