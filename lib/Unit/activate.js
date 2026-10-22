"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// Generic: wakes a unit by the order its ruleset offers for it (`Activate`, civ-clone/web-renderer#160), as a player
//  does, or, where none is offered, as `Unit#activate` does.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const activate = (unit) => {
    const [order] = unit
        .actions(unit.tile())
        .filter((action) => action instanceof Actions_1.Activate);
    if (order) {
        unit.action(order);
        return;
    }
    unit.activate();
};
exports.activate = activate;
exports.default = exports.activate;
//# sourceMappingURL=activate.js.map