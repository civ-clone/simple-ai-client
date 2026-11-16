// Generic: base-strategy-ai's start-of-turn survey (`surveyTargets`), less what lies with the player's allies. The
//  survey lists every other player's city and unit as something to attack or liberate; an ally's can't be attacked, and
//  under Civ2's rules its city can't be entered either (civ2-unit's `allied-repair`), so a unit sent there only stood
//  outside, or was repaired there whole. Civ1 has no alliances, so its board is unchanged.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { isAlly } from '../Player/treaties';
import surveyBoard from '@civ-clone/base-strategy-ai/lib/Turn/surveyTargets';

// Takes the tiles `held` says out of `tiles`, in place (`Memory` explains why the lists are kept).
const dropFrom = (tiles: Tile[], held: (tile: Tile) => boolean): void => {
  for (let index = tiles.length - 1; index >= 0; index--) {
    if (held(tiles[index])) {
      tiles.splice(index, 1);
    }
  }
};

export const surveyTargets = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge
): void => {
  surveyBoard(dependencies, player, memory, knowledge);

  const { targets } = memory,
    allies = new Map<Player, boolean>(),
    ally = (other: Player): boolean => {
      if (!allies.has(other)) {
        allies.set(other, isAlly(dependencies, player, other));
      }

      return allies.get(other)!;
    },
    alliedCity = (tile: Tile): boolean => {
      const city = dependencies.cityRegistry.getByTile(tile);

      return city !== null && ally(city.player());
    };

  dropFrom(targets.citiesToLiberate, alliedCity);
  dropFrom(targets.enemyCitiesToAttack, alliedCity);
  dropFrom(targets.enemyUnitsToAttack, (tile: Tile): boolean => {
    const others = dependencies.unitRegistry
      .getByTile(tile)
      .filter((unit: Unit): boolean => unit.player() !== player);

    return (
      others.length > 0 && others.every((unit: Unit) => ally(unit.player()))
    );
  });
};

export default surveyTargets;
