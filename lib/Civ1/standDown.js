"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1StandDownPolicy = exports.DISBAND_AT_NET_SHIELDS = void 0;
const Yields_1 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
// Net shields, after unit support, at or below which an idle unit the city pays for is disbanded.
exports.DISBAND_AT_NET_SHIELDS = 0;
exports.civ1StandDownPolicy = {
    disband: (dependencies, unit) => {
        const city = unit.city();
        if (!city) {
            return false;
        }
        const yields = city.yields();
        return (yields.some((cityYield) => cityYield instanceof Yields_1.UnitSupportProduction &&
            cityYield.unit() === unit) && (0, reduceYields_1.reduceYield)(yields, Yields_1.Production) <= exports.DISBAND_AT_NET_SHIELDS);
    },
};
exports.default = exports.civ1StandDownPolicy;
//# sourceMappingURL=standDown.js.map