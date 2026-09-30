// Generic: when a unit of the player's dies defending one of its cities and leaves it with fewer than two, the city
//  switches production and buys it. Runs during combat, so perhaps during another player's turn.
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';

// `buildItemInCity` is the ruleset's city production, for the same player.
export const unitDestroyed = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  buildItemInCity: (city: City) => void
): void => {
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
