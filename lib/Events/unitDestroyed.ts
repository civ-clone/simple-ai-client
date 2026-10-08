// Generic: when one of the player's units is destroyed in combat, it's forgotten, the units of whoever destroyed it
//  nearby become targets, and a city it was defending that's left with fewer than two units switches production and
//  buys it. Runs during combat, so perhaps during another player's turn.
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Memory, { forgetUnit } from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// `by` is the player whose unit destroyed `unit`, or `null`. `buildItemInCity` is the ruleset's city production, for
//  the same player.
export const unitDestroyed = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  by: Player | null,
  buildItemInCity: (city: City) => void
): void => {
  const { enemyUnitsToAttack } = memory.targets;

  forgetUnit(memory, unit);

  // Like `cityLost`'s revenge: the attacker's units where ours fell, or next to it, are worth going after.
  if (by && by !== player) {
    [unit.tile(), ...unit.tile().getNeighbours()]
      .filter(
        (tile: Tile): boolean =>
          !enemyUnitsToAttack.includes(tile) &&
          dependencies.unitRegistry
            .getByTile(tile)
            .some((tileUnit: Unit): boolean => tileUnit.player() === by)
      )
      .forEach((tile: Tile): number => enemyUnitsToAttack.push(tile));
  }

  const city = dependencies.cityRegistry.getByTile(unit.tile()),
    tileUnits = dependencies.unitRegistry.getByTile(unit.tile());

  if (city && city.player() === player && tileUnits.length < 2) {
    buildItemInCity(city);

    dependencies.playerTreasuryRegistry
      .getByPlayerAndType(player, Gold)
      .buy(city);
  }
};

export default unitDestroyed;
