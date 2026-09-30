"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForCarrier = void 0;
const Types_1 = require("@civ-clone/library-unit/Types");
// Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn. Returns
//  whether `unit` was told to wait.
const waitForCarrier = (dependencies, player, knowledge, unit) => {
    if (!unit.waiting() &&
        knowledge.isAircraft(dependencies, unit) &&
        dependencies.unitRegistry
            .getByPlayer(player)
            .some((carrier) => carrier instanceof Types_1.NavalTransport &&
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