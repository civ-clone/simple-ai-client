// Generic: picks what to research next, at random from what's available.
import Dependencies from '../Dependencies';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';

// Draws from the random number generator only when there's something to choose from.
export const chooseResearch = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch
): void => {
  const available = playerResearch.available();

  if (available.length) {
    playerResearch.research(
      available[
        Math.floor(available.length * dependencies.randomNumberGenerator())
      ]
    );
  }
};

export default chooseResearch;
