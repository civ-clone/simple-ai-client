"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegotiationAnswers = void 0;
// Generic: answers each step of a negotiation: declines when it's the stronger side, otherwise prefers knowledge, then
//  peace. Every other `chooseFromList` falls through to the client's random pick.
const AIStrategy_1 = require("../lib/AIStrategy");
const ChooseFromList_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/ChooseFromList");
const chooseNegotiationStep_1 = require("../../lib/Diplomacy/chooseNegotiationStep");
class NegotiationAnswers extends AIStrategy_1.default {
    handles(action) {
        return (action instanceof ChooseFromList_1.default &&
            action.value().meta().key() === 'negotiation.next-step');
    }
    attempt(action) {
        const data = action.value();
        data.choose((0, chooseNegotiationStep_1.default)(this.dependencies(), action.player(), data.meta()));
        return true;
    }
}
exports.NegotiationAnswers = NegotiationAnswers;
exports.default = NegotiationAnswers;
//# sourceMappingURL=NegotiationAnswers.js.map