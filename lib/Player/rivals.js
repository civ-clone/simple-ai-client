"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rivalIsOverseas = exports.rivalOf = exports.knownEnemyCities = exports.confidentPower = exports.powerOfPlayer = exports.powerOf = exports.isEnemy = exports.atPeace = void 0;
// Generic: the players a computer player might fight (civ-clone/web-renderer#424, #374). An enemy is a player it has
//  no peace treaty with. A rival is an enemy it's stronger than, by `core-power`'s `MilitaryStrength` with its leader's
//  `AttackConfidence` on its side, that has a city it knows of and could reach: on a landmass where it has a city, or
//  overseas, from a port it could ferry units from (`lib/Unit/overseas`).
const AttackConfidence_1 = require("@civ-clone/base-leader-personality/Rules/Player/AttackConfidence");
const Peace_1 = require("@civ-clone/base-diplomacy-declaration-peace/Peace");
const overseas_1 = require("../Unit/overseas");
const explorers_1 = require("../City/explorers");
const strength_1 = require("@civ-clone/core-power/lib/strength");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
const atPeace = (dependencies, player, other) => dependencies.interactionRegistry
    .getByPlayers(player, other)
    .some((interaction) => interaction instanceof Peace_1.default && interaction.active());
exports.atPeace = atPeace;
const isEnemy = (dependencies, player, other) => other !== player && !(0, exports.atPeace)(dependencies, player, other);
exports.isEnemy = isEnemy;
// The power of `units`, attack and defence together.
const powerOf = (dependencies, units) => (0, strength_1.militaryPower)(units, dependencies.ruleRegistry);
exports.powerOf = powerOf;
const powerOfPlayer = (dependencies, player) => (0, exports.powerOf)(dependencies, dependencies.unitRegistry.getByPlayer(player));
exports.powerOfPlayer = powerOfPlayer;
// `player`'s power as its leader sees it against `other`'s: `AttackConfidence` makes a bold leader feel the stronger.
const confidentPower = (dependencies, player, other, power = (0, exports.powerOfPlayer)(dependencies, player)) => power * (0, combine_1.product)(dependencies.ruleRegistry, AttackConfidence_1.default, player, other);
exports.confidentPower = confidentPower;
// The enemy cities `player` knows of.
const knownEnemyCities = (dependencies, player) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    return dependencies.cityRegistry
        .entries()
        .filter((city) => (0, exports.isEnemy)(dependencies, player, city.player()) &&
        playerWorld.includes(city.tile()));
};
exports.knownEnemyCities = knownEnemyCities;
const rivals = new WeakMap();
// `player`'s rival, its campaign's one enemy at a time (Dom, on civ-clone/web-renderer#374): kept while it's still a
//  rival and no rival next door has turned up, and otherwise the nearest, one with a city on a landmass where `player`
//  has one before any overseas.
//  Worked out once a turn, from the game as it is, so nothing needs saving.
const rivalOf = (dependencies, player) => rivalryOf(dependencies, player).rival;
exports.rivalOf = rivalOf;
// Whether `player`'s rival is only overseas: it has no city on a landmass where `player` has one.
const rivalIsOverseas = (dependencies, player) => rivalryOf(dependencies, player).overseas;
exports.rivalIsOverseas = rivalIsOverseas;
const rivalryOf = (dependencies, player) => {
    var _a, _b;
    const turn = dependencies.turn.value(), known = rivals.get(player);
    if (known && known.turn === turn) {
        return known;
    }
    const cities = dependencies.cityRegistry.getByPlayer(player), power = (0, exports.powerOfPlayer)(dependencies, player), landmasses = cities.map((city) => (0, explorers_1.continentOf)(turn, city.tile())), isNeighbour = (city) => landmasses.some((landmass) => landmass.has(city.tile())), canFerry = power > 0 &&
        cities.some((city) => (0, overseas_1.canFerryFromLandmassOf)(dependencies, player, city.tile())), weaker = new Map(), isWeaker = (other) => {
        if (!weaker.has(other)) {
            weaker.set(other, (0, exports.powerOfPlayer)(dependencies, other) <
                (0, exports.confidentPower)(dependencies, player, other, power));
        }
        return weaker.get(other);
    }, distance = (city) => Math.min(...cities.map((own) => own.tile().distanceFrom(city.tile()))), targets = power > 0 && cities.length > 0
        ? (0, exports.knownEnemyCities)(dependencies, player).filter((city) => (canFerry || isNeighbour(city)) && isWeaker(city.player()))
        : [], previous = (_a = known === null || known === void 0 ? void 0 : known.rival) !== null && _a !== void 0 ? _a : null, [nearest] = [...targets].sort((a, b) => Number(isNeighbour(b)) - Number(isNeighbour(a)) ||
        distance(a) - distance(b)), 
    // An overseas rival gives way to one next door.
    keep = targets.some((city) => city.player() === previous &&
        (isNeighbour(city) || !isNeighbour(nearest))), rival = keep ? previous : (_b = nearest === null || nearest === void 0 ? void 0 : nearest.player()) !== null && _b !== void 0 ? _b : null, rivalry = {
        turn,
        rival,
        overseas: rival !== null &&
            !targets.some((city) => city.player() === rival && isNeighbour(city)),
    };
    rivals.set(player, rivalry);
    return rivalry;
};
exports.default = exports.rivalOf;
//# sourceMappingURL=rivals.js.map