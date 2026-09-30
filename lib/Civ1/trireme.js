"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triremeCanReturn = void 0;
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const Units_1 = require("@civ-clone/civ1-unit/Units");
// A Trireme moves off the coast, or acts there (an attack costs a move too), only with a move to spare afterwards and
//  next to a coastal tile it can spend it reaching. Every move at sea costs 1, so it can always end its turn on the
//  coast.
const triremeCanReturn = (dependencies, player, unit, action) => {
    if (!(unit instanceof Units_1.Trireme)) {
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