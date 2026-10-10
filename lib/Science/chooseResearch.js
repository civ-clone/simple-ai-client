"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseResearch = void 0;
const AdvanceGrade_1 = require("@civ-clone/base-leader-personality/Rules/Player/AdvanceGrade");
// Each advance's grade, the `AdvanceGrade` rules that apply to it added together, or `null` for an advance no rule
//  applies to.
const grades = (dependencies, player, choices) => choices.map((AdvanceType) => {
    const matched = dependencies.ruleRegistry.process(AdvanceGrade_1.default, player, AdvanceType);
    return matched.length === 0
        ? null
        : matched.reduce((total, grade) => total + grade, 0);
});
// v474.05's pick (OpenCivOne `Segment_1ade.cs` `F0_1ade_1584`): each advance draws a whole number below 4 × its grade,
//  and the first highest draw wins, so a grade of 0 (or none) wins only if every other draw is 0 too. One draw per
//  advance.
const byGrade = (dependencies, choices, gradeOf) => {
    let best = -1, chosen = choices[0];
    choices.forEach((AdvanceType, index) => {
        var _a;
        const draw = Math.floor(dependencies.randomNumberGenerator() *
            Math.max(0, (_a = gradeOf[index]) !== null && _a !== void 0 ? _a : 0) *
            4);
        if (draw > best) {
            best = draw;
            chosen = AdvanceType;
        }
    });
    return chosen;
};
// Chooses among the `wanted` advances available or, if there are none, among everything available, and only draws from
//  the random number generator when there's something to choose from: once per advance by grade, or once at random
//  when no `AdvanceGrade` rule applies to the player and any of them, so a rule for one leader's trait leaves the
//  others' choices as they were. Once a player has every advance it wants, and so has stopped researching, that's
//  everything available: the engine still asks it to choose, but its science rate is 0, so nothing comes of it.
const chooseResearch = (dependencies, playerResearch, wanted = []) => {
    const available = playerResearch.available(), availableWanted = available.filter((AdvanceType) => wanted.includes(AdvanceType)), choices = availableWanted.length > 0 ? availableWanted : available;
    if (choices.length === 0) {
        return;
    }
    const gradeOf = grades(dependencies, playerResearch.player(), choices);
    playerResearch.research(gradeOf.some((grade) => grade !== null)
        ? byGrade(dependencies, choices, gradeOf)
        : choices[Math.floor(choices.length * dependencies.randomNumberGenerator())]);
};
exports.chooseResearch = chooseResearch;
exports.default = exports.chooseResearch;
//# sourceMappingURL=chooseResearch.js.map