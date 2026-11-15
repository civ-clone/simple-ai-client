// Generic: which transports the computer players treat as ferries and carriers.
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import { Land, NavalTransport } from '@civ-clone/library-unit/Types';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import { hasTrait, traitsOf } from '@civ-clone/core-unit/traits';
import { fightsInRounds } from './attackOdds';

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

// A transport that ferries land units: a `NavalTransport` with a `Carries` trait for them. A Carrier (`Carries`
//  aircraft) and Civ2's Submarine (`Carries` missiles) carry units, but no passengers.
export const ferries = (
  unit: Unit,
  ruleRegistry: RuleRegistry
): unit is NavalTransport =>
  unit instanceof NavalTransport && ferriesType(unit.constructor, ruleRegistry);

// The same for a unit class, such as a build item or a requirement's subject.
export const ferriesType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean =>
  Object.prototype.isPrototypeOf.call(NavalTransport, UnitType) &&
  traitsOf(UnitType as typeof Unit, Carries, ruleRegistry).some(
    (carries: Carries): boolean => carries.carries(Land, ruleRegistry)
  );

// Whether the computer players tell transports apart by what they carry, so that only one that `ferries` land units is
//  sent to fetch passengers, built or researched for them, or counted as room for them. Where battles are fought in
//  rounds (a `CombatResolver`, as in Civ2), whose Submarine also carries units; otherwise (Civ1) any transport that
//  `carriesUnits` counts, and any `NavalTransport` as room, as they always have.
export const ferriesByCargo = (ruleRegistry: RuleRegistry): boolean =>
  fightsInRounds(ruleRegistry);

// A transport the computer players use as a ferry: one that `ferries` land units, or, unless they go by cargo
//  (`ferriesByCargo`), one that `carriesUnits`.
export const isFerry = (
  unit: Unit,
  ruleRegistry: RuleRegistry
): unit is NavalTransport =>
  ferriesByCargo(ruleRegistry)
    ? ferries(unit, ruleRegistry)
    : carriesUnits(unit);

// The same for a unit class, such as a build item or a requirement's subject.
export const isFerryType = (
  UnitType: object,
  ruleRegistry: RuleRegistry
): boolean =>
  ferriesByCargo(ruleRegistry)
    ? ferriesType(UnitType, ruleRegistry)
    : carriesUnitsType(UnitType, ruleRegistry);

export default carriesUnits;
