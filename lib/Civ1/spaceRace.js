"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSpaceshipDefence = exports.civ1SpaceRacePolicy = exports.wantedPart = exports.wantedModule = exports.MAXIMUM_STEPS = exports.LATE_LAUNCH_YEARS = exports.SURE_LAUNCH_CHANCE = exports.MINIMUM_LAUNCH_CHANCE = void 0;
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
const Wonders_1 = require("@civ-clone/civ1-wonder/Wonders");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Parts_1 = require("@civ-clone/civ1-spaceship/Parts");
const Yields_1 = require("@civ-clone/library-city/Yields");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const rank_1 = require("@civ-clone/core-power/lib/rank");
const scoring_1 = require("@civ-clone/civ1-game-end/lib/scoring");
const level_1 = require("@civ-clone/civ1-difficulty/level");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
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
// The part the ship wants next, of any, ignoring what can be built: a Structural to start the frame, or one for each
//  part not yet joined to it, before more modules and components; `null` once it has every step.
const wantedPart = (spaceship, building) => {
    const structuralsBuilding = countOf(Parts_1.Structural, [], building);
    if ((partsOf(spaceship).length === 0 && structuralsBuilding === 0) ||
        spaceship.inactiveParts().length > structuralsBuilding) {
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
exports.civ1SpaceRacePolicy = {
    // Once a player knows Computers (Space Flight's prerequisite with Rocketry), or has a ship with parts on it, it plays
    //  for space. Every leader does: v474.05's computer players all build parts.
    weight: (dependencies, victoryDependencies, player) => {
        var _a;
        return knows(dependencies, player, Advances_1.Computers) ||
            partsOf((_a = victoryDependencies.spaceshipRegistry.getActiveByPlayer(player)) !== null && _a !== void 0 ? _a : {
                activeParts: () => [],
                inactiveParts: () => [],
            }).length > 0
            ? 1
            : 0;
    },
    // Structurals need Space Flight, Fuel and Propulsion Plastics, the modules Robotics.
    advances: () => [Advances_1.SpaceFlight, Advances_1.Plastics, Advances_1.Robotics],
    enablers: [Wonders_1.ApolloProgram],
    // The player's most productive city that isn't already building a Wonder.
    enablerCity: (dependencies, victoryDependencies, player) => {
        var _a;
        return (_a = citiesByProduction(dependencies, player).find((city) => {
            var _a;
            return !(((_a = dependencies.cityBuildRegistry.getByCity(city).building()) === null || _a === void 0 ? void 0 : _a.item().prototype) instanceof Wonder_1.default);
        })) !== null && _a !== void 0 ? _a : null;
    },
    // The most productive third of the player's cities (at least one), each making at least 5 shields: parts cost 80 to
    //  320, too much for a small city.
    buildsParts: (dependencies, victoryDependencies, city) => {
        const cities = citiesByProduction(dependencies, city.player()), index = cities.indexOf(city);
        return (index !== -1 &&
            index < Math.max(1, Math.ceil(cities.length / 3)) &&
            productionOf(city) >= 5);
    },
    nextPart: (dependencies, victoryDependencies, spaceship, available, building) => {
        const wanted = (0, exports.wantedPart)(spaceship, building);
        return wanted !== null && available.includes(wanted) ? wanted : null;
    },
    shouldLaunch: (dependencies, victoryDependencies, spaceship) => {
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
            (0, scoring_1.endYear)((0, level_1.levelOf)(victoryDependencies.difficulty))) {
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
};
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
//# sourceMappingURL=spaceRace.js.map