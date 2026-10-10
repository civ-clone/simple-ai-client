"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1TradeRatePolicy = void 0;
// Civ1: what v474.05's AI reads when it sets its rates (OpenCivOne `Segment_1ade.cs` `F0_1ade_0006`): which cities
//  are in civil disorder, which are on the edge of it, and whether the player has stopped researching.
const calculateCitizenState_1 = require("@civ-clone/civ1-city-happiness/lib/calculateCitizenState");
const disorder_1 = require("./disorder");
const wantedAdvances_1 = require("../Science/wantedAdvances");
exports.civ1TradeRatePolicy = {
    // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored.
    inDisorder: disorder_1.default.wasInDisorder,
    // As many happy citizens as unhappy ones, in a city larger than 5, as it stands now its Entertainers are made.
    onTheEdge: (dependencies, city) => {
        const cityGrowth = dependencies.cityGrowthRegistry.getByCity(city);
        if (cityGrowth.size() <= 5) {
            return false;
        }
        const [unhappy, , happy] = (0, calculateCitizenState_1.citizenSummary)((0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, city.yields(), dependencies.specialistRegistry));
        return happy === unhappy;
    },
    // Once the player has every advance its leader wants (`civ1-civilization`'s `WantedAdvances` rules), where v474.05
    //  stops at Robotics.
    scienceStopped: wantedAdvances_1.scienceStopped,
};
exports.default = exports.civ1TradeRatePolicy;
//# sourceMappingURL=tradeRates.js.map