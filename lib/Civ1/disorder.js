"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1DisorderPolicy = exports.recordsCivilDisorder = void 0;
// Civ1: how a city is kept out of civil disorder, after v474.05's AI (`CityWorker.cs` `F0_1d12_0045_ProcessCityState`
//  in OpenCivOne): a city that falls into disorder builds a Temple, a Marketplace, a Cathedral or a Colosseum, the
//  first it can, and spends up to an eighth of the treasury on it.
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const disorder_1 = require("../City/disorder");
const Difficulties_1 = require("@civ-clone/civ1-difficulty/Difficulties");
const cityStatus_1 = require("@civ-clone/civ1-city-happiness/lib/cityStatus");
const level_1 = require("@civ-clone/civ1-difficulty/level");
// The citizens a computer player's city is born content with: 3, whatever the level (`civ1-difficulty`), so the level,
//  which this policy can't see, makes no difference. It only ever plays computer players.
const bornContent = (0, level_1.contentCitizens)(Difficulties_1.King.level(), false);
// Whether `civ1-city-happiness` keeps its record of disorder in this game: its rules register the handler. Worked out
//  once a turn: it's asked for each city, and `handlers()` builds its list afresh each time.
const recordsCache = new WeakMap();
const recordsCivilDisorder = (dependencies) => {
    const registry = dependencies.pendingEffectRegistry, turn = dependencies.turn.value(), cached = recordsCache.get(registry);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const records = registry.handlers().includes(cityStatus_1.CIVIL_DISORDER);
    recordsCache.set(registry, [turn, records]);
    return records;
};
exports.recordsCivilDisorder = recordsCivilDisorder;
exports.civ1DisorderPolicy = {
    calmingImprovements: [
        CityImprovements_1.Temple,
        CityImprovements_1.Marketplace,
        CityImprovements_1.Cathedral,
        CityImprovements_1.Colosseum,
    ],
    purchaseShare: 1 / 8,
    // Every citizen of a computer player's city beyond those born content is born unhappy (`civ1-city-happiness`'s
    //  `PopulationUnhappiness`).
    unhappinessOnGrowth: (dependencies, city) => dependencies.cityGrowthRegistry.getByCity(city).size() + 1 > bornContent
        ? 1
        : 0,
    // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored. In a game
    //  without that record (Civ2 keeps its own, under its own name), what the ruleset's `CivilDisorder` rules found at the
    //  start of the player's turn (`turnStart`), so a city calmed since still counts. Not a city whose disorder is only
    //  its capture's (`beyondCalming`): it was captured this turn.
    wasInDisorder: (dependencies, city) => (0, exports.recordsCivilDisorder)(dependencies)
        ? (0, cityStatus_1.civilDisorder)(city, dependencies.pendingEffectRegistry) !== null &&
            !(0, cityStatus_1.capturedDisorder)(city, dependencies.pendingEffectRegistry)
        : (0, disorder_1.wasInDisorderAtTurnStart)(dependencies, city),
    // A city the human captures below a Republic is in disorder, whatever its citizens think, until its next turn's
    //  production is lost to it (`civ1-city-happiness`'s `capturedDisorder`), and the Automate AI plays the human's
    //  turns: Entertainers, a Temple or luxuries can't end it, so none are spent on it (civ-clone/web-renderer#1014).
    beyondCalming: (dependencies, city) => (0, cityStatus_1.capturedDisorder)(city, dependencies.pendingEffectRegistry),
    turnStart: (dependencies, player) => {
        if (!(0, exports.recordsCivilDisorder)(dependencies)) {
            (0, disorder_1.noteDisorderAtTurnStart)(dependencies, player);
        }
    },
};
exports.default = exports.civ1DisorderPolicy;
//# sourceMappingURL=disorder.js.map