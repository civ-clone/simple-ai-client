"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1MartialLawPolicy = void 0;
// Civ1: martial law, as `civ1-city-happiness` has it (its `martialLaw.ts`, v474.05's): under Anarchy, Communism,
//  Despotism or Monarchy, each unit in a city that can attack keeps one of its unhappy citizens content, up to three,
//  once the city's improvements and Wonders have calmed what they can. The governments and the cap are the engine's
//  own; which units it uses, and how many citizens are unhappy, are asked of its rules (`City/defence`).
const martialLaw_1 = require("@civ-clone/civ1-city-happiness/martialLaw");
const Yields_1 = require("@civ-clone/core-unit/Yields");
const unitType_1 = require("../Unit/unitType");
exports.civ1MartialLawPolicy = {
    limit: (dependencies, city) => dependencies.playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(...martialLaw_1.martialLawGovernments)
        ? martialLaw_1.martialLawUnitLimit
        : 0,
    // As `civ1-city-happiness`'s `keepsMartialLaw` judges a unit: any whose attack isn't 0.
    wouldUse: (dependencies, UnitType) => (0, unitType_1.default)(dependencies, UnitType, Yields_1.Attack) > 0,
};
exports.default = exports.civ1MartialLawPolicy;
//# sourceMappingURL=martialLaw.js.map