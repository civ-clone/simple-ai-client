"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carriesUnitsType = exports.carriesUnits = void 0;
// Generic: which transports the computer players treat as ferries and carriers.
const Carries_1 = require("@civ-clone/base-unit-trait-carries/Carries");
const Types_1 = require("@civ-clone/library-unit/Types");
const traits_1 = require("@civ-clone/core-unit/traits");
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
exports.default = exports.carriesUnits;
//# sourceMappingURL=carriesUnits.js.map