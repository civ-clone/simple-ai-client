"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explorerShipFor = exports.reachesSeaToExplore = void 0;
// Generic: the ship a city should build to explore the sea with, if any (civ-clone/web-renderer#208). A player with
//  more than one city keeps one ship at a time for this, built in a city that has its defenders and is on water leading
//  to sea it hasn't explored. Transports and their escorts are another matter.
const defence_1 = require("./defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const isShip = (item) => Object.prototype.isPrototypeOf.call(Types_1.Naval, item);
// Whether the water beside `city`, as far as the player knows it, reaches a tile on the edge of what it has explored.
//  Gives up after `limit` tiles, as a lake would long before.
const reachesSeaToExplore = (dependencies, player, targets, city, limit = 1000) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), toExplore = new Set(targets.seaTilesToExplore), seen = new Set(), queue = city
        .tile()
        .getNeighbours()
        .filter((tile) => tile.isWater());
    while (queue.length > 0 && seen.size < limit) {
        const tile = queue.shift();
        if (seen.has(tile) || !playerWorld.includes(tile)) {
            continue;
        }
        if (toExplore.has(tile)) {
            return true;
        }
        seen.add(tile);
        queue.push(...tile
            .getNeighbours()
            .filter((neighbour) => neighbour.isWater() && !seen.has(neighbour)));
    }
    return false;
};
exports.reachesSeaToExplore = reachesSeaToExplore;
// The cheapest ship `city` can build, if the player has another city, no ship and none on order, the city has its
//  defenders, and it can reach sea to explore. Otherwise `null`. A player's only city has better things to build.
const explorerShipFor = (dependencies, player, targets, city) => {
    const [ship] = dependencies.cityBuildRegistry
        .getByCity(city)
        .available()
        .filter((buildItem) => isShip(buildItem.item()))
        .sort((a, b) => a.cost().value() - b.cost().value());
    if (!ship ||
        dependencies.cityRegistry.getByPlayer(player).length < 2 ||
        dependencies.unitRegistry
            .getByPlayer(player)
            .some((unit) => unit instanceof Types_1.Naval) ||
        dependencies.cityRegistry
            .getByPlayer(player)
            .some((other) => {
            const building = dependencies.cityBuildRegistry
                .getByCity(other)
                .building();
            return building !== null && isShip(building.item());
        }) ||
        (0, defence_1.defendersIn)(dependencies, city).length <
            (0, defence_1.defendersWanted)(dependencies, city) ||
        !(0, exports.reachesSeaToExplore)(dependencies, player, targets, city)) {
        return null;
    }
    return ship.item();
};
exports.explorerShipFor = explorerShipFor;
exports.default = exports.explorerShipFor;
//# sourceMappingURL=explorerShip.js.map