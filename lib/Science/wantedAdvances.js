"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scienceStopped = exports.wantedAdvances = void 0;
const WantedAdvances_1 = require("@civ-clone/base-leader-personality/Rules/Player/WantedAdvances");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
// Every advance `player`'s leader wants, each once, or `null` if the ruleset says nothing about it.
const wantedAdvances = (dependencies, player) => (0, combine_1.union)(dependencies.ruleRegistry, WantedAdvances_1.default, player);
exports.wantedAdvances = wantedAdvances;
// Whether `player` has stopped researching for good: it has every advance its leader wants. A player with no research,
//  or whose ruleset says nothing about what its leader wants, never has.
const scienceStopped = (dependencies, player) => {
    let playerResearch;
    try {
        playerResearch = dependencies.playerResearchRegistry.getByPlayer(player);
    }
    catch (e) {
        return false;
    }
    const wanted = (0, exports.wantedAdvances)(dependencies, player);
    return (wanted !== null &&
        wanted.every((AdvanceType) => playerResearch.completed(AdvanceType)));
};
exports.scienceStopped = scienceStopped;
exports.default = exports.wantedAdvances;
//# sourceMappingURL=wantedAdvances.js.map