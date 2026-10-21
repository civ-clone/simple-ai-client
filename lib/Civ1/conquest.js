"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conquestProductionPolicy = exports.civ1ConquestPolicy = exports.MARCH_TURNS = exports.MUSTER_WAIT = exports.MUSTER_ADVANTAGE = exports.MUSTER_ATTACKERS = exports.WALLS_DISTANCE = exports.CONQUEST_WEIGHT = exports.CONQUEST_AT = exports.CONQUEST_FROM = void 0;
// Civ1: the numbers behind a computer player's conquest (civ-clone/web-renderer#377), for `base-strategy-victory`'s
//  generic campaign.
//
// All ours: v474.05's AI attacks case by case, with no campaign to decode. Conquest weighs on a player as it gets
//  closer: nothing until it holds `CONQUEST_FROM` of the world's cities, rising to `CONQUEST_WEIGHT` at `CONQUEST_AT`,
//  and passing the space race's 1 half way, where finishing the conquest becomes the nearer win. Until then its attacks
//  are the case-by-case ones every player makes, which took more cities in the arena than a campaign run against a
//  stronger player's nearest rival, and a campaign started early cost players cities and score (Dom, on
//  civ-clone/web-renderer#377). Not while it still knows of good sites for cities on its landmasses: once it has none
//  it's done expanding for good, as the sites a revealed coast or a razed city turn up came and went from one turn to
//  the next. Its target is its rival's (`lib/Player/rivals`) on a landmass where it has a city: an overseas rival is
//  left to the invasions of `lib/Unit/overseas`.
//
// The target is the rival's city nearest the player's own, one without City Walls counting as `WALLS_DISTANCE` nearer.
//  Attackers gather in the player's city nearest it, and go once there are `MUSTER_ATTACKERS` of them with
//  `MUSTER_ADVANTAGE` times the attack of the city's defence (tripled behind its walls, as Civ1's are), or with the
//  `MUSTER_ATTACKERS` alone once the campaign has waited `MUSTER_WAIT` turns. Only attackers within `MARCH_TURNS`
//  of it join in.
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const rivals_1 = require("../Player/rivals");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const explorers_1 = require("../City/explorers");
const defence_1 = require("../City/defence");
const research_1 = require("@civ-clone/base-strategy-victory/lib/research");
const buildItemInCity_1 = require("./buildItemInCity");
const strength_1 = require("@civ-clone/core-power/lib/strength");
exports.CONQUEST_FROM = 0.5;
exports.CONQUEST_AT = 0.75;
// Twice the space race's 1.
exports.CONQUEST_WEIGHT = 2;
exports.WALLS_DISTANCE = 8;
exports.MUSTER_ATTACKERS = 3;
exports.MUSTER_ADVANTAGE = 2;
exports.MUSTER_WAIT = 10;
exports.MARCH_TURNS = 10;
// Civ1's City Walls triple a city's defence against land units.
const WALLS_DEFENCE = 3;
// The advances for each better attacker in turn: Horsemen, Chariots, Legions, Catapults, Cannons, Armor.
const attackerAdvances = [
    Advances_1.HorsebackRiding,
    Advances_1.TheWheel,
    Advances_1.IronWorking,
    Advances_1.Mathematics,
    Advances_1.Metallurgy,
    Advances_1.Automobile,
];
const knows = (dependencies, player, AdvanceType) => dependencies.playerResearchRegistry
    .getByPlayer(player)
    .completed(AdvanceType);
const hasWalls = (dependencies, city) => dependencies.cityImprovementRegistry
    .getByCity(city)
    .some((improvement) => improvement instanceof CityImprovements_1.CityWalls);
// The share of the world's cities `player` holds. A destroyed city stays in the registry, so it isn't counted from
//  there.
const shareOf = (dependencies, player) => dependencies.cityRegistry.getByPlayer(player).length /
    Math.max(1, dependencies.cityRegistry
        .entries()
        .filter((city) => !city.destroyed()).length);
