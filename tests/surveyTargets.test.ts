import DataObject from '@civ-clone/core-data-object/DataObject';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import { Game } from '@civ-clone/core-game/Game';
import StrategyNote from '@civ-clone/core-strategy/StrategyNote';
import Tile from '@civ-clone/core-world/Tile';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { expect } from 'chai';
import surveyTargets from '@civ-clone/base-strategy-ai/lib/Turn/surveyTargets';
import unitGame from './lib/unitGame';

const at = (tiles: Tile[]): string[] =>
  tiles.map((tile: Tile): string => `${tile.x()},${tile.y()}`);

// A copy of a note's value as a save and load give it back: new arrays and objects, holding the same entities.
const copyOf = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(copyOf)
    : value === null || typeof value !== 'object' || value instanceof DataObject
    ? value
    : Object.fromEntries(
        Object.entries(value).map(([key, item]): [string, unknown] => [
          key,
          copyOf(item),
        ])
      );

// What saving the game and loading it does to its notes, near enough: each comes back as a new note holding a copy.
const reload = (game: Game): void =>
  [...game.strategyNotes.entries()].forEach((note: StrategyNote): void =>
    game.strategyNotes.replace(
      new StrategyNote(note.key(), copyOf(note.value()))
    )
  );

describe('surveyTargets', (): void => {
  // Grassland, known as far as x 4, then (part way through the turn) as far as x 6.
  //   0123456789AB
  // 0 GGGGGgg?????
  // 1 GGGGGgg?????
  // 2 GGGGGgg?????
  const setup = async () => {
    const { dependencies, game, player, world } = await unitGame(
        '36G',
        3,
        12,
        Despotism,
        (tile: Tile): boolean => tile.x() <= 4
      ),
      reveal = (): void =>
        game.playerWorlds
          .getByPlayer(player)
          .register(
            ...world
              .entries()
              .filter((tile: Tile): boolean => tile.x() > 4 && tile.x() <= 6)
          );

    return { dependencies, game, player, reveal };
  };

  it('should carry on with the board the turn began with when a game saved part way through the turn is loaded', async (): Promise<void> => {
    const { dependencies, game, player, reveal } = await setup(),
      memory = createMemory();

    surveyTargets(dependencies, player, memory, civ1Knowledge);

    // A unit is sent off to explore before the save, and takes its target off the board.
    memory.targets.landTilesToExplore.splice(0, 1);

    const board = at(memory.targets.landTilesToExplore);

    expect(board).to.include('4,1');

    // The map changes before the save, as moves made earlier in the turn change it.
    reveal();
    reload(game);

    // A loaded game starts the player's turn over, with a new memory.
    const loaded = createMemory();

    surveyTargets(dependencies, player, loaded, civ1Knowledge);

    expect(at(loaded.targets.landTilesToExplore)).to.deep.equal(board);
  });

  it('should survey afresh at the start of the next turn after a game is loaded', async (): Promise<void> => {
    const { dependencies, game, player, reveal } = await setup();

    surveyTargets(dependencies, player, createMemory(), civ1Knowledge);
    reveal();
    reload(game);
    game.turn.increment();

    const loaded = createMemory();

    surveyTargets(dependencies, player, loaded, civ1Knowledge);

    expect(at(loaded.targets.landTilesToExplore))
      .to.include('6,1')
      .and.not.include('4,1');
  });

  it('should survey afresh when asked again in the same turn', async (): Promise<void> => {
    const { dependencies, player, reveal } = await setup(),
      memory = createMemory();

    surveyTargets(dependencies, player, memory, civ1Knowledge);
    reveal();
    surveyTargets(dependencies, player, memory, civ1Knowledge);

    expect(at(memory.targets.landTilesToExplore))
      .to.include('6,1')
      .and.not.include('4,1');
  });
});
