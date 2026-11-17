"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bestGovernmentLately = exports.SCORE_TURNS = exports.bestGovernment = exports.REVOLUTION_PAYBACK = exports.scoresGovernments = exports.cityFactsOf = exports.governmentScore = exports.FOOD = exports.SHIELD = exports.CITIZEN = void 0;
// Generic: what a government would be worth to a player, from what it does as the rule set numbers it
//  (base-government-terms' `GovernmentTerms`), after the original Civilization II AI's government score (OpenCiv2
//  `game/bigframes.cpp` `ai_choose_government`, the city terms of `city.cpp` 2911–4553 and 3523–3594): for each of the
//  player's cities,
//  - the trade its worked squares gain (the trade bonus) or lose (the tile penalty);
//  - the shields its units cost beyond those supported for free;
//  - the citizens its aggressive units make unhappy (war weariness), weighed by the leader's tolerance;
//  - the unhappy citizens its units keep content (martial law), or all of them (a government with no unhappiness);
//  - the trade lost to corruption;
//  - the research lost (Fundamentalism's), weighed by how much the leader cares for science.
// Each term is in trade: a citizen counts `CITIZEN`, a shield `SHIELD` and a point of food `FOOD`. The leader's `ScienceBias` (civilize in
//  Civ2) scales the research lost by (bias + 3) / 4, as the original's `(civilize + 3) × science / 4`, so a militaristic
//  leader minds half as much: Fundamentalism mostly wins for them, and where luxuries and content outweigh science.
const Yields_1 = require("@civ-clone/library-city/Yields");
const terms_1 = require("@civ-clone/base-government-terms/lib/terms");
const traits_1 = require("@civ-clone/core-unit/traits");
const Types_1 = require("@civ-clone/library-unit/Types");
const MilitaryUnhappinessTolerance_1 = require("@civ-clone/base-leader-personality/Rules/Player/MilitaryUnhappinessTolerance");
const NonCombatant_1 = require("@civ-clone/base-unit-trait-non-combatant/NonCombatant");
const Research_1 = require("@civ-clone/base-trade-rate-research/Research");
const ScienceBias_1 = require("@civ-clone/base-leader-personality/Rules/Player/ScienceBias");
const terms_2 = require("./terms");
const defence_1 = require("../Civ1/defence");
const bornContent_1 = require("@civ-clone/base-city-happiness/lib/bornContent");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
// What a citizen and a shield are worth, in trade: a citizen made an Entertainer gives 2 luxuries.
exports.CITIZEN = 2;
exports.SHIELD = 1;
exports.FOOD = 1;
// A city's citizens beyond these are born unhappy where the rule set doesn't say (Civ1's computer players').
const BORN_CONTENT = 3;
// How far a city with no capital to measure from counts, for corruption.
const NO_CAPITAL = 32;
const factsOf = (dependencies, city, capital) => {
    var _a;
    const rules = city.tileYieldRules(), squares = dependencies.workedTileRegistry
        .getByCity(city)
        .map((workedTile) => {
        const tileYields = city.tileYields(workedTile.tile(), rules);
        return {
            food: (0, reduceYields_1.reduceYield)(tileYields, Yields_1.Food),
            shields: (0, reduceYields_1.reduceYield)(tileYields, Yields_1.Production),
            trade: (0, reduceYields_1.reduceYield)(tileYields, Yields_1.Trade),
        };
    }), units = dependencies.unitRegistry.getByCity(city), size = dependencies.cityGrowthRegistry.getByCity(city).size(), content = (_a = (0, bornContent_1.default)(city, dependencies.ruleRegistry)) !== null && _a !== void 0 ? _a : BORN_CONTENT, tile = city.tile();
    return {
        squares,
        trade: squares.reduce((total, square) => total + square.trade, 0),
        supported: units.filter((unit) => !unit.hasTrait(NonCombatant_1.default)).length,
        aggressive: units.filter((unit) => unit.attack().value() > 0 &&
            !unit.hasTrait(NonCombatant_1.default) &&
            ((0, traits_1.isA)(unit, Types_1.Air) || unit.tile() !== tile)).length,
        inCity: dependencies.unitRegistry
            .getByTile(tile)
            .filter((unit) => unit.player() === city.player() && unit.attack().value() > 0).length,
        unhappy: Math.max(0, size - content),
        distance: capital === null ? NO_CAPITAL : capital.tile().distanceFrom(tile),
        size,
    };
};
// The trade a square gains or loses under `terms`, from what it gives now under `current`'s terms: a tile penalty
//  taken off a yield over its threshold, so a yield the current one has already taken from counts at the threshold.
const squareTrade = (square, terms, current) => {
    var _a, _b, _c, _d;
    const penalty = (_a = terms.tilePenalty) !== null && _a !== void 0 ? _a : null, currentPenalty = (_b = current === null || current === void 0 ? void 0 : current.tilePenalty) !== null && _b !== void 0 ? _b : null, bonus = (_c = terms.tradeBonus) !== null && _c !== void 0 ? _c : 0, currentBonus = (_d = current === null || current === void 0 ? void 0 : current.tradeBonus) !== null && _d !== void 0 ? _d : 0, 
    // Each yield as it would be with no penalty: one the current government took from is back over its threshold.
    raw = (value) => currentPenalty !== null && value === currentPenalty.threshold
        ? value + currentPenalty.amount
        : value, penalised = (value) => penalty !== null && raw(value) > penalty.threshold ? penalty.amount : 0, trade = raw(square.trade) - (square.trade > 0 ? currentBonus : 0);
    return ((trade > 0 ? bonus : 0) -
        penalised(square.trade) -
        exports.SHIELD * penalised(square.shields) -
        exports.FOOD * penalised(square.food));
};
/**
 * What `GovernmentType` would be worth to `player`, by its terms, or `null` where the rule set gives none. Only a
 *  comparison between governments means anything.
 */
