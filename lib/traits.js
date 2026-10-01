"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ideology = exports.policy = exports.mood = exports.leaderTraits = void 0;
// Generic: a leader's personality on the three axes v474.05's AI reads, each −1, 0 or 1, as OpenCivOne names them:
//  - Mood: Friendly (−1), normal or Aggressive (1), from `Aggression`;
//  - Policy: Perfectionist (−1), normal or Expansionist (1), from `Development`;
//  - Ideology: Militaristic (−1), normal or Civilized (1), from `Militarism`, which is the other way round: Civilized is
//    `Militarism` 0.
// Each trait's value is 0, 0.5 or 1, and becomes −1, 0 or 1.
const Aggression_1 = require("@civ-clone/base-leader-trait-aggression/Aggression");
const Development_1 = require("@civ-clone/base-leader-trait-development/Development");
const Militarism_1 = require("@civ-clone/base-leader-trait-militarism/Militarism");
// The class of the player's leader, or `null` for a player with no civilization or no leader yet.
const leaderOf = (player) => {
    var _a, _b;
    try {
        return (_b = (_a = player.civilization().leader()) === null || _a === void 0 ? void 0 : _a.sourceClass()) !== null && _b !== void 0 ? _b : null;
    }
    catch (e) {
        // `Player#civilization` throws until one is set.
        return null;
    }
};
// The traits of `player`'s leader, looked up by its class in the registry when asked rather than taken from the
//  leader, which keeps the ones registered when it was created.
const leaderTraits = (dependencies, player) => {
    const LeaderType = leaderOf(player);
    return LeaderType === null
        ? []
        : dependencies.traitRegistry.getByLeader(LeaderType);
};
exports.leaderTraits = leaderTraits;
// −1, 0 or 1 from the leader's `TraitType` trait, 0 if it has none.
const axis = (dependencies, player, TraitType) => {
    const trait = (0, exports.leaderTraits)(dependencies, player).find((trait) => trait instanceof TraitType);
    return trait === undefined
        ? 0
        : Math.max(-1, Math.min(1, Math.round(trait.value() * 2 - 1)));
};
const mood = (dependencies, player) => axis(dependencies, player, Aggression_1.default);
exports.mood = mood;
const policy = (dependencies, player) => axis(dependencies, player, Development_1.default);
exports.policy = policy;
// `|| 0` so a normal leader is 0, not −0.
const ideology = (dependencies, player) => -axis(dependencies, player, Militarism_1.default) || 0;
exports.ideology = ideology;
//# sourceMappingURL=traits.js.map