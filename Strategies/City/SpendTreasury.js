"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendTreasury = void 0;
// Generic: at the end of the player's turn, once its cities are calm and its rates are set, spends its treasury over a
//  reserve on finishing what its cities are building (`lib/City/spendTreasury`), with the ruleset's `SpendingPolicy`.
const spendTreasury_1 = require("../../lib/City/spendTreasury");
const AfterTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn");
const AIStrategy_1 = require("../lib/AIStrategy");
class SpendTreasury extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return action instanceof AfterTurn_1.default;
    }
    attempt(action) {
        (0, spendTreasury_1.default)(this.dependencies(), this.knowledge(), this._policy, action.player());
        return true;
    }
}
exports.SpendTreasury = SpendTreasury;
exports.default = SpendTreasury;
//# sourceMappingURL=SpendTreasury.js.map