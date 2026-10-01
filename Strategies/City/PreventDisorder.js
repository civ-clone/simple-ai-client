"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreventDisorder = void 0;
// Generic: at the end of the player's turn, once its units have moved, keeps its cities out of civil disorder
//  (`lib/City/disorder`), with the ruleset's `DisorderPolicy`.
const disorder_1 = require("../../lib/City/disorder");
const AfterTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn");
const AIStrategy_1 = require("../lib/AIStrategy");
class PreventDisorder extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return action instanceof AfterTurn_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, disorder_1.default)(this.dependencies(), player, this.memoryFor(player), this.knowledge(), this._policy);
        return true;
    }
}
exports.PreventDisorder = PreventDisorder;
exports.default = PreventDisorder;
//# sourceMappingURL=PreventDisorder.js.map