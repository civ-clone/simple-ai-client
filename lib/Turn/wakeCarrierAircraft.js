"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wakeCarrierAircraft = void 0;
const Types_1 = require("@civ-clone/library-unit/Types");
// An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
const wakeCarrierAircraft = (dependencies, player, knowledge) => dependencies.unitRegistry
    .getByPlayer(player)
    .flatMap((unit) => unit instanceof Types_1.NavalTransport && !unit.destroyed() ? unit.cargo() : [])
    .filter((unit) => knowledge.isAircraft(dependencies, unit) && !unit.active())
    .forEach((aircraft) => {
    aircraft.setBusy();
    aircraft.setActive();
});
exports.wakeCarrierAircraft = wakeCarrierAircraft;
exports.default = exports.wakeCarrierAircraft;
//# sourceMappingURL=wakeCarrierAircraft.js.map