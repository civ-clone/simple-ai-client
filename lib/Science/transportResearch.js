"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportResearch = void 0;
// Generic: the advance to research next on the way to a ship that carries land units (civ-clone/web-renderer#632), for
//  a player bound to its land (`lib/Player/islandBound`). It reads the ruleset's requirements (#37) rather than naming
//  any advance or unit: in Civ1 it comes out as Map Making for the Trireme, by way of Alphabet.
const Advance_1 = require("@civ-clone/core-science/Advance");
const Types_1 = require("@civ-clone/library-unit/Types");
const isAdvance = (target) => typeof target === 'function' &&
    (target === Advance_1.default || Object.prototype.isPrototypeOf.call(Advance_1.default, target));
// The advances an entry about `Subject` with `relation` names.
const advancesFor = (dependencies, Subject, relation) => dependencies.requirementRegistry
    .for(Subject, relation)
    .flatMap((entry) => [...entry.targets])
    .filter(isAdvance);
// The advances `player` still needs for all of `goals`, prerequisites included, each before the ones that need it.
const missing = (dependencies, playerResearch, goals) => {
    const found = [], visit = (AdvanceType) => {
        if (found.includes(AdvanceType) ||
            playerResearch.completed(AdvanceType)) {
            return;
        }
        advancesFor(dependencies, AdvanceType, 'requires').forEach(visit);
        found.push(AdvanceType);
    };
    goals.forEach(visit);
    return found;
};
// The transports the ruleset has: the subjects of its requirements that carry land units.
const transportTypes = (dependencies) => [
    ...new Set(dependencies.requirementRegistry
        .filter((entry) => Object.prototype.isPrototypeOf.call(Types_1.NavalTransport, entry.subject))
        .map((entry) => entry.subject)),
];
// An advance `playerResearch` can research now, on the shortest way to a transport its player hasn't made obsolete,
//  or `null` if it already has one (or the ruleset has none it can reach).
const transportResearch = (dependencies, playerResearch) => {
    var _a;
    const paths = transportTypes(dependencies)
        .filter((TransportType) => !advancesFor(dependencies, TransportType, 'obsoletedBy').some((AdvanceType) => playerResearch.completed(AdvanceType)))
        .map((TransportType) => missing(dependencies, playerResearch, advancesFor(dependencies, TransportType, 'requires')))
        .sort((a, b) => a.length - b.length);
    if (paths.length === 0 || paths[0].length === 0) {
        return null;
    }
    const available = playerResearch.available();
    return ((_a = paths[0].find((AdvanceType) => available.includes(AdvanceType))) !== null && _a !== void 0 ? _a : null);
};
exports.transportResearch = transportResearch;
exports.default = exports.transportResearch;
//# sourceMappingURL=transportResearch.js.map