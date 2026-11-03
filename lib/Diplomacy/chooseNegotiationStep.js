"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseNegotiationStep = void 0;
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const Terminate_1 = require("@civ-clone/core-diplomacy/Negotiation/Terminate");
// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
const chooseNegotiationStep = (dependencies, player, meta) => {
    var _a;
    const choices = meta.choices(), accept = choices.find((choice) => choice.value() instanceof Accept_1.default), carryOn = choices.find((choice) => !(choice.value() instanceof Terminate_1.default));
    return ((_a = accept !== null && accept !== void 0 ? accept : carryOn) !== null && _a !== void 0 ? _a : choices[0]).value();
};
exports.chooseNegotiationStep = chooseNegotiationStep;
exports.default = exports.chooseNegotiationStep;
//# sourceMappingURL=chooseNegotiationStep.js.map