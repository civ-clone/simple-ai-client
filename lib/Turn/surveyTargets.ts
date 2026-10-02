// Generic: the start-of-turn survey of everything the player can see, refilling the target board.
import Memory, {
  TargetBoard,
  claimedTiles,
  forgetDestroyedUnits,
} from '../Memory';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import PlayerTile from '@civ-clone/core-player-world/PlayerTile';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { generateKey } from '@civ-clone/core-strategy/StrategyNote';

// The player's target board as a `StrategyNote`, so that it's saved with the game: the survey's turn, and the board
//  itself, the same object as `Memory#targets`, so a save holds the board as the turn has left it so far.
export interface SurveyNote {
  targets: TargetBoard;
  turn: number;
}

export const surveyNoteKey = (player: Player): string =>
  generateKey(player, 'simple-ai-client:survey');

// Takes up the board a loaded game saved part way through the player's turn, rather than surveying again. Resuming
//  starts the player's turn over, and a survey of the world as it is by then (changed since the turn began, by moves
//  made before the save or by anything else) offered different targets: the loaded game played on differently from
//  the game that never stopped. Only for a new memory, so that surveying twice in one turn (`preProcessTurn`) still
//  surveys afresh.
const resumeSurvey = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory
): boolean => {
  const turn = dependencies.turn.value(),
    note = dependencies.strategyNoteRegistry.getByKey<SurveyNote>(
      surveyNoteKey(player)
    );

  if (memory.surveyedTurn !== null || !note || note.value().turn !== turn) {
    return false;
  }

  const { targets } = memory,
    saved = note.value().targets;

  (Object.keys(targets) as (keyof TargetBoard)[]).forEach(
    (key: keyof TargetBoard): void => {
      targets[key].splice(0, targets[key].length, ...(saved[key] ?? []));
    }
  );

  note.value().targets = targets;
  memory.surveyedTurn = turn;

  return true;
};

// Notes the board just surveyed, for a save to keep. One note per player, kept up to date in place.
const noteSurvey = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory
): void => {
  const turn = dependencies.turn.value(),
    note = dependencies.strategyNoteRegistry.getOrCreateByKey<SurveyNote>(
      surveyNoteKey(player),
      { targets: memory.targets, turn }
    );

  note.value().targets = memory.targets;
  note.value().turn = turn;
  memory.surveyedTurn = turn;
};

// Each list is emptied in place, not replaced: `Memory` explains why.
export const surveyTargets = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge
): void => {
  if (resumeSurvey(dependencies, player, memory)) {
    return;
  }

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

  noteSurvey(dependencies, player, memory);
};

export default surveyTargets;
