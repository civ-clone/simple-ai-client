"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spaceAdvancesWanted = exports.withSpaceshipDefence = exports.civ1SpaceRacePolicy = exports.createCiv1SpaceRacePolicy = exports.wantedPart = exports.civ1FinalYear = exports.playsSpaceRace = exports.spaceRaceData = exports.buildsOnDefaultLayout = exports.wantedModule = exports.MAXIMUM_STEPS = exports.LATE_LAUNCH_YEARS = exports.SURE_LAUNCH_CHANCE = exports.MINIMUM_LAUNCH_CHANCE = void 0;
// Civ1: the numbers behind a computer player's space race (civ-clone/web-renderer#376), for `base-strategy-victory`'s
//  generic strategies.
//
// When to launch is v474.05's (OpenCivOne `CityWorker.cs` ~L1037-1095), checked as each part is added there and at the
//  end of each turn here. A ship with less than a 40% chance of success never launches. Otherwise it does once nothing
//  more can be added, once it's better than 75%, once a rival ranks higher, or once a rival has launched and this ship
//  would arrive no later; while no rival knows Space Flight it never does, and keeps growing. v474.05 compares only
//  with the human; here every rival counts, as any of them can be a person or a computer.
//
// On top, ours: a ship whose modules and components are all on launches, and so does one that would otherwise arrive
//  within `LATE_LAUNCH_YEARS` of the final year, which v474.05 doesn't need while the human is the only one to wait for.
//
// What to build is ours: v474.05 lists the parts in each city's production menu, but how its AI weighs them isn't
//  decoded. A ship here grows in balanced steps, each a Habitation, a Life Support and a Power module (the energy one
//  Habitation and one Life Support need) and two each of Fuel and Propulsion, with Structurals whenever a part isn't
//  yet joined to the frame. The first step is a ship good for about 20 years with a chance of 100%.
//
// The policy plays only where the game's spaceship layout is the one its steps were planned for, Civ1's Default
//  (`civ1-default-spaceship-layout`, registered in the game's `LayoutRegistry`): a rule set with a ship of its own
//  (Civilization II's) has a policy of its own, even if its parts are the same classes. What the ship needs comes from
//  the rule set: what every part requires anyone to have built (the Apollo Program) and the advances each part
//  requires, from the game's `requirements` (civ-clone/web-renderer#37), in `spaceRaceData`. The final year is Civ1's
//  unless the policy is made with another (`createCiv1SpaceRacePolicy`).
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const LayoutRegistry_1 = require("@civ-clone/core-spaceship/LayoutRegistry");
const RequirementRegistry_1 = require("@civ-clone/core-requirement/RequirementRegistry");
const Parts_1 = require("@civ-clone/civ1-spaceship/Parts");
const Advance_1 = require("@civ-clone/core-science/Advance");
const Yields_1 = require("@civ-clone/library-city/Yields");
const Default_1 = require("@civ-clone/civ1-default-spaceship-layout/Default");
const Part_1 = require("@civ-clone/core-spaceship/Part");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const rank_1 = require("@civ-clone/core-power/lib/rank");
const scoring_1 = require("@civ-clone/civ1-game-end/lib/scoring");
const level_1 = require("@civ-clone/civ1-difficulty/level");
const knowledge_1 = require("./knowledge");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const defence_1 = require("../City/defence");
// v474.05's launch thresholds.
exports.MINIMUM_LAUNCH_CHANCE = 0.4;
exports.SURE_LAUNCH_CHANCE = 0.75;
// Ours: a ship that would otherwise arrive within this many years of the final year launches now, rather than wait for
//  a rival who may never learn Space Flight and finish the game without one.
exports.LATE_LAUNCH_YEARS = 10;
// The most each module and component the Default layout takes: 4 of each module, 8 of each component.
exports.MAXIMUM_STEPS = 4;
// One step of the ship: how many of each part it has, as the step's multiple.
const step = [
    [Parts_1.Habitation, 1],
    [Parts_1.LifeSupport, 1],
    [Parts_1.Power, 1],
    [Parts_1.Fuel, 2],
    [Parts_1.Propulsion, 2],
];
const knows = (dependencies, player, AdvanceType) => dependencies.playerResearchRegistry
    .getByPlayer(player)
    .completed(AdvanceType);
