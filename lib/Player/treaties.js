"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alliedCityAt = exports.isAlly = exports.hasTreaty = void 0;
// Generic: how far a computer player's treaties with another player go, from base-diplomacy's `treatyLevel`. Civ1 has
//  only peace; Civ2 adds the ceasefire below it and the alliance above it (an alliance is also a peace).
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
// Whether `player` and `other` have a treaty: a ceasefire, a peace or an alliance.
const hasTreaty = (dependencies, player, other) => (0, treatyLevel_1.hasTreatyLevel)(dependencies, player, other, treatyLevel_1.TreatyLevel.Ceasefire);
exports.hasTreaty = hasTreaty;
// Whether `other` is `player`'s ally.
const isAlly = (dependencies, player, other) => other !== player &&
    (0, treatyLevel_1.hasTreatyLevel)(dependencies, player, other, treatyLevel_1.TreatyLevel.Alliance);
exports.isAlly = isAlly;
// The city on `tile`, if it's one of `player`'s allies'. Under Civ2's rules a unit can't go into an ally's city: moving
//  onto it repairs the unit there and ends its turn instead (civ2-unit's `allied-repair`).
const alliedCityAt = (dependencies, player, tile) => {
    const city = dependencies.cityRegistry.getByTile(tile);
    return city !== null && (0, exports.isAlly)(dependencies, player, city.player())
        ? city
        : null;
};
exports.alliedCityAt = alliedCityAt;
//# sourceMappingURL=treaties.js.map