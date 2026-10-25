"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ferryShipFor = exports.ferryWait = exports.explorerShipFor = exports.explorerShipTurns = exports.reachesSeaToExplore = exports.isOnSea = void 0;
// Generic: the ship a city should build to explore the sea with, if any (civ-clone/web-renderer#208). A player with
//  more than one city keeps one ship at a time for this, built in a city that has its defenders and is on a sea, not a
//  lake, that leads to water it hasn't explored. Transports and their escorts are another matter.
const defence_1 = require("./defence");
const buildTime_1 = require("./buildTime");
const Types_1 = require("@civ-clone/library-unit/Types");
const overseas_1 = require("../Unit/overseas");
const islandBound_1 = require("../Player/islandBound");
const isShip = (item) => Object.prototype.isPrototypeOf.call(Types_1.Naval, item);
// The water tiles joined to `city`'s by water, found one at a time: from the map itself, or, with `known`, only those
//  tiles. Stops as soon as `enough` returns `true`, or after `limit` tiles.
const searchWater = (city, enough, known = () => true, limit = 1000) => {
    const found = new Set(), queue = [];
    const visit = (tile) => {
        if (tile.isWater() && !found.has(tile) && known(tile)) {
            found.add(tile);
            queue.push(tile);
        }
    };
    city.tile().getNeighbours().forEach(visit);
    for (let i = 0; i < queue.length && i < limit; i++) {
        if (enough(queue[i], i + 1)) {
            return true;
        }
        queue[i].getNeighbours().forEach(visit);
    }
    return false;
};
// Whether `city` is on the sea rather than a lake: on a body of water of at least `seaSize` tiles. It's judged from the
//  map, as Civ1's own computer players know the extent of each ocean, and a lake the player has only partly seen
//  looks no different from a sea.
const isOnSea = (city, seaSize = 20) => searchWater(city, (tile, found) => found >= seaSize);
exports.isOnSea = isOnSea;
// Whether the water beside `city`, as far as the player knows it, reaches a tile on the edge of what it has explored.
const reachesSeaToExplore = (dependencies, player, targets, city) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), toExplore = new Set(targets.seaTilesToExplore);
    return (toExplore.size > 0 &&
        searchWater(city, (tile) => toExplore.has(tile), (tile) => playerWorld.includes(tile)));
};
exports.reachesSeaToExplore = reachesSeaToExplore;
// How many turns, at its net shields, a city spends on a ship to explore with (civ-clone/web-renderer#212).
exports.explorerShipTurns = 20;
// The cheapest ship `city` can build, if the player has another city (or is bound to its land), no ship free to explore (one that's ferrying
//  isn't, civ-clone/web-renderer#440) and none on order, the city has its
//  defenders, it's on a sea it can explore, it can finish the ship within `turns`, and it would still have shields to
//  spare once it supported the ship (civ-clone/web-renderer#229). Otherwise `null`. A player's only city has better
//  things to build.
const explorerShipFor = (dependencies, player, memory, city, knowledge, turns = exports.explorerShipTurns) => {
    const { targets } = memory;
    const [ship] = dependencies.cityBuildRegistry
        .getByCity(city)
        .available()
        .filter((buildItem) => isShip(buildItem.item()))
        .sort((a, b) => a.cost().value() - b.cost().value());
    if (!ship ||
        // A player bound to its land explores from its only city (civ-clone/web-renderer#632): otherwise it never sees
        //  land to settle overseas.
        (dependencies.cityRegistry.getByPlayer(player).length < 2 &&
            !(0, islandBound_1.default)(dependencies, player, memory)) ||
        dependencies.unitRegistry
            .getByPlayer(player)
            .some((unit) => unit instanceof Types_1.Naval && !(0, overseas_1.isFerrying)(dependencies, memory, unit)) ||
        dependencies.cityRegistry
            .getByPlayer(player)
            .some((other) => {
            const building = dependencies.cityBuildRegistry
                .getByCity(other)
                .building();
            return building !== null && isShip(building.item());
        }) ||
        (0, defence_1.wantsUnit)(dependencies, knowledge, city) ||
        (0, buildTime_1.netShields)(city) - knowledge.unitSupport(dependencies, city) <= 0 ||
        !(0, buildTime_1.finishesWithin)((0, buildTime_1.default)(dependencies, city)(ship), turns) ||
        !(0, exports.isOnSea)(city) ||
        !(0, exports.reachesSeaToExplore)(dependencies, player, targets, city)) {
        return null;
    }
    return ship.item();
};
exports.explorerShipFor = explorerShipFor;
exports.default = exports.explorerShipFor;
// How many turns passengers wait in a port before it builds a transport for them.
exports.ferryWait = 2;
// What a transport on order is taken to carry, before it's built and its own capacity is known.
const ORDERED_CAPACITY = 2;
// The cheapest transport `city` can build for passengers that have waited in it `ferryWait` turns or more
//  (`lib/Unit/overseas`, civ-clone/web-renderer#211), while they outnumber the room on the player's empty transports
//  that could sail alongside it and those on order. One on another sea doesn't count, and for invaders gathering a
//  force, a port builds as many as they need (civ-clone/web-renderer#374). Otherwise `null`.
const ferryShipFor = (dependencies, player, memory, city) => {
    const turn = dependencies.turn.value(), waiting = (0, overseas_1.waitingAt)(memory, city).filter(([, passenger]) => passenger.since !== null && turn - passenger.since >= exports.ferryWait), isTransport = (item) => Object.prototype.isPrototypeOf.call(Types_1.NavalTransport, item), [ship] = dependencies.cityBuildRegistry
        .getByCity(city)
        .available()
        .filter((buildItem) => isTransport(buildItem.item()))
        .sort((a, b) => a.cost().value() - b.cost().value());
    if (waiting.length === 0 || !ship) {
        return null;
    }
    const room = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((unit) => unit instanceof Types_1.NavalTransport &&
        unit.cargo().length === 0 &&
        (0, overseas_1.canBerthAt)(unit, city))
        .reduce((total, unit) => total + unit.capacity().value(), 0) +
        ORDERED_CAPACITY *
            dependencies.cityRegistry
                .getByPlayer(player)
                .filter((other) => {
                const building = dependencies.cityBuildRegistry
                    .getByCity(other)
                    .building();
                return building !== null && isTransport(building.item());
            }).length;
    return waiting.length > room
        ? ship.item()
        : null;
};
exports.ferryShipFor = ferryShipFor;
//# sourceMappingURL=explorerShip.js.map