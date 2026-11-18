"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1MartialLawPolicy = void 0;
// Martial law. Where the rule set numbers its governments' martial law (base-government-terms' `GovernmentTerms`, as
//  Civ2's do: 2 citizens a unit under Communism), the most units it uses and the citizens each keeps content are
//  those. Otherwise Civ1's, as `civ1-city-happiness` has it (its `martialLaw.ts`, v474.05's): under Anarchy, Communism,
//  Despotism or Monarchy, each unit in a city that can attack keeps one of its unhappy citizens content, up to three,
//  once the city's improvements and Wonders have calmed what they can. Which units it uses, and how many citizens are
//  unhappy, are asked of its rules (`City/defence`).
const martialLaw_1 = require("@civ-clone/civ1-city-happiness/martialLaw");
const Yields_1 = require("@civ-clone/core-unit/Yields");
const unitType_1 = require("../Unit/unitType");
const terms_1 = require("../Government/terms");
exports.civ1MartialLawPolicy = {
    limit: (dependencies, city) => {
        const terms = (0, terms_1.cityGovernmentTerm)(dependencies, city, 'martialLaw');
        if (terms !== undefined) {
            return terms.maximumUnits;
        }
        return dependencies.playerGovernmentRegistry
            .getByPlayer(city.player())
            .is(...martialLaw_1.martialLawGovernments)
            ? martialLaw_1.martialLawUnitLimit
            : 0;
    },
    perUnit: (dependencies, city) => { var _a, _b; return (_b = (_a = (0, terms_1.cityGovernmentTerm)(dependencies, city, 'martialLaw')) === null || _a === void 0 ? void 0 : _a.perUnit) !== null && _b !== void 0 ? _b : 1; },
    // As `civ1-city-happiness`'s `keepsMartialLaw` judges a unit: any whose attack isn't 0. Civ2's
    //  (base-government-martial-law's `hasAttack`) is the same.
    wouldUse: (dependencies, UnitType) => (0, unitType_1.default)(dependencies, UnitType, Yields_1.Attack) > 0,
};
exports.default = exports.civ1MartialLawPolicy;
//# sourceMappingURL=martialLaw.js.map