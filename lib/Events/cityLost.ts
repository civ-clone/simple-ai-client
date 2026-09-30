// Generic: when one of the player's cities is captured or destroyed, puts targets for revenge or liberation on the
//  board. Runs during other players' turns, against the same board the player's own turn uses.
import City from '@civ-clone/core-city/City';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import PlayerTile from '@civ-clone/core-player-world/PlayerTile';
import { TargetBoard } from '../Memory';
import Tile from '@civ-clone/core-world/Tile';

const hasPlayerCity = (
  tile: Tile,
  player: Player,
  cityRegistry: CityRegistry
): boolean => {
  const city = cityRegistry.getByTile(tile);

  if (city === null) {
    return false;
  }

  return city.player() === player;
};

// `by` is the player that took or destroyed `city`, or `null` if nobody did.
export const cityLost = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  by: Player | null,
  destroyed: boolean
): void => {
  // Can't retaliate against ourselves, we deserved it...
  if (!by) {
    return;
  }

  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  if (destroyed) {
    // REVENGE!
    targets.enemyCitiesToAttack.push(
      ...playerWorld
        .entries()
        .filter((playerTile: PlayerTile) =>
          hasPlayerCity(playerTile.tile(), by, dependencies.cityRegistry)
        )
        .map((playerTile: PlayerTile) => playerTile.tile())
    );
    targets.enemyUnitsToAttack.push(
      ...playerWorld
        .entries()
        .filter((playerTile: PlayerTile) =>
          dependencies.unitRegistry
            .getByTile(playerTile.tile())
            .some((unit) => unit.player() === by)
        )
        .map((playerTile: PlayerTile) => playerTile.tile())
    );

    return;
  }

  targets.citiesToLiberate.push(city.tile());
};

export default cityLost;
