"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triremeCanReturn = void 0;
// Civ1: a Trireme (`CoastBound`) is lost at sea half the time when a move leaves it with no moves off the coast
//  (`civ1-unit`'s `trireme-lost-at-sea` rule), and whether a Trireme is still safe after an action.
const CoastBound_1 = require("@civ-clone/base-unit-trait-coast-bound/CoastBound");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
// A Trireme moves off the coast, or acts there (an attack costs a move too), only with a move to spare afterwards and
//  next to a coastal tile it can spend it reaching. Every move at sea costs 1, so it can always end its turn on the
//  coast.
const triremeCanReturn = (dependencies, player, unit, action) => {
    if (!unit.hasTrait(CoastBound_1.default)) {
        return true;
    }
    const to = action instanceof Actions_1.Move ? action.to() : unit.tile();
    return (to.isCoast() ||
        (unit.moves().value() > 1 &&
            to
                .getNeighbours()
                .some((tile) => tile.isWater() && tile.isCoast())));
};
exports.triremeCanReturn = triremeCanReturn;
exports.default = exports.triremeCanReturn;
//# sourceMappingURL=trireme.js.map