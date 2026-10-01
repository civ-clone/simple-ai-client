"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1TradeRatePolicy = void 0;
// Civ1: what v474.05's AI reads when it sets its rates (OpenCivOne `Segment_1ade.cs` `F0_1ade_0006`): which cities
//  are in civil disorder, and which are on the edge of it.
const calculateCitizenState_1 = require("@civ-clone/civ1-city-happiness/lib/calculateCitizenState");
const disorder_1 = require("./disorder");
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
    // TODO: civ-clone/web-renderer#155, by the leader's personality. v474.05 stops at Robotics.
    scienceStopped: () => false,
};
exports.default = exports.civ1TradeRatePolicy;
//# sourceMappingURL=tradeRates.js.map