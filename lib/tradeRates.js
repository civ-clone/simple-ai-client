"use strict";
// Generic: a computer player's tax, luxury and science rates, the way v474.05's AI sets them each turn (OpenCivOne
//  `Segment_1ade.cs` `F0_1ade_0006`, called from `GameEngine.cs`). Rates are in tenths, as the original keeps them:
//  `Turn/adjustTradeRates` converts to and from the engine's percentages.
//
// Pure, so it can be tested from the rules alone.
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeRates = exports.LUXURY_REDUCTION_BELOW = exports.startingRates = exports.MAX_LUXURIES = void 0;
exports.MAX_LUXURIES = 4;
// A computer player's rates at the start of the game: science Ideology + 3, tax 9 − science, so 1 luxury
//  (`StartGameMenu.cs` ~L555).
const startingRates = (scienceBias) => ({
    luxuries: 1,
    science: scienceBias + 3,
    tax: 9 - (scienceBias + 3),
});
exports.startingRates = startingRates;
// Science + tax below which a luxury is taken away every 4th turn (step 3 below), so luxuries fall back to 0 once
//  no city needs them.
//
// v474.05 takes one away only while science + tax < 8, that is from 3 or 4 luxuries, so its AI keeps the 1 it starts
//  with, and 2 for good once it has had 2. This departs from the original on purpose. In the arena
//  (civ-clone/web-renderer#154), the original's rule left computer players with fewer advances and less gold after
//  150 turns than this one, for no fewer turns of disorder: their cities are kept calm by Entertainers
//  (`City/disorder`), and luxuries are raised for any city those can't calm.
exports.LUXURY_REDUCTION_BELOW = 10;
// The rates for the turn ahead:
//  1. luxuries are what science and tax leave;
//  2. one more if a city is in disorder and science + tax > 6;
//  3. one fewer every 4th turn if no city is in disorder or on the edge and science + tax < 10 (v474.05: < 8, see
//     `LUXURY_REDUCTION_BELOW`);
//  4. no fewer than 0, no more than 4;
//  5. science is Ideology + (10 − luxuries) / 2 rounded down, one more if gold > turn + 100, or 0 once science has
//     stopped;
//  6. tax is the rest.
const tradeRates = ({ rates, inDisorder, onTheEdge, turn, gold, scienceBias, scienceStopped, extraLuxuries = 0, }) => {
    const scienceAndTax = rates.science + rates.tax;
    let luxuries = 10 - scienceAndTax;
    if (inDisorder && scienceAndTax > 6) {
        luxuries += 1;
    }
    if (turn % 4 === 0 &&
        !inDisorder &&
        !onTheEdge &&
        scienceAndTax < exports.LUXURY_REDUCTION_BELOW) {
        luxuries -= 1;
    }
    luxuries = Math.max(0, Math.min(exports.MAX_LUXURIES, luxuries + extraLuxuries));
    const science = scienceStopped
        ? 0
        : scienceBias +
            Math.floor((10 - luxuries) / 2) +
            (gold > turn + 100 ? 1 : 0);
    return {
        luxuries,
        science,
        tax: 10 - science - luxuries,
    };
};
exports.tradeRates = tradeRates;
exports.default = exports.tradeRates;
//# sourceMappingURL=tradeRates.js.map