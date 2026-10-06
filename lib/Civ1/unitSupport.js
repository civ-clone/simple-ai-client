"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitSupport = void 0;
// Civ1: the shields one more unit would cost a city to support, by `civ1-city`'s unit support rules
//  (`Rules/City/cost`): under Anarchy and Despotism a city supports as many units as its size for nothing and pays a
//  shield for each one after that; under any other government it pays a shield for every unit. Those rules charge for
//  every aircraft, ship, worker and `Fortifiable` unit except `Diplomatic` ones (Diplomats and Caravans), which cost
//  nothing and don't use up a free unit.
const Types_1 = require("@civ-clone/library-unit/Types");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const supported = (unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval, Types_1.Worker].some((UnitType) => unit instanceof UnitType) && !(unit instanceof Types_1.Diplomatic);
const unitSupport = (dependencies, city) => {
    if (!dependencies.playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Despotism)) {
        return 1;
    }
    return dependencies.unitRegistry.getByCity(city).filter(supported).length >=
        dependencies.cityGrowthRegistry.getByCity(city).size()
        ? 1
        : 0;
};
exports.unitSupport = unitSupport;
exports.default = exports.unitSupport;
//# sourceMappingURL=unitSupport.js.map