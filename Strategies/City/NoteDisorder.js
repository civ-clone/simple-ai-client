"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteDisorder = void 0;
// Generic: at the start of the player's turn (`BeforeTurn`), before any other strategy has changed anything (a revolution,
//  its workers), lets the ruleset's `DisorderPolicy` note what it needs of the player's cities (`turnStart`), for
//  `PreventDisorder` at the end of the turn. Registered first for that reason.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
class NoteDisorder extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return action instanceof BeforeTurn_1.default;
    }
    attempt(action) {
        var _a, _b;
        (_b = (_a = this._policy).turnStart) === null || _b === void 0 ? void 0 : _b.call(_a, this.dependencies(), action.player());
        return true;
    }
}
exports.NoteDisorder = NoteDisorder;
exports.default = NoteDisorder;
//# sourceMappingURL=NoteDisorder.js.map