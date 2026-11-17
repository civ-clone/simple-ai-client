"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitSupport = void 0;
// The shields one more unit would cost a city to support. Where the rule set numbers its governments' free units
//  (base-government-terms' `GovernmentTerms`, as Civ2's do: 3 under Monarchy and Communism, 8 under Fundamentalism),
//  those: a shield (or the rule set's cost) once the city supports as many as it does for free. Otherwise Civ1's, by
//  `civ1-city`'s unit support rules (`Rules/City/cost`): under Anarchy and Despotism a city supports as many units as its
//  size for nothing and pays a shield for each one after that; under any other government it pays a shield for every
//  unit. Either way, `NonCombatant` units (Diplomats and Caravans) cost nothing and don't use up a free unit.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const NonCombatant_1 = require("@civ-clone/base-unit-trait-non-combatant/NonCombatant");
const terms_1 = require("../Government/terms");
const traits_1 = require("@civ-clone/core-unit/traits");
const cost_1 = require("@civ-clone/civ1-city/Rules/City/cost");
// `UnitType`, when given, is the unit in question: a `NonCombatant` one costs nothing whatever the city already
//  supports.
const unitSupport = (dependencies, city, UnitType = null) => {
    var _a;
    if (UnitType !== null &&
        (0, traits_1.hasTrait)(UnitType, NonCombatant_1.default, dependencies.ruleRegistry)) {
        return 0;
    }
    const freeUnits = (0, terms_1.cityGovernmentTerm)(dependencies, city, 'freeUnits');
    if (freeUnits !== undefined) {
        return dependencies.unitRegistry.getByCity(city).filter(cost_1.supported).length >=
            freeUnits(dependencies.cityGrowthRegistry.getByCity(city).size())
            ? (_a = (0, terms_1.cityGovernmentTerm)(dependencies, city, 'unitSupportCost')) !== null && _a !== void 0 ? _a : 1
            : 0;
    }
    if (!dependencies.playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Despotism)) {
        return 1;
    }
    return dependencies.unitRegistry.getByCity(city).filter(cost_1.supported).length >=
        dependencies.cityGrowthRegistry.getByCity(city).size()
        ? 1
        : 0;
};
exports.unitSupport = unitSupport;
exports.default = exports.unitSupport;
//# sourceMappingURL=unitSupport.js.map