const governmentScore = (dependencies, player, GovernmentType, facts = (0, exports.cityFactsOf)(dependencies, player)) => {
    var _a, _b, _c, _d, _e, _f;
    const terms = (0, terms_1.governmentTerms)(dependencies.ruleRegistry, GovernmentType);
    if (terms === null) {
        return null;
    }
    const CurrentType = (0, terms_2.governmentOf)(dependencies, player), current = CurrentType === null
        ? null
        : (0, terms_1.governmentTerms)(dependencies.ruleRegistry, CurrentType), tolerance = (0, combine_1.sum)(dependencies.ruleRegistry, MilitaryUnhappinessTolerance_1.default, player), scienceBias = (0, combine_1.sum)(dependencies.ruleRegistry, ScienceBias_1.default, player), research = researchShare(dependencies, player), free = (_a = terms.freeUnits) !== null && _a !== void 0 ? _a : (() => 0), cost = (_b = terms.unitSupportCost) !== null && _b !== void 0 ? _b : 1, martialLaw = (_c = terms.martialLaw) !== null && _c !== void 0 ? _c : { maximumUnits: 0, perUnit: 1 }, war = (_d = terms.militaryUnhappiness) !== null && _d !== void 0 ? _d : { perUnit: 0, free: 0 }, corruption = (_e = terms.corruption) !== null && _e !== void 0 ? _e : { perDistance: 0, fixedDistance: null }, science = (_f = terms.science) !== null && _f !== void 0 ? _f : 1;
    return facts.reduce((total, city) => {
        var _a;
        const squares = city.squares.reduce((gain, square) => gain + squareTrade(square, terms, current), 0), support = exports.SHIELD * cost * Math.max(0, city.supported - free(city.size)), weariness = exports.CITIZEN *
            ((7 - tolerance) / 7) *
            war.perUnit *
            Math.max(0, city.aggressive - war.free), calmed = terms.noUnhappiness
            ? city.unhappy
            : Math.min(city.unhappy, Math.min(city.inCity, martialLaw.maximumUnits) * martialLaw.perUnit), corrupt = city.trade *
            Math.min(1, corruption.perDistance * ((_a = corruption.fixedDistance) !== null && _a !== void 0 ? _a : city.distance)), scienceLost = ((scienceBias + 3) / 4) * (1 - science) * research * city.trade;
        return (total +
            squares -
            support -
            (terms.noUnhappiness ? 0 : weariness) +
            exports.CITIZEN * calmed -
            corrupt -
            scienceLost);
    }, 0);
};
exports.governmentScore = governmentScore;
// The share of trade the player puts into research, or a half where it has no rates.
const researchShare = (dependencies, player) => {
    var _a, _b;
    try {
        return ((_b = (_a = dependencies.playerTradeRatesRegistry
            .getByPlayer(player)
            .get(Research_1.default)) === null || _a === void 0 ? void 0 : _a.value()) !== null && _b !== void 0 ? _b : 0.5);
    }
    catch (e) {
        return 0.5;
    }
};
/** What each of `player`'s cities has, for `governmentScore`. */
const cityFactsOf = (dependencies, player) => {
    var _a;
    const cities = dependencies.cityRegistry.getByPlayer(player), capital = (_a = cities.find((city) => (0, defence_1.isCapital)(dependencies, city))) !== null && _a !== void 0 ? _a : null;
    return cities.map((city) => factsOf(dependencies, city, capital));
};
exports.cityFactsOf = cityFactsOf;
/**
 * Whether the rule set numbers every one of `available` (so the scores can be compared), and so the player chooses by
 *  them. Civ1's numbers none.
 */
