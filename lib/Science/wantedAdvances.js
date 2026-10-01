"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scienceStopped = exports.wantedAdvances = void 0;
const traits_1 = require("../traits");
// Every advance `player`'s leader wants, each once: `always`, then what each of its traits adds.
const wantedAdvances = (dependencies, player, policy) => {
    const traits = (0, traits_1.leaderTraits)(dependencies, player);
    return [
        ...new Set([
            ...policy.always,
            ...policy.byTrait.flatMap(([TraitType, advances]) => traits.some((trait) => trait instanceof TraitType)
                ? advances
                : []),
        ]),
    ];
};
exports.wantedAdvances = wantedAdvances;
// Whether `player` has stopped researching for good: it has every advance its leader wants. A player with no research
//  never has.
const scienceStopped = (dependencies, player, policy) => {
    let playerResearch;
    try {
        playerResearch = dependencies.playerResearchRegistry.getByPlayer(player);
    }
    catch (e) {
        return false;
    }
    return (0, exports.wantedAdvances)(dependencies, player, policy).every((AdvanceType) => playerResearch.completed(AdvanceType));
};
exports.scienceStopped = scienceStopped;
exports.default = exports.wantedAdvances;
//# sourceMappingURL=wantedAdvances.js.map