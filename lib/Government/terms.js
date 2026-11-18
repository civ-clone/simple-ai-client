"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityGovernmentTerm = exports.playerGovernmentTerm = exports.governmentOf = void 0;
// Generic: what the player's government does, as the rule set numbers it (base-government-terms' `GovernmentTerms`),
//  for the policies that otherwise use Civ1's numbers. Each reader answers `undefined` where the rule set gives no such
//  term (Civ1 registers none), so its caller keeps its own.
const terms_1 = require("@civ-clone/base-government-terms/lib/terms");
// The class of `player`'s government now, or `null` with none (or no record of one).
const governmentOf = (dependencies, player) => {
    try {
        return (0, terms_1.currentGovernment)(dependencies.playerGovernmentRegistry.getByPlayer(player));
    }
    catch (e) {
        return null;
    }
};
exports.governmentOf = governmentOf;
// The term `key` of the government `player` has now, or `undefined`.
const playerGovernmentTerm = (dependencies, player, key) => {
    const GovernmentType = (0, exports.governmentOf)(dependencies, player);
    return GovernmentType === null
        ? undefined
        : (0, terms_1.governmentTerm)(dependencies.ruleRegistry, GovernmentType, key);
};
exports.playerGovernmentTerm = playerGovernmentTerm;
// The term `key` of the government `city`'s player has now, or `undefined`.
const cityGovernmentTerm = (dependencies, city, key) => (0, exports.playerGovernmentTerm)(dependencies, city.player(), key);
exports.cityGovernmentTerm = cityGovernmentTerm;
//# sourceMappingURL=terms.js.map