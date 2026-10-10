"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseResearch = void 0;
const AdvanceGrade_1 = require("@civ-clone/base-leader-personality/Rules/Player/AdvanceGrade");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
// v474.05's pick (OpenCivOne `Segment_1ade.cs` `F0_1ade_1584`): each advance draws a whole number below 4 × its grade,
//  and the first highest draw wins, so a grade of 0 wins only if every other draw is 0 too. One draw per advance.
const byGrade = (dependencies, playerResearch, choices) => {
    let best = -1, chosen = choices[0];
    choices.forEach((AdvanceType) => {
        const grade = (0, combine_1.sum)(dependencies.ruleRegistry, AdvanceGrade_1.default, playerResearch.player(), AdvanceType), draw = Math.floor(dependencies.randomNumberGenerator() * Math.max(0, grade) * 4);
        if (draw > best) {
            best = draw;
            chosen = AdvanceType;
        }
    });
    return chosen;
};
// Chooses among the `wanted` advances available or, if there are none, among everything available, and only draws from
//  the random number generator when there's something to choose from: once per advance by grade, or once at random.
//  Once a player has every advance it wants, and so has stopped researching, that's everything available: the engine
//  still asks it to choose, but its science rate is 0, so nothing comes of it.
const chooseResearch = (dependencies, playerResearch, wanted = []) => {
    const available = playerResearch.available(), availableWanted = available.filter((AdvanceType) => wanted.includes(AdvanceType)), choices = availableWanted.length > 0 ? availableWanted : available;
    if (choices.length === 0) {
        return;
    }
    playerResearch.research(dependencies.ruleRegistry.get(AdvanceGrade_1.default).length > 0
        ? byGrade(dependencies, playerResearch, choices)
        : choices[Math.floor(choices.length * dependencies.randomNumberGenerator())]);
};
exports.chooseResearch = chooseResearch;
exports.default = exports.chooseResearch;
//# sourceMappingURL=chooseResearch.js.map