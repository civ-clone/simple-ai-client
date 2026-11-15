"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetreatToHeal = void 0;
// Generic: a damaged unit rests, or heads for one of its player's cities, to heal (`lib/Unit/retreatToHeal`). Only a
//  unit with damage is handled, and that is asked before anything else is read, so in a ruleset that deals none (Civ1)
//  this strategy never handles a unit.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const retreatToHeal_1 = require("../../lib/Unit/retreatToHeal");
class RetreatToHeal extends AIStrategy_1.default {
    handles(action) {
        return ((0, isUnitAction_1.default)(action) &&
            action.value().damage() > 0 &&
            (0, retreatToHeal_1.healsThisTurn)(this.dependencies(), action.value()));
    }
    attempt(action) {
        return (0, retreatToHeal_1.default)(this.dependencies(), action.player(), this.memoryFor(action.player()), this.knowledge(), action.value());
    }
}
exports.RetreatToHeal = RetreatToHeal;
exports.default = RetreatToHeal;
//# sourceMappingURL=RetreatToHeal.js.map