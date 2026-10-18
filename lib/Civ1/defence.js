"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersKept = exports.defendersWanted = exports.isCapital = exports.attackersNear = exports.threatened = exports.THREAT_CAP = exports.THREAT_RADIUS = void 0;
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Peace_1 = require("@civ-clone/base-diplomacy-declaration-peace/Peace");
// How far from a city an enemy unit counts as a threat to it, and how many such units a city answers with defenders.
exports.THREAT_RADIUS = 3;
exports.THREAT_CAP = 3;
// Whether `player` has a peace treaty with `other`.
const atPeace = (dependencies, player, other) => dependencies.interactionRegistry
    .getByPlayers(player, other)
    .some((interaction) => interaction instanceof Peace_1.default && interaction.active());
// A unit of a player `city`'s owner has no peace treaty with.
const enemyOf = (dependencies, city) => (unit) => unit.player() !== city.player() &&
    !atPeace(dependencies, city.player(), unit.player());
// Whether an enemy unit is on a tile next to `city`. v474.05 counts any other player's unit; a treaty partner's
//  explorer passing by isn't counted here, as it isn't a threat.
const threatened = (dependencies, city) => city
    .tile()
    .getNeighbours()
    .some((tile) => dependencies.unitRegistry
    .getByTile(tile)
    .some(enemyOf(dependencies, city)));
exports.threatened = threatened;
// How many enemy units that can attack are within `THREAT_RADIUS` of `city`.
const attackersNear = (dependencies, city) => city
    .tile()
    .getSurroundingArea(exports.THREAT_RADIUS)
    .entries()
    .reduce((total, tile) => total +
    dependencies.unitRegistry
        .getByTile(tile)
        .filter((unit) => enemyOf(dependencies, city)(unit) && unit.attack().value() > 0).length, 0);
exports.attackersNear = attackersNear;
const isCapital = (dependencies, city) => dependencies.cityImprovementRegistry
    .getByCity(city)
    .some((improvement) => improvement instanceof CityImprovements_1.Palace);
exports.isCapital = isCapital;
const sizeOf = (dependencies, city) => dependencies.cityGrowthRegistry.getByCity(city).size();
const defendersWanted = (dependencies, city) => Math.max(1, Math.floor(sizeOf(dependencies, city) / 4) +
    ((0, exports.threatened)(dependencies, city) ? 1 : 0), Math.min((0, exports.attackersNear)(dependencies, city), exports.THREAT_CAP));
exports.defendersWanted = defendersWanted;
const defendersKept = (dependencies, city) => Math.max((0, exports.defendersWanted)(dependencies, city), Math.floor(sizeOf(dependencies, city) / ((0, exports.threatened)(dependencies, city) ? 3 : 4)) + 1);
exports.defendersKept = defendersKept;
//# sourceMappingURL=defence.js.map