// The players done expanding.
const settled = new WeakSet();
// Whether `player` still knows of a good site for a city on a landmass where it has one: its Settlers come first.
//  Asked only once it holds `CONQUEST_FROM` of the world's cities, as early on it may know of none yet.
const expanding = (dependencies, player) => {
    if (settled.has(player)) {
        return false;
    }
    const turn = dependencies.turn.value(), landmasses = dependencies.cityRegistry
        .getByPlayer(player)
        .map((city) => (0, explorers_1.continentOf)(turn, city.tile()));
    const sites = dependencies.memoryRegistry
        .memoryFor(player)
        .targets.goodSitesForCities.some((site) => landmasses.some((landmass) => landmass.has(site)));
    if (!sites) {
        settled.add(player);
    }
    return sites;
};
const weights = new WeakMap();
// Worked out once a turn: every strategy asks.
const weightOf = (dependencies, player) => {
    const turn = dependencies.turn.value(), known = weights.get(player);
    if (known && known.turn === turn) {
        return known.weight;
    }
    const share = shareOf(dependencies, player), weight = share < exports.CONQUEST_FROM || expanding(dependencies, player)
        ? 0
        : exports.CONQUEST_WEIGHT *
            Math.min(1, (share - exports.CONQUEST_FROM) / (exports.CONQUEST_AT - exports.CONQUEST_FROM));
    weights.set(player, { turn, weight });
    return weight;
};
const targets = new WeakMap();
// Kept while it's still the rival's and reachable, so that a campaign isn't turned round by a city that's a little
//  nearer.
const targetOf = (dependencies, player) => {
    var _a, _b;
    const turn = dependencies.turn.value(), known = targets.get(player);
    if (known && known.turn === turn) {
        return known.target;
    }
    const rival = (0, rivals_1.rivalOf)(dependencies, player), cities = dependencies.cityRegistry.getByPlayer(player), landmasses = cities.map((city) => (0, explorers_1.continentOf)(turn, city.tile())), candidates = rival === null
        ? []
        : (0, rivals_1.knownEnemyCities)(dependencies, player).filter((city) => city.player() === rival &&
            // A razed city keeps its player, and the registry keeps it.
            !city.destroyed() &&
            landmasses.some((landmass) => landmass.has(city.tile()))), distance = (city) => Math.min(...cities.map((own) => own.tile().distanceFrom(city.tile()))) + (hasWalls(dependencies, city) ? exports.WALLS_DISTANCE : 0), previous = (_a = known === null || known === void 0 ? void 0 : known.target) !== null && _a !== void 0 ? _a : null, target = candidates.includes(previous)
        ? previous
        : (_b = [...candidates].sort((a, b) => distance(a) - distance(b))[0]) !== null && _b !== void 0 ? _b : null;
    targets.set(player, { turn, target });
    return target;
};
const musters = new WeakMap();
exports.civ1ConquestPolicy = {
    weight: (dependencies, victoryDependencies, player) => weightOf(dependencies, player),
    // The next better attacker, once it's the next advance away.
    advances: (dependencies, victoryDependencies, player) => {
        const next = attackerAdvances.find((AdvanceType) => !knows(dependencies, player, AdvanceType));
        return next !== undefined &&
            (0, research_1.directPrerequisites)(next, victoryDependencies.advanceRegistry, dependencies.ruleRegistry).every((Prerequisite) => knows(dependencies, player, Prerequisite))
            ? [next]
            : [];
    },
    target: (dependencies, victoryDependencies, player) => targetOf(dependencies, player),
    musterCity: (dependencies, victoryDependencies, player, target) => {
        var _a;
        const landmass = (0, explorers_1.continentOf)(dependencies.turn.value(), target.tile());
        return ((_a = dependencies.cityRegistry
            .getByPlayer(player)
            .filter((city) => landmass.has(city.tile()))
            .sort((a, b) => a.tile().distanceFrom(target.tile()) -
            b.tile().distanceFrom(target.tile()))[0]) !== null && _a !== void 0 ? _a : null);
    },
    marchTurns: exports.MARCH_TURNS,
    isAttacker: (dependencies, unit) => (0, buildItemInCity_1.isAttacker)(unit),
    // From one of the player's cities that keeps the defenders it wants without it, and isn't using it for martial law.
    mayLeave: (dependencies, knowledge, unit) => {
        const city = dependencies.cityRegistry.getByTile(unit.tile());
        return (city !== null &&
            city.player() === unit.player() &&
            (0, defence_1.defendersIn)(dependencies, city).length - 1 >=
                (0, defence_1.defendersKept)(dependencies, knowledge, city) &&
            !(0, defence_1.keepsOrder)(dependencies, knowledge, city, unit));
    },
    // Decided once a turn, so that the first to leave doesn't keep the rest waiting.
    mustered: (dependencies, victoryDependencies, player, target, muster) => {
        const turn = dependencies.turn.value(), known = musters.get(player);
        if (known && known.turn === turn && known.target === target) {
            return known.go;
        }
        const since = known && known.target === target ? known.since : turn, 
        // Not those fortified there as the city's garrison: they stay.
        attackers = dependencies.unitRegistry
            .getByTile(muster.tile())
            .filter((unit) => unit.player() === player && (0, buildItemInCity_1.isAttacker)(unit) && unit.busy() === null), { attack } = (0, strength_1.militaryStrength)(attackers, dependencies.ruleRegistry), { defence } = (0, strength_1.militaryStrength)(dependencies.unitRegistry.getByTile(target.tile()), dependencies.ruleRegistry), go = attackers.length >= exports.MUSTER_ATTACKERS &&
            (attack >=
                exports.MUSTER_ADVANTAGE *
                    defence *
                    (hasWalls(dependencies, target) ? WALLS_DEFENCE : 1) ||
                turn - since >= exports.MUSTER_WAIT);
        musters.set(player, { turn, target, since: go ? turn : since, go });
        return go;
    },
};
exports.default = exports.civ1ConquestPolicy;
// While a campaign is on, twice the attackers.
exports.conquestProductionPolicy = {
    ...buildItemInCity_1.defaultProductionPolicy,
    attackersPerCity: buildItemInCity_1.defaultProductionPolicy.attackersPerCity * 2,
};
//# sourceMappingURL=conquest.js.map