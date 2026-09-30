"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carriersFor = void 0;
const Types_1 = require("@civ-clone/library-unit/Types");
// Our `Carrier`s that `unit` could land on. One it's already aboard counts even when full: taking off frees its slot.
const carriersFor = (dependencies, player, unit) => dependencies.unitRegistry
    .getByPlayer(player)
    .filter((tileUnit) => tileUnit instanceof Types_1.NavalTransport &&
    !tileUnit.destroyed() &&
    (tileUnit.hasCapacity() || tileUnit.cargo().includes(unit)) &&
    tileUnit.canStow(unit));
exports.carriersFor = carriersFor;
exports.default = exports.carriersFor;
//# sourceMappingURL=carriersFor.js.map