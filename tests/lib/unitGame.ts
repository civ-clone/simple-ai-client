// A small Civ1 game for testing what units do over several turns: one player who knows the whole map, the strategy
//  pack in a registry of its own, and a turn that runs the `BeforeTurn` strategies and then each of the player's
//  mandatory actions until none is left, as `StrategyAIClient#takeTurn` does (without `AfterTurn`).
import { Fortify } from '@civ-clone/civ1-unit/Actions';
import { Game } from '@civ-clone/core-game/Game';
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import City from '@civ-clone/core-city/City';
import { CeremonialBurial } from '@civ-clone/civ1-science/Advances';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import StrategyRegistry from '@civ-clone/core-strategy/StrategyRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import World from '@civ-clone/core-world/World';
import cityHappinessRules from '@civ-clone/civ1-city-happiness/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { createStrategies, dependenciesFor } from '../../registerStrategies';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import playerTurnStart from '@civ-clone/civ1-player/Rules/Player/turn-start';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

export type UnitGame = {
  dependencies: Dependencies;
  game: Game;
  player: Player;
  world: World;
  // A city of `size` for the player at `x`, `y`.
  addCity: (x: number, y: number, size?: number) => City;
  // A unit of the player's at `x`, `y`, supported by `city` if given.
  addUnit: <T extends Unit>(
    UnitType: new (...args: any[]) => T,
    x: number,
    y: number,
    city?: City | null
  ) => T;
  // Fortifies `unit` where it stands, as the Fortify action does: it's fortified from the start of the next turn.
  fortify: (unit: Unit) => void;
  // Plays `n` of the player's turns, calling `after` at the end of each.
  takeTurns: (n?: number, after?: () => void) => Promise<void>;
};

// `map` is a `simpleRLELoader` map, `height` rows of `width` tiles, of which the player knows those `known` accepts.
export const unitGame = async (
  map: string,
  height: number,
  width: number,
  Governments: typeof Government,
  known: (tile: Tile) => boolean = () => true
): Promise<UnitGame> => {
  const game = new Game();

  game.availableGovernments.register(Governments);
  // Something for a city to build, or its choice is offered for ever.
  game.availableCityBuildItems.register(Warrior as unknown as IBuildable);

  cityRules(game);
  cityHappinessRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);
  game.rules.register(...playerTurnStart(game.rules, game.cities, game.units));
  game.pathFinders.register(BasePathFinder);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      map,
      height,
      width
    ),
    player = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.players.register(player);
  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(CeremonialBurial);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds
    .getByPlayer(player)
    .register(...world.entries().filter(known));
  game.playerGovernments.getByPlayer(player).set(new Governments());

  const dependencies = dependenciesFor(game),
    registry = new StrategyRegistry();

  registry.register(...createStrategies(dependencies));

  return {
    dependencies,
    game,
    player,
    world,
    addCity: (x: number, y: number, size: number = 1): City => {
      const city = new City(
          player,
          world.get(x, y),
          `City ${x},${y}`,
          game.rules,
          game.workedTiles
        ),
        cityGrowth = game.cityGrowth.getByCity(city);

      if (!game.cities.includes(city)) {
        game.cities.register(city);
      }

      while (cityGrowth.size() < size) {
        cityGrowth.grow();
      }

      return city;
    },
    addUnit: <T extends Unit>(
      UnitType: new (...args: any[]) => T,
      x: number,
      y: number,
      city: City | null = null
    ): T => {
      const unit = new UnitType(city, player, world.get(x, y), game.rules);

      // `civ1-unit`'s `Created` rule registers it in a game with the engine running. Here it's done by hand.
      if (!game.units.includes(unit)) {
        game.units.register(unit);
      }

      return unit;
    },
    fortify: (unit: Unit): void => {
      const fortify = unit
        .actions()
        .find((action): boolean => action instanceof Fortify);

      if (!fortify) {
        throw new Error(`${unit.constructor.name} can't fortify`);
      }

      unit.action(fortify);
    },
    takeTurns: async (
      n: number = 1,
      after: () => void = () => {}
    ): Promise<void> => {
      while (n--) {
        game.rules.process(TurnStart, player);

        await registry.attemptAll(new BeforeTurn(player, player));

        let actions = 0;

        for (
          let action = player.mandatoryAction();
          action !== undefined;
          action = player.mandatoryAction()
        ) {
          if (actions++ > 100) {
            throw new Error('too many actions in one turn');
          }

          if (!(await registry.attempt(action))) {
            break;
          }
        }

        game.rules.process(TurnEnd, player);
        game.turn.increment();

        after();
      }
    },
  };
};

// Where `unit` stands, as `x,y`.
export const at = (unit: Unit): string =>
  `${unit.tile().x()},${unit.tile().y()}`;

// Whether any tile in `tiles`, one per turn, is the same as two turns before but not as the turn between: a unit
//  pacing between two tiles.
export const paces = (tiles: Tile[] | string[]): boolean =>
  tiles.some(
    (tile, i): boolean =>
      i >= 2 && tile === tiles[i - 2] && tile !== tiles[i - 1]
  );

export default unitGame;
