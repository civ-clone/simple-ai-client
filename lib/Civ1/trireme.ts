// Civ1: a Trireme is lost at sea half the time when a move leaves it with no moves off the coast (`civ1-unit`'s
//  `trireme-lost-at-sea` rule), and whether a Trireme is still safe after an action.
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Move } from '@civ-clone/civ1-unit/Actions';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import { Trireme } from '@civ-clone/civ1-unit/Units';
import Unit from '@civ-clone/core-unit/Unit';

// A Trireme moves off the coast, or acts there (an attack costs a move too), only with a move to spare afterwards and
//  next to a coastal tile it can spend it reaching. Every move at sea costs 1, so it can always end its turn on the
//  coast.
export const triremeCanReturn = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  action: Action
): boolean => {
  if (!(unit instanceof Trireme)) {
    return true;
  }

  const to = action instanceof Move ? action.to() : unit.tile();

  return (
    to.isCoast() ||
    (unit.moves().value() > 1 &&
      to
        .getNeighbours()
        .some((tile: Tile): boolean => tile.isWater() && tile.isCoast()))
  );
};

export default triremeCanReturn;
