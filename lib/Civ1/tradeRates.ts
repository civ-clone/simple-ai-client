// Civ1: what v474.05's AI reads when it sets its rates (OpenCivOne `Segment_1ade.cs` `F0_1ade_0006`): which cities
//  are in civil disorder, which are on the edge of it, and whether the player has stopped researching.
import {
  calculateCitizenState,
  citizenSummary,
} from '@civ-clone/civ1-city-happiness/lib/calculateCitizenState';
import { Robotics } from '@civ-clone/civ1-science/Advances';
import { TradeRatePolicy } from '../Turn/adjustTradeRates';
import civ1DisorderPolicy from './disorder';

export const civ1TradeRatePolicy: TradeRatePolicy = {
  // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored.
  inDisorder: civ1DisorderPolicy.wasInDisorder,
  // As many happy citizens as unhappy ones, in a city larger than 5, as it stands now its Entertainers are made.
  onTheEdge: (dependencies, city) => {
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(city);

    if (cityGrowth.size() <= 5) {
      return false;
    }

    const [unhappy, , happy] = citizenSummary(
      calculateCitizenState(
        cityGrowth,
        city.yields(),
        dependencies.specialistRegistry
      )
    );

    return happy === unhappy;
  },
  // v474.05 stops an AI's science the moment it has Robotics. TODO: civ-clone/web-renderer#155, by the leader's
  //  personality.
  scienceStopped: (dependencies, player) => {
    try {
      return dependencies.playerResearchRegistry
        .getByPlayer(player)
        .completed(Robotics);
    } catch (e) {
      // A player with no research.
      return false;
    }
  },
};

export default civ1TradeRatePolicy;
