// Generic: picks what to research next, at random from what's available, or from the advances the player's leader
//  wants (`wantedAdvances`) when any of those is available.
import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '../Dependencies';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';

// Draws from the random number generator once, and only when there's something to choose from: among the `wanted`
//  advances available or, if there are none, among everything available. Once a player has every advance it wants,
//  and so has stopped researching, that's everything available: the engine still asks it to choose, but its science
//  rate is 0, so nothing comes of it.
export const chooseResearch = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  wanted: (typeof Advance)[] = []
): void => {
  const available = playerResearch.available(),
    availableWanted = available.filter((AdvanceType: typeof Advance) =>
      wanted.includes(AdvanceType)
    ),
    choices = availableWanted.length > 0 ? availableWanted : available;

  if (choices.length) {
    playerResearch.research(
      choices[Math.floor(choices.length * dependencies.randomNumberGenerator())]
    );
  }
};

export default chooseResearch;