const productionOf = (city) => (0, reduceYields_1.reduceYield)(city.yields(), Yields_1.Production);
// The player's cities by their shields, most first: worked out once a turn, as it asks every city for its yields.
const ranked = new WeakMap();
const citiesByProduction = (dependencies, player) => {
    const turn = dependencies.turn.value(), cached = ranked.get(player);
    if (cached && cached.turn === turn) {
        return cached.cities;
    }
    const cities = dependencies.cityRegistry
        .getByPlayer(player)
        .map((city) => ({ city, production: productionOf(city) }))
        .sort((a, b) => b.production - a.production)
        .map(({ city }) => city);
    ranked.set(player, { turn, cities });
    return cities;
};
const partsOf = (spaceship) => [
    ...spaceship.activeParts(),
    ...spaceship.inactiveParts(),
];
const countOf = (PartType, parts, building) => parts.filter((part) => part instanceof PartType).length +
    building.filter((Building) => Building === PartType)
        .length;
// The module or component the ship wants next, in its balanced steps: `null` once it has every step.
const wantedModule = (spaceship, building) => {
    var _a;
    const parts = partsOf(spaceship);
    for (let level = 1; level <= exports.MAXIMUM_STEPS; level++) {
        const [wanted] = (_a = step.find(([PartType, multiple]) => countOf(PartType, parts, building) < multiple * level)) !== null && _a !== void 0 ? _a : [null];
        if (wanted !== null) {
            return wanted;
        }
    }
    return null;
};
exports.wantedModule = wantedModule;
// The parts this policy builds: the steps' modules and components, and the Structurals that join them.
const builds = [
    Parts_1.Structural,
    ...step.map(([PartType]) => PartType),
];
const isA = (Type, Base) => typeof Type === 'function' &&
    (Type === Base ||
        Object.prototype.isPrototypeOf.call(Base.prototype, Type.prototype));
// Whether the game's ships are built on the layout this policy's steps were planned for (or one made from it).
const buildsOnDefaultLayout = (layoutRegistry) => layoutRegistry
    .entries()
    .some((LayoutType) => isA(LayoutType, Default_1.default));
exports.buildsOnDefaultLayout = buildsOnDefaultLayout;
/**
 * What the rule set says the ship needs, from its `requirements`, when this policy plays the space race: `null` unless
 * the game's layout is Civ1's (`buildsOnDefaultLayout`), every part this policy builds requires an advance and every
 * part requires something built by anyone (`range: 'world'`). Read afresh each time: the entries are a few hundred, and
 * a replaced entry changes no count.
 */
