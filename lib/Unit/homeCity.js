"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeUpStation = void 0;
const buildTime_1 = require("../City/buildTime");
// `setHomeCity` is the unit's action from the start of its turn: only used while the unit is still where it was then.
//  Returns whether the city is now the unit's home.
const takeUpStation = (dependencies, knowledge, unit, city, setHomeCity) => {
    if (unit.city() === city) {
        return true;
    }
    if (!setHomeCity ||
        setHomeCity.from() !== unit.tile() ||
        city.tile() !== unit.tile() ||
        city.player() !== unit.player() ||
        (0, buildTime_1.netShields)(city) - knowledge.unitSupport(dependencies, city) <= 0) {
        return false;
    }
    unit.action(setHomeCity);
    return unit.city() === city;
};
exports.takeUpStation = takeUpStation;
exports.default = exports.takeUpStation;
//# sourceMappingURL=homeCity.js.map