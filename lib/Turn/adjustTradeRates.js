"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustTradeRates = exports.extraLuxuries = void 0;
// Generic: sets the player's tax, luxury and science rates at the end of its turn, the way v474.05's AI does but for
//  one departure (`lib/tradeRates`), and calms its cities again if the luxury rate changed
//  (civ-clone/web-renderer#154).
//
// It runs at the end of the turn, after `preventDisorder`, rather than at the start: the engine judges disorder at the
//  player's turn start, before the AI's turn begins, so rates set then would come a turn late. Set here, they're the
//  rates the engine shares each city's trade out by at that turn start.
const tradeRates_1 = require("../tradeRates");
const disorder_1 = require("../City/disorder");
const Luxuries_1 = require("@civ-clone/base-trade-rate-luxuries/Luxuries");
const Research_1 = require("@civ-clone/base-trade-rate-research/Research");
const Tax_1 = require("@civ-clone/base-trade-rate-tax/Tax");
const traits_1 = require("../traits");
// Luxuries beyond the original's, for the cities `preventDisorder` couldn't calm: one step while any of them would
//  otherwise starve (`food`) or has no tile left to take an Entertainer from (`tiles`). A city that will grow into
//  disorder (`growth`) is calm now, and is calmed at its new size the turn it grows, so it adds nothing.
const extraLuxuries = (uncalmed) => [...uncalmed].some((reason) => reason !== 'growth')
    ? 1
    : 0;
exports.extraLuxuries = extraLuxuries;
// The engine keeps rates as percentages, the original in tenths.
const tenths = (rate) => Math.round(rate.value() / 10);
const gold = (dependencies, player) => dependencies.playerTreasuryRegistry
    .getByPlayer(player)
    .reduce((total, treasury) => total + treasury.value(), 0);
// Sets the player's rates for the turn ahead, and returns them, in tenths. Returns `null`, and changes nothing, for a
//  player whose ruleset has no tax, luxury and science rates.
const adjustTradeRates = (dependencies, player, memory, knowledge, disorderPolicy, policy) => {
    let playerTradeRates;
    try {
        playerTradeRates =
            dependencies.playerTradeRatesRegistry.getByPlayer(player);
    }
    catch (e) {
        return null;
    }
    const science = playerTradeRates.get(Research_1.default), tax = playerTradeRates.get(Tax_1.default), luxuries = playerTradeRates.get(Luxuries_1.default);
    if (!science || !tax || !luxuries) {
        return null;
    }
    const turn = dependencies.turn.value(), playerIdeology = (0, traits_1.ideology)(dependencies, player), cities = dependencies.cityRegistry.getByPlayer(player), luxuriesBefore = luxuries.value(), rates = (0, tradeRates_1.tradeRates)({
        // The original sets a new player's rates when the game starts. The engine starts everyone at its own, so they're
        //  replaced on the player's first turn.
        rates: turn <= 1
            ? (0, tradeRates_1.startingRates)(playerIdeology)
            : {
                luxuries: tenths(luxuries),
                science: tenths(science),
                tax: tenths(tax),
            },
        inDisorder: cities.some((city) => policy.inDisorder(dependencies, city)),
        onTheEdge: cities.some((city) => policy.onTheEdge(dependencies, city)),
        turn,
        gold: gold(dependencies, player),
        ideology: playerIdeology,
        scienceStopped: policy.scienceStopped(dependencies, player),
        extraLuxuries: (0, exports.extraLuxuries)(memory.uncalmedCities.values()),
    });
    playerTradeRates.setAll([
        [Tax_1.default, rates.tax * 10],
        [Research_1.default, rates.science * 10],
        [Luxuries_1.default, rates.luxuries * 10],
    ]);
    // More luxuries may calm a city with fewer Entertainers, or one that couldn't be calmed; fewer may leave one in
    //  disorder.
    if (luxuries.value() !== luxuriesBefore) {
        (0, disorder_1.calmCities)(dependencies, player, memory, knowledge, disorderPolicy);
    }
    return rates;
};
exports.adjustTradeRates = adjustTradeRates;
exports.default = exports.adjustTradeRates;
//# sourceMappingURL=adjustTradeRates.js.map