const spaceRaceData = (requirementRegistry, layoutRegistry = LayoutRegistry_1.instance) => {
    if (!(0, exports.buildsOnDefaultLayout)(layoutRegistry)) {
        return null;
    }
    const entries = requirementRegistry
        .entries()
        .filter((entry) => entry.relation === 'requires' && isA(entry.subject, Part_1.default)), enablers = entries
        .filter((entry) => entry.subject === Part_1.default && entry.range === 'world')
        .flatMap((entry) => entry.targets)
        .filter((target) => typeof target === 'function' && !isA(target, Advance_1.default)), advancesOf = (entry) => entry.targets.filter((target) => isA(target, Advance_1.default)), advances = entries
        .filter((entry) => builds.includes(entry.subject))
        .flatMap(advancesOf)
        .filter((AdvanceType, index, all) => all.indexOf(AdvanceType) === index), complete = enablers.length > 0 &&
        builds.every((PartType) => entries.some((entry) => entry.subject === PartType && advancesOf(entry).length > 0)), found = complete ? { enablers, advances } : null;
    return found;
};
exports.spaceRaceData = spaceRaceData;
// Whether this policy plays the space race in the game whose `requirements` and layouts these are: only on Civ1's
//  layout (`spaceRaceData`). Elsewhere (Civilization II's set, whose own rules may hand every player a ship and make its
//  parts buildable) no Civ1 strategy builds a part or launches.
const playsSpaceRace = (requirementRegistry, layoutRegistry = LayoutRegistry_1.instance) => (0, exports.spaceRaceData)(requirementRegistry, layoutRegistry) !== null;
exports.playsSpaceRace = playsSpaceRace;
const civ1FinalYear = (victoryDependencies) => (0, scoring_1.endYear)((0, level_1.levelOf)(victoryDependencies.difficulty));
exports.civ1FinalYear = civ1FinalYear;
// A Structural to ask the layout about: only its type matters.
const structuralProbe = Object.create(Parts_1.Structural.prototype);
// The part the ship wants next, of any, ignoring what can be built: a Structural to start the frame, or one for each
//  part waiting to be joined to it while the frame has room, before more modules and components; `null` once it has
//  every step. A Propulsion waits for a Fuel next to it, not for the frame, so it isn't counted.
const wantedPart = (spaceship, building) => {
    const structuralsBuilding = countOf(Parts_1.Structural, [], building), unjoined = spaceship
        .inactiveParts()
        .filter((part) => !(part instanceof Parts_1.Propulsion)).length, room = spaceship
        .layout()
        .slots()
        .filter((slot) => slot.empty() && slot.accepts(structuralProbe)).length;
    if (room > structuralsBuilding &&
        ((partsOf(spaceship).length === 0 && structuralsBuilding === 0) ||
            unjoined > structuralsBuilding)) {
        return Parts_1.Structural;
    }
    return (0, exports.wantedModule)(spaceship, building);
};
exports.wantedPart = wantedPart;
// When the ship would arrive, as a year: `now` for one still to launch.
const arrival = (victoryDependencies, spaceship) => {
    const launched = spaceship.launched();
    return ((launched === false
        ? victoryDependencies.year.value()
        : victoryDependencies.year.value(launched)) + spaceship.flightTime());
};
/**
 * Civ1's space race, with what the ship needs from `requirementRegistry`, the layouts from `layoutRegistry` (the
 * game's) and the final year from `finalYear`. Where the game's ship isn't Civ1's (`spaceRaceData` is `null`), it never
 * plays for space: it wants no advance and no enabler, and never launches, as it has no ship.
 */
