// Generic: which transports the computer players treat as ferries and carriers.
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import { hasTrait } from '@civ-clone/core-unit/traits';

// A `NavalTransport` the ruleset declares to carry something (a `Carries` trait). A transport type without one carries
//  nothing whatever its class, as Civ1's Submarine, a `NavalTransport` so that Civ2's can carry missiles, doesn't:
//  it is no ferry and no carrier, so it isn't sailed to waiting passengers, built or researched as a transport, or
//  waited for by aircraft.
export const carriesUnits = (unit: Unit): unit is NavalTransport =>
  unit instanceof NavalTransport && unit.hasTrait(Carries);

// The same for a unit class, such as a build item or a requirement's subject.
export const carriesUnitsType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean =>
  Object.prototype.isPrototypeOf.call(NavalTransport, UnitType) &&
  hasTrait(UnitType as typeof Unit, Carries, ruleRegistry);

export default carriesUnits;
