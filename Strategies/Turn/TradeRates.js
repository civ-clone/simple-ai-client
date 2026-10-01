"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeRates = void 0;
// Generic: at the end of the player's turn, once `PreventDisorder` has calmed its cities, sets its tax, luxury and
//  science rates (`lib/Turn/adjustTradeRates`), with the ruleset's `DisorderPolicy` and `TradeRatePolicy`.
const adjustTradeRates_1 = require("../../lib/Turn/adjustTradeRates");
const AfterTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn");
const AIStrategy_1 = require("../lib/AIStrategy");
class TradeRates extends AIStrategy_1.default {
    constructor(dependencies, knowledge, disorderPolicy, policy) {
        super(dependencies, knowledge);
        this._disorderPolicy = disorderPolicy;
        this._policy = policy;
    }
    handles(action) {
        return action instanceof AfterTurn_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, adjustTradeRates_1.default)(this.dependencies(), player, this.memoryFor(player), this.knowledge(), this._disorderPolicy, this._policy);
        return true;
    }
}
exports.TradeRates = TradeRates;
exports.default = TradeRates;
//# sourceMappingURL=TradeRates.js.map