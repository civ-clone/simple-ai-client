import * as Advances from '@civ-clone/civ1-science/Advances';
import { Trireme, Warrior } from '@civ-clone/civ1-unit/Units';
import Advance from '@civ-clone/core-science/Advance';
import ChooseResearch from '../Strategies/Science/ChooseResearch';
import City from '@civ-clone/core-city/City';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import Tile from '@civ-clone/core-world/Tile';
import World from '@civ-clone/core-world/World';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1Knowledge from '../lib/Civ1/knowledge';
import Path from '@civ-clone/core-world-path/Path';
import coastalPath from '../lib/Unit/coastalPath';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import explorerShipFor from '../lib/City/explorerShip';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import islandBound from '../lib/Player/islandBound';
import moveUnit from '../lib/Unit/moveUnit';
import scienceRules from '@civ-clone/civ1-science/registerRules';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import transportResearch from '../lib/Science/transportResearch';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

// A Civ1 game on `rle` (`height` rows of `width`), with one player who knows the whole map and every advance in
//  `known`.
const setUp = async (
  rle: string,
  height: number,
  width: number,
  known: (typeof Advance)[] = [],
  unseen: [number, number][] = [],
  science: boolean = true
) => {
  const game = new Game();

  game.availableGovernments.register(Despotism);
  game.availableCityBuildItems.register(
    ...([Warrior, Trireme] as unknown as IBuildable[])
  );
  game.advances.register(
    ...(Object.values(Advances) as unknown as (typeof Advance)[]).filter(
      (AdvanceType) => AdvanceType !== Advances.FutureTechnology
    )
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  if (science) {
    scienceRules(game);
  }
  unitRules(game);
  worldRules(game);

  const world: World = await simpleRLELoader(game.rules, game.terrainFeatures)(
      rle,
      height,
      width
    ),
    player = new Player(game.rules),
    research = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(research);
  known.forEach((AdvanceType) => research.addAdvance(AdvanceType));
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds
    .getByPlayer(player)
    .register(
      ...world
        .entries()
        .filter(
          (tile: Tile): boolean =>
            !unseen.some(([x, y]): boolean => tile.x() === x && tile.y() === y)
        )
    );
  game.playerGovernments.getByPlayer(player).set(new Despotism());

  const dependencies = createDependencies(dependenciesFor(game)),
    memory = dependencies.memoryRegistry.memoryFor(player),
    city = (x: number, y: number): City =>
      new City(player, world.get(x, y), '', game.rules, game.workedTiles),
    // A memory that has surveyed this turn and found `sites` and `land` to explore.
    surveyed = (sites: Tile[] = [], land: Tile[] = []) => {
      memory.surveyedTurn = dependencies.turn.value() + surveys++;
      memory.targets.goodSitesForCities.splice(0, Infinity, ...sites);
      memory.targets.landTilesToExplore.splice(0, Infinity, ...land);

      return memory;
    };

  let surveys = 0;

  return {
    city,
    dependencies,
    game,
    memory,
    player,
    research,
    surveyed,
    world,
  };
};

// Island A at x 0-3 and island B at x 6-8, 5 tall.
const twoIslands = '4G2O3G1O'.repeat(5);

describe('islandBound (civ-clone/web-renderer#632)', (): void => {
  it('is bound with no site left on its explored island, whatever is overseas', async (): Promise<void> => {
    const { city, dependencies, player, surveyed, world } = await setUp(
      twoIslands,
      5,
      10
    );

    expect(islandBound(dependencies, player, surveyed())).false;

    city(1, 2);

    expect(islandBound(dependencies, player, surveyed())).true;
    expect(islandBound(dependencies, player, surveyed([world.get(7, 2)]))).true;
    expect(islandBound(dependencies, player, surveyed([world.get(3, 4)])))
      .false;
  });

  it('is not bound before its first survey', async (): Promise<void> => {
    const { city, dependencies, memory, player } = await setUp(
      twoIslands,
      5,
      10
    );

    city(1, 2);

    expect(memory.surveyedTurn).null;
    expect(islandBound(dependencies, player, memory)).false;
  });

  it('is not bound while its island has land to explore it has not seen', async (): Promise<void> => {
    const known = await setUp(twoIslands, 5, 10),
      unknown = await setUp(twoIslands, 5, 10, [], [[0, 0]]);

    // It knows its whole island: a coastal tile beside unseen sea doesn't keep it from being bound.
    known.city(1, 2);

    expect(
      islandBound(
        known.dependencies,
        known.player,
        known.surveyed([], [known.world.get(3, 0)])
      )
    ).true;

    unknown.city(1, 2);

    expect(
      islandBound(
        unknown.dependencies,
        unknown.player,
        unknown.surveyed([], [unknown.world.get(3, 0)])
      )
    ).false;
  });

  it('is no longer bound once it has a city on land with room', async (): Promise<void> => {
    const { city, dependencies, player, surveyed, world } = await setUp(
      twoIslands,
      5,
      10
    );

    city(1, 2);
    city(7, 0);

    expect(islandBound(dependencies, player, surveyed([world.get(7, 4)])))
      .false;
  });
});

describe('transportResearch (civ-clone/web-renderer#632)', (): void => {
  it('researches the way to the nearest transport, from the requirements', async (): Promise<void> => {
    const { dependencies, research } = await setUp(twoIslands, 5, 10);

    expect(transportResearch(dependencies, research)).equal(Advances.Alphabet);

    research.addAdvance(Advances.Alphabet);

    expect(transportResearch(dependencies, research)).equal(Advances.MapMaking);

    research.addAdvance(Advances.MapMaking);

    expect(transportResearch(dependencies, research)).null;
  });

  it('is what a player bound to its island researches, and only then', async (): Promise<void> => {
    const { city, dependencies, player, research, surveyed, world } =
        await setUp(twoIslands, 5, 10, [Advances.Alphabet]),
      strategy = new ChooseResearch(dependencies, civ1Knowledge),
      choose = (): string | null => {
        const action = new PlayerAction(player, research);

        expect(strategy.attempt(action)).true;

        return research.researching()?.name ?? null;
      };

    city(1, 2);
    surveyed();

    for (let i = 0; i < 20; i++) {
      expect(choose()).equal('MapMaking');
    }

    // A site on its own island: it chooses as it always has, at random among everything available.
    surveyed([world.get(3, 4)]);

    const choices = new Set<string | null>();

    for (let i = 0; i < 40; i++) {
      choices.add(choose());
    }

    expect(choices.size).greaterThan(1);
  });
});

describe('explorerShipFor, bound to an island (civ-clone/web-renderer#632)', (): void => {
  it("builds a ship to explore with in a player's only city once it's bound", async (): Promise<void> => {
    // Island A at x 0-3 in a sea 16 wide.
    const { city, dependencies, game, player, surveyed, world } = await setUp(
        '4G16O'.repeat(5),
        5,
        20,
        [Advances.Alphabet, Advances.MapMaking],
        [],
        false
      ),
      port = city(3, 2);

    port.yields = () => [new Production(10)];

    new Warrior(port, player, port.tile(), game.rules);

    const sea = [world.get(12, 2)];

    surveyed();
    dependencies.memoryRegistry
      .memoryFor(player)
      .targets.seaTilesToExplore.push(...sea);

    expect(
      explorerShipFor(
        dependencies,
        player,
        dependencies.memoryRegistry.memoryFor(player),
        port,
        civ1Knowledge
      )
    ).equal(Trireme);

    // A site left at home: a player's only city has better things to build.
    surveyed([world.get(1, 0)]);
    dependencies.memoryRegistry
      .memoryFor(player)
      .targets.seaTilesToExplore.push(...sea);

    expect(
      explorerShipFor(
        dependencies,
        player,
        dependencies.memoryRegistry.memoryFor(player),
        port,
        civ1Knowledge
      )
    ).null;
  });
});

describe('coastalPath (civ-clone/web-renderer#632)', (): void => {
  // Land along the top and down both sides, open sea in the middle: `x` marks water beside no land.
  //  GGGGGGGGG
  //  GOOOOOOOG
  //  GOxxxxxOG
  //  GOxxxxxOG
  //  GOxxxxxOG
  //  GOOOOOOOG
  //  GGGGGGGGG
  const map = '9G' + '1G7O1G'.repeat(5) + '9G';

  it('keeps to water beside land all the way', async (): Promise<void> => {
    const { game, player, world } = await setUp(map, 7, 9),
      ship = new Trireme(null, player, world.get(1, 3), game.rules),
      path = coastalPath(ship, world.get(7, 3))!;

    expect(path).not.null;
    expect(path.end()).equal(world.get(7, 3));
    path.entries().forEach((tile: Tile): void => {
      expect(tile.isWater() && tile.isCoast()).true;
    });
  });

  it('ends beside a tile out at sea', async (): Promise<void> => {
    const { game, player, world } = await setUp(map, 7, 9),
      ship = new Trireme(null, player, world.get(7, 3), game.rules),
      path = coastalPath(ship, world.get(2, 3))!;

    expect(path).not.null;
    expect(path.end().isNeighbourOf(world.get(2, 3))).true;
    expect(path.end().isCoast()).true;
  });

  it('goes as near as the coast goes to open sea it has no way beside', async (): Promise<void> => {
    const { game, player, world } = await setUp(map, 7, 9),
      ship = new Trireme(null, player, world.get(1, 3), game.rules),
      path = coastalPath(ship, world.get(4, 3))!;

    expect(path).not.null;
    expect(path.end().isCoast()).true;
    expect(path.end().distanceFrom(world.get(4, 3))).equal(2);
    // Already as near as it can get.
    expect(
      coastalPath(
        new Trireme(null, player, path.end(), game.rules),
        world.get(4, 3)
      )
    ).null;
  });

  it('takes a Trireme along the coast where its path crosses open sea', async (): Promise<void> => {
    const { dependencies, game, memory, player, world } = await setUp(
        map,
        7,
        9
      ),
      ship = new Trireme(
        null,
        player,
        world.get(1, 3),
        game.rules,
        game.transports
      ),
      path = new Path();

    // Straight across: from (2, 3) on, out of reach of the coast.
    [2, 3, 4, 5, 6, 7].forEach((x: number): void => {
      path.push(world.get(x, 3));
    });
    memory.unitPathData.set(ship, path);

    await moveUnit(dependencies, player, memory, civ1Knowledge, ship, {
      stopAtPathEnd: true,
      wander: false,
    });

    expect(ship.tile()).not.equal(world.get(1, 3));
    expect(ship.tile().isCoast()).true;
    expect(memory.unitPathData.get(ship)?.end()).equal(world.get(7, 3));
  });
});