const createCiv1SpaceRacePolicy = (requirementRegistry = RequirementRegistry_1.instance, finalYear = exports.civ1FinalYear, layoutRegistry = LayoutRegistry_1.instance) => ({
    // Once a player knows Computers (Space Flight's prerequisite with Rocketry), or has a ship with parts on it, it plays
    //  for space. Every leader does: v474.05's computer players all build parts.
    weight: (dependencies, victoryDependencies, player) => {
        var _a;
        return (0, exports.spaceRaceData)(dependencies.requirementRegistry, layoutRegistry) !== null &&
            (knows(dependencies, player, Advances_1.Computers) ||
                partsOf((_a = victoryDependencies.spaceshipRegistry.getActiveByPlayer(player)) !== null && _a !== void 0 ? _a : {
                    activeParts: () => [],
                    inactiveParts: () => [],
                }).length > 0)
            ? 1
            : 0;
    },
    // What the parts require: in Civ1, Structurals Space Flight, Fuel and Propulsion Plastics, the modules Robotics.
    advances: (dependencies) => {
        var _a, _b;
        return (_b = (_a = (0, exports.spaceRaceData)(dependencies.requirementRegistry, layoutRegistry)) === null || _a === void 0 ? void 0 : _a.advances) !== null && _b !== void 0 ? _b : [];
    },
    // What every part requires built first: in Civ1, the Apollo Program.
    get enablers() {
        var _a, _b;
        return (_b = (_a = (0, exports.spaceRaceData)(requirementRegistry, layoutRegistry)) === null || _a === void 0 ? void 0 : _a.enablers) !== null && _b !== void 0 ? _b : [];
    },
    // The player's most productive city that isn't already building a Wonder, and has the defenders it wants first.
    enablerCity: (dependencies, victoryDependencies, player) => {
        var _a;
        return (_a = citiesByProduction(dependencies, player).find((city) => {
            var _a;
            return !(0, defence_1.wantsDefender)(dependencies, knowledge_1.default, city) &&
                !(((_a = dependencies.cityBuildRegistry.getByCity(city).building()) === null || _a === void 0 ? void 0 : _a.item().prototype) instanceof Wonder_1.default);
        })) !== null && _a !== void 0 ? _a : null;
    },
    // The most productive third of the player's cities (at least one), each making at least 5 shields: parts cost 80 to
    //  320, too much for a small city. A city still wanting defenders builds those first.
    buildsParts: (dependencies, victoryDependencies, city) => {
        const cities = citiesByProduction(dependencies, city.player()), index = cities.indexOf(city);
        return (index !== -1 &&
            index < Math.max(1, Math.ceil(cities.length / 3)) &&
            productionOf(city) >= 5 &&
            !(0, defence_1.wantsDefender)(dependencies, knowledge_1.default, city));
    },
    nextPart: (dependencies, victoryDependencies, spaceship, available, building) => {
        const wanted = (0, exports.wantedPart)(spaceship, building);
        return wanted !== null && available.includes(wanted) ? wanted : null;
    },
    shouldLaunch: (dependencies, victoryDependencies, spaceship) => {
        // Another rule set's ship (one handed out by its own rules) is never launched on Civ1's terms.
        if (!(0, exports.playsSpaceRace)(dependencies.requirementRegistry, layoutRegistry)) {
            return false;
        }
        const chance = spaceship.chanceOfSuccess();
        if (chance < exports.MINIMUM_LAUNCH_CHANCE) {
            return false;
        }
        // Every module and component is on: there's nothing more to wait for. Structurals still wanted are ones whose
        //  parts couldn't be joined to the frame.
        if ((0, exports.wantedModule)(spaceship, []) === null) {
            return true;
        }
        if (arrival(victoryDependencies, spaceship) + exports.LATE_LAUNCH_YEARS >=
            finalYear(victoryDependencies)) {
            return true;
        }
        const player = spaceship.player(), rivals = victoryDependencies.playerRegistry
            .entries()
            .filter((other) => other !== player);
        if (!rivals.some((rival) => knows(dependencies, rival, Advances_1.SpaceFlight))) {
            return false;
        }
        if (chance > exports.SURE_LAUNCH_CHANCE) {
            return true;
        }
        const [leader] = (0, rank_1.rankings)(victoryDependencies.playerRegistry.entries(), dependencies.ruleRegistry);
        if (leader !== player) {
            return true;
        }
        const ours = arrival(victoryDependencies, spaceship);
        return rivals.some((rival) => {
            const theirs = victoryDependencies.spaceshipRegistry
                .getBy('player', rival)
                .find((other) => other.launched() !== false && other.successful() === null);
            return (theirs !== undefined && ours <= arrival(victoryDependencies, theirs));
        });
    },
});
exports.createCiv1SpaceRacePolicy = createCiv1SpaceRacePolicy;
exports.civ1SpaceRacePolicy = (0, exports.createCiv1SpaceRacePolicy)();
// A capital whose player has a ship in flight keeps one more defender: losing it loses the ship (#177).
const withSpaceshipDefence = (knowledge, victoryDependencies, isCapital) => {
    const extra = (dependencies, city) => {
        const spaceship = victoryDependencies.spaceshipRegistry.getActiveByPlayer(city.player());
        return spaceship !== null &&
            spaceship.launched() !== false &&
            isCapital(dependencies, city)
            ? 1
            : 0;
    };
    return {
        ...knowledge,
        defendersWanted: (dependencies, city) => knowledge.defendersWanted(dependencies, city) + extra(dependencies, city),
        defendersKept: (dependencies, city) => knowledge.defendersKept(dependencies, city) + extra(dependencies, city),
    };
};
exports.withSpaceshipDefence = withSpaceshipDefence;
exports.default = exports.civ1SpaceRacePolicy;
// Whether `player` plays for space and still lacks an advance the ship needs: its science mustn't stop yet, even once
//  it has everything its leader wants (it might have been given Robotics before Space Flight).
const spaceAdvancesWanted = (dependencies, victoryDependencies, player) => exports.civ1SpaceRacePolicy.weight(dependencies, victoryDependencies, player) > 0 &&
    exports.civ1SpaceRacePolicy
        .advances(dependencies, victoryDependencies, player)
        .some((AdvanceType) => !knows(dependencies, player, AdvanceType));
exports.spaceAdvancesWanted = spaceAdvancesWanted;
//# sourceMappingURL=spaceRace.js.map