const scoresGovernments = (dependencies, available) => available.length > 0 &&
    available.every((GovernmentType) => (0, terms_1.governmentTerms)(dependencies.ruleRegistry, GovernmentType) !== null);
exports.scoresGovernments = scoresGovernments;
// A revolution costs one to a few turns of Anarchy, about two and a half turns of the cities' trade, which a better
//  government kept for the policy's 40 turns between revolutions pays back at a sixteenth of that trade a turn.
exports.REVOLUTION_PAYBACK = 16;
/**
 * The government of `available` worth most to `player` (`governmentScore`), a later one winning a tie, as the
 *  original's does. The one it has keeps it unless another is worth more by a sixteenth of its cities' trade
 *  (`REVOLUTION_PAYBACK`).
 */
const bestGovernment = (dependencies, player, available) => {
    var _a, _b;
    const facts = (0, exports.cityFactsOf)(dependencies, player), margin = facts.reduce((total, city) => total + city.trade, 0) / exports.REVOLUTION_PAYBACK, CurrentType = (0, terms_2.governmentOf)(dependencies, player), scored = available.map((GovernmentType) => {
        var _a;
        return ({
            GovernmentType,
            score: ((_a = (0, exports.governmentScore)(dependencies, player, GovernmentType, facts)) !== null && _a !== void 0 ? _a : -Infinity) - (GovernmentType === CurrentType ? 0 : margin),
        });
    });
    return ((_b = (_a = scored.reduce((best, entry) => best === null || entry.score >= best.score ? entry : best, null)) === null || _a === void 0 ? void 0 : _a.GovernmentType) !== null && _b !== void 0 ? _b : null);
};
exports.bestGovernment = bestGovernment;
// The original scores its governments every eighth turn (`ai.cpp:1559`); so does this, unless the governments the player
//  may choose have changed since.
exports.SCORE_TURNS = 8;
const chosen = new WeakMap();
/** `bestGovernment`, worked out again only every `SCORE_TURNS` turns or when `available` changes. */
const bestGovernmentLately = (dependencies, player, available) => {
    const turn = dependencies.turn.value(), key = available.map((GovernmentType) => GovernmentType.name).join(), known = chosen.get(player);
    if (known && known.available === key && turn - known.turn < exports.SCORE_TURNS) {
        return known.best;
    }
    const best = (0, exports.bestGovernment)(dependencies, player, available);
    chosen.set(player, { turn, available: key, best });
    return best;
};
exports.bestGovernmentLately = bestGovernmentLately;
exports.default = exports.governmentScore;
//# sourceMappingURL=score.js.map