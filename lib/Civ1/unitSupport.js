"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitSupport = void 0;
// Civ1: the shields one more unit would cost a city to support, by `civ1-city`'s unit support rules
//  (`Rules/City/cost`): under Anarchy and Despotism a city supports as many units as its size for nothing and pays a
//  shield for each one after that; under any other government it pays a shield for every unit. Those rules charge for
//  every unit except `NonCombatant` ones (Diplomats and Caravans), which cost nothing and don't use up a free unit.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const NonCombatant_1 = require("@civ-clone/base-unit-trait-non-combatant/NonCombatant");
const traits_1 = require("@civ-clone/core-unit/traits");
const cost_1 = require("@civ-clone/civ1-city/Rules/City/cost");
// `UnitType`, when given, is the unit in question: a `NonCombatant` one costs nothing whatever the city already
//  supports.
const unitSupport = (dependencies, city, UnitType = null) => {
    if (UnitType !== null &&
        (0, traits_1.hasTrait)(UnitType, NonCombatant_1.default, dependencies.ruleRegistry)) {
        return 0;
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