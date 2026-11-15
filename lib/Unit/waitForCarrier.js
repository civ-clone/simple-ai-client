"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForCarrier = void 0;
const carriesUnits_1 = require("./carriesUnits");
// Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn. Returns
//  whether `unit` was told to wait.
const waitForCarrier = (dependencies, player, knowledge, unit) => {
    if (!unit.waiting() &&
        knowledge.isAircraft(dependencies, unit) &&
        dependencies.unitRegistry
            .getByPlayer(player)
            .some((carrier) => (0, carriesUnits_1.default)(carrier) &&
            carrier.canStow(unit) &&
            carrier.active() &&
            carrier.moves().value() > 0)) {
        unit.setWaiting();
        return true;
    }
    return false;
};
exports.waitForCarrier = waitForCarrier;
exports.default = exports.waitForCarrier;
//# sourceMappingURL=waitForCarrier.js.map