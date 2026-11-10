"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseNegotiationStep = exports.MOST_NEGOTIATION_STEPS = void 0;
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const Terminate_1 = require("@civ-clone/core-diplomacy/Negotiation/Terminate");
// The steps a player answers in one negotiation before it leaves when it can: far more than any meeting needs (in
//  1,752 meetings between computer players under Civ1's rules, each answered two; civ-clone/web-renderer#877).
exports.MOST_NEGOTIATION_STEPS = 100;
// Steps answered so far, by negotiation (the choice's `data`), then by player. Weak, so a negotiation's count goes
//  with it.
const answered = new WeakMap();
// How many steps `player` has answered in `negotiation`, counting this one. Without a negotiation to tell this one
//  from another, there's nothing to count.
const count = (negotiation, player) => {
    var _a, _b;
    if (typeof negotiation !== 'object' || negotiation === null) {
        return 0;
    }
    const byPlayer = (_a = answered.get(negotiation)) !== null && _a !== void 0 ? _a : new Map(), steps = ((_b = byPlayer.get(player)) !== null && _b !== void 0 ? _b : 0) + 1;
    byPlayer.set(player, steps);
    answered.set(negotiation, byPlayer);
    return steps;
};
// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
const chooseNegotiationStep = (dependencies, player, meta) => {
    var _a;
    const choices = meta.choices(), leave = choices.find((choice) => choice.value() instanceof Terminate_1.default);
    if (count(meta.data(), player) > exports.MOST_NEGOTIATION_STEPS && leave) {
        return leave.value();
    }
    const accept = choices.find((choice) => choice.value() instanceof Accept_1.default), carryOn = choices.find((choice) => !(choice.value() instanceof Terminate_1.default));
    return ((_a = accept !== null && accept !== void 0 ? accept : carryOn) !== null && _a !== void 0 ? _a : choices[0]).value();
};
exports.chooseNegotiationStep = chooseNegotiationStep;
exports.default = exports.chooseNegotiationStep;
//# sourceMappingURL=chooseNegotiationStep.js.map