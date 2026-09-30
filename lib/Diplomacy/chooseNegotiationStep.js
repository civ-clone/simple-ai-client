"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseNegotiationStep = void 0;
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const Decline_1 = require("@civ-clone/core-diplomacy/Proposal/Decline");
const ExchangeKnowledge_1 = require("@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge");
const OfferPeace_1 = require("@civ-clone/library-diplomacy/Proposals/OfferPeace");
const shouldAttack_1 = require("../shouldAttack");
// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
const chooseNegotiationStep = (dependencies, player, meta) => {
    const score = (item) => {
        const aggressive = (0, shouldAttack_1.default)(dependencies, player, item.players().filter((other) => other !== player)[0]);
        if (aggressive) {
            return item instanceof Decline_1.default ? 10 : -1;
        }
        return item instanceof ExchangeKnowledge_1.default
            ? 30
            : item instanceof OfferPeace_1.default
                ? 20
                : item instanceof Accept_1.default
                    ? 10
                    : 0;
    };
    const [topChoice] = meta.choices().sort((actionA, actionB) => {
        return (
        // TODO: This isn't `unknown`...
        score(actionB.value()) -
            score(actionA.value()));
    });
    return topChoice.value();
};
exports.chooseNegotiationStep = chooseNegotiationStep;
exports.default = exports.chooseNegotiationStep;
//# sourceMappingURL=chooseNegotiationStep.js.map