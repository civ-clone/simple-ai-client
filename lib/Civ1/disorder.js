"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1DisorderPolicy = void 0;
// Civ1: how a city is kept out of civil disorder, after v474.05's AI (`CityWorker.cs` `F0_1d12_0045_ProcessCityState`
//  in OpenCivOne): a city that falls into disorder builds a Temple, a Marketplace, a Cathedral or a Colosseum, the
//  first it can, and spends up to an eighth of the treasury on it.
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const cityStatus_1 = require("@civ-clone/civ1-city-happiness/lib/cityStatus");
exports.civ1DisorderPolicy = {
    calmingImprovements: [
        CityImprovements_1.Temple,
        CityImprovements_1.Marketplace,
        CityImprovements_1.Cathedral,
        CityImprovements_1.Colosseum,
    ],
    purchaseShare: 1 / 8,
    // A city's sixth citizen and every one after it is born unhappy (`civ1-city-happiness`'s `PopulationUnhappiness`,
    //  one for each citizen over five).
    unhappinessOnGrowth: (dependencies, city) => dependencies.cityGrowthRegistry.getByCity(city).size() + 1 > 5 ? 1 : 0,
    // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored.
    wasInDisorder: (dependencies, city) => (0, cityStatus_1.civilDisorder)(city, dependencies.pendingEffectRegistry) !== null,
};
exports.default = exports.civ1DisorderPolicy;
//# sourceMappingURL=disorder.js.map