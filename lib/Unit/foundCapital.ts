// Generic: whether a worker should found its player's first city where it stands, rather than keep looking for a site
//  that passes every check (civ-clone/web-renderer#207). Once the player has a city, later workers are as picky as
//  `Knowledge#shouldBuildCity`.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';

// From turn `foundByTurn`, a player with no city founds one wherever its worker has got to. Until then its workers
//  look for a good site as usual. A player that loses every city later in the game founds a new one at once.
export const shouldFoundCapital = (
  dependencies: Dependencies,
  player: Player,
  foundByTurn: number
): boolean =>
  dependencies.turn.value() >= foundByTurn &&
  dependencies.cityRegistry.getByPlayer(player).length === 0;

export default shouldFoundCapital;
