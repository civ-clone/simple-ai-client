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
// The advances an entry names, of its targets.
const advancesIn = (entry) => entry.targets.filter(isAdvance);
// Each item of `more` not in `list` yet, added to its end.
const merge = (list, more) => [
    ...list,
    ...more.filter((AdvanceType) => !list.includes(AdvanceType)),
];
// The advances `playerResearch`'s player still needs to meet `entries`, prerequisites included, each before the ones
//  that need it: every advance of an all-of entry, and the one of an any-of entry that needs fewest. `null` when one
//  can't be met, which a requirement that leads back to itself (`visiting`) can't be.
const toMeet = (dependencies, playerResearch, entries, visiting = new Set()) => {
    let found = [];
    for (const entry of entries) {
        const options = advancesIn(entry).map((AdvanceType) => toResearch(dependencies, playerResearch, AdvanceType, visiting));
        if (options.length === 0) {
            // Only conditions (a coastal city), which research can't meet.
            continue;
        }
        if (entry.mode === 'any') {
            const [fewest] = options
                .filter((option) => option !== null)
                .sort((a, b) => a.length - b.length);
            if (!fewest) {
                return null;
            }
            found = merge(found, fewest);
            continue;
        }
        if (options.some((option) => option === null)) {
            return null;
        }
        options.forEach((option) => {
            found = merge(found, option);
        });
    }
    return found;
};
// `AdvanceType` and the advances it needs that `playerResearch`'s player hasn't got, prerequisites first, or `null`.
const toResearch = (dependencies, playerResearch, AdvanceType, visiting) => {
    if (playerResearch.completed(AdvanceType)) {
        return [];
    }
    if (visiting.has(AdvanceType)) {
        return null;
    }
    visiting.add(AdvanceType);
    const before = toMeet(dependencies, playerResearch, dependencies.requirementRegistry.for(AdvanceType, 'requires'), visiting);
    visiting.delete(AdvanceType);
    return before === null ? null : merge(before, [AdvanceType]);
};
// Whether `playerResearch`'s player has made `TransportType` obsolete: it has the advances of an entry saying so, all
//  of them or any one, as the entry says.
const obsolete = (dependencies, playerResearch, TransportType) => dependencies.requirementRegistry
    .for(TransportType, 'obsoletedBy')
    .some((entry) => {
    const advances = advancesIn(entry);
    return (advances.length > 0 &&
        (entry.mode === 'any'
            ? advances.some((AdvanceType) => playerResearch.completed(AdvanceType))
            : advances.every((AdvanceType) => playerResearch.completed(AdvanceType))));
});
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
        .filter((TransportType) => !obsolete(dependencies, playerResearch, TransportType))
        .map((TransportType) => toMeet(dependencies, playerResearch, dependencies.requirementRegistry.for(TransportType, 'requires')))
        .filter((path) => path !== null)
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