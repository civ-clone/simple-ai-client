"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFerryType = exports.isFerry = exports.ferriesByCargo = exports.ferriesType = exports.ferries = exports.carriesUnitsType = exports.carriesUnits = void 0;
// Generic: which transports the computer players treat as ferries and carriers.
const Carries_1 = require("@civ-clone/base-unit-trait-carries/Carries");
const Types_1 = require("@civ-clone/library-unit/Types");
const traits_1 = require("@civ-clone/core-unit/traits");
const attackOdds_1 = require("./attackOdds");
// A `NavalTransport` the ruleset declares to carry something (a `Carries` trait). A transport type without one carries
//  nothing whatever its class, as Civ1's Submarine, a `NavalTransport` so that Civ2's can carry missiles, doesn't:
//  it is no ferry and no carrier, so it isn't sailed to waiting passengers, built or researched as a transport, or
//  waited for by aircraft.
const carriesUnits = (unit) => unit instanceof Types_1.NavalTransport && unit.hasTrait(Carries_1.default);
exports.carriesUnits = carriesUnits;
// The same for a unit class, such as a build item or a requirement's subject.
const carriesUnitsType = (UnitType, ruleRegistry) => Object.prototype.isPrototypeOf.call(Types_1.NavalTransport, UnitType) &&
    (0, traits_1.hasTrait)(UnitType, Carries_1.default, ruleRegistry);
exports.carriesUnitsType = carriesUnitsType;
// A transport that ferries land units: a `NavalTransport` with a `Carries` trait for them. A Carrier (`Carries`
//  aircraft) and Civ2's Submarine (`Carries` missiles) carry units, but no passengers.
const ferries = (unit, ruleRegistry) => unit instanceof Types_1.NavalTransport && (0, exports.ferriesType)(unit.constructor, ruleRegistry);
exports.ferries = ferries;
// The same for a unit class, such as a build item or a requirement's subject.
const ferriesType = (UnitType, ruleRegistry) => Object.prototype.isPrototypeOf.call(Types_1.NavalTransport, UnitType) &&
    (0, traits_1.traitsOf)(UnitType, Carries_1.default, ruleRegistry).some((carries) => carries.carries(Types_1.Land, ruleRegistry));
exports.ferriesType = ferriesType;
// Whether the computer players tell transports apart by what they carry, so that only one that `ferries` land units is
//  sent to fetch passengers, built or researched for them, or counted as room for them. Where battles are fought in
//  rounds (a `CombatResolver`, as in Civ2), whose Submarine also carries units; otherwise (Civ1) any transport that
//  `carriesUnits` counts, and any `NavalTransport` as room, as they always have.
const ferriesByCargo = (ruleRegistry) => (0, attackOdds_1.fightsInRounds)(ruleRegistry);
exports.ferriesByCargo = ferriesByCargo;
// A transport the computer players use as a ferry: one that `ferries` land units, or, unless they go by cargo
//  (`ferriesByCargo`), one that `carriesUnits`.
const isFerry = (unit, ruleRegistry) => (0, exports.ferriesByCargo)(ruleRegistry)
    ? (0, exports.ferries)(unit, ruleRegistry)
    : (0, exports.carriesUnits)(unit);
exports.isFerry = isFerry;
// The same for a unit class, such as a build item or a requirement's subject.
const isFerryType = (UnitType, ruleRegistry) => (0, exports.ferriesByCargo)(ruleRegistry)
    ? (0, exports.ferriesType)(UnitType, ruleRegistry)
    : (0, exports.carriesUnitsType)(UnitType, ruleRegistry);
exports.isFerryType = isFerryType;
exports.default = exports.carriesUnits;
//# sourceMappingURL=carriesUnits.js.map