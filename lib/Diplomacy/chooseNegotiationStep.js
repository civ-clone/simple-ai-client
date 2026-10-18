"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseNegotiationStep = void 0;
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
const chooseNegotiationStep = (dependencies, player, meta) => {
    const choices = meta.choices(), accept = choices.find((choice) => choice.value() instanceof Accept_1.default);
    return (accept !== null && accept !== void 0 ? accept : choices[0]).value();
};
exports.chooseNegotiationStep = chooseNegotiationStep;
exports.default = exports.chooseNegotiationStep;
//# sourceMappingURL=chooseNegotiationStep.js.map