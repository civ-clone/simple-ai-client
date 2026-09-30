"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipUnit = exports.noOrders = void 0;
const Actions_1 = require("@civ-clone/library-unit/Actions");
const noOrders = (dependencies, unit) => {
    unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit, dependencies.ruleRegistry));
};
exports.noOrders = noOrders;
const skipUnit = (dependencies, unit) => {
    try {
        (0, exports.noOrders)(dependencies, unit);
    }
    catch (e) {
        // `NoOrders` is only a fallback here, so if it fails too, make sure the unit stops being a mandatory action.
        unit.moves().set(0);
        unit.setActive(false);
    }
};
exports.skipUnit = skipUnit;
//# sourceMappingURL=orders.js.map