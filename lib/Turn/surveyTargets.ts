// Generic: the start-of-turn survey of everything the player can see, refilling the target board.
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory, { claimedTiles, forgetDestroyedUnits } from '../Memory';
import Player from '@civ-clone/core-player/Player';
import PlayerTile from '@civ-clone/core-player-world/PlayerTile';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// Each list is emptied in place, not replaced: `Memory` explains why.
export const surveyTargets = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge
): void => {
  const { targets } = memory;

  targets.citiesToLiberate.splice(0);
  targets.enemyCitiesToAttack.splice(0);
  targets.enemyUnitsToAttack.splice(0);
  targets.goodSitesForCities.splice(0);
  targets.landTilesToExplore.splice(0);
  targets.seaTilesToExplore.splice(0);
  targets.undefendedCities.splice(0);
  forgetDestroyedUnits(memory);

  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player),
    // A tile some unit is already heading for isn't offered as a target again.
    claimed = claimedTiles(memory),
    // Every unit by tile, in one pass. Asking the registry for each known tile scanned every unit in the game once per
    //  tile. Destroyed units are included, as `getBy('tile', ...)` included them.
    unitsByTile = new Map<Tile, Unit[]>();

  dependencies.unitRegistry.forEach((unit: Unit): void => {
    const tileUnits = unitsByTile.get(unit.tile());

    if (tileUnits) {
      tileUnits.push(unit);

      return;
    }

    unitsByTile.set(unit.tile(), [unit]);
  });

  playerWorld.entries().forEach((playerTile: PlayerTile): void => {
    const tile = playerTile.tile(),
      tileCity = dependencies.cityRegistry.getByTile(tile),
      tileUnits = unitsByTile.get(tile) ?? [],
      existingTarget = claimed.has(tile);

    if (
      tileCity &&
      tileCity.player() === player &&
      !tileUnits.length &&
      !targets.undefendedCities.includes(tile) &&
      !existingTarget
    ) {
      targets.undefendedCities.push(tile);
    }
    // TODO: when diplomacy exists, check diplomatic status with player
    else if (
      tileCity &&
      tileCity.player() !== player &&
      tileCity.originalPlayer() === player
    ) {
      targets.citiesToLiberate.push(tile);
    } else if (
      tileCity &&
      tileCity.player() !== player &&
      !targets.enemyCitiesToAttack.includes(tile)
    ) {
      targets.enemyCitiesToAttack.push(tile);
    } else if (
      tileUnits.length &&
      tileUnits.some((unit: Unit): boolean => unit.player() !== player) &&
      !targets.enemyUnitsToAttack.includes(tile)
    ) {
      targets.enemyUnitsToAttack.push(tile);
    } else if (
      tile.isLand() &&
      tile
        .getNeighbours()
        .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
      !targets.landTilesToExplore.includes(tile) &&
      !existingTarget
    ) {
      targets.landTilesToExplore.push(tile);
    } else if (
      tile.isWater() &&
      tile
        .getNeighbours()
        .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
      !targets.seaTilesToExplore.includes(tile) &&
      !existingTarget
    ) {
      targets.seaTilesToExplore.push(tile);
    }

    if (
      knowledge.shouldBuildCity(dependencies, player, tile) &&
      !targets.goodSitesForCities.includes(tile) &&
      !existingTarget
    ) {
      targets.goodSitesForCities.push(tile);
    }
  });
};

export default surveyTargets;
