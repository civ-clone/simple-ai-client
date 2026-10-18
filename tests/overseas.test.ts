import { Trireme, Warrior } from '@civ-clone/civ1-unit/Units';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import { MapMaking } from '@civ-clone/civ1-science/Advances';
import City from '@civ-clone/core-city/City';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import Unit from '@civ-clone/core-unit/Unit';
import { Unload } from '@civ-clone/library-unit/Actions';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import { ferryShipFor } from '../lib/City/explorerShip';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import { overseasStateFor, planPassenger, travel } from '../lib/Unit/overseas';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import unloadTransport from '../lib/Unit/unloadTransport';
import worldRules from '@civ-clone/civ1-world/registerRules';

// Two islands, A at x 0-3 and B at x 6-8, 5 tall. The sea at x 4 touches only A, at x 5 only B, and at x 9 both (the map
//  wraps). The player's port is on A's coast at (3, 2).
const setUp = async () => {
  const game = new Game();

  game.availableGovernments.register(Despotism);
  game.availableCityBuildItems.register(
    ...([Warrior, Trireme] as unknown as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '4G2O3G1O'.repeat(5),
      5,
      10
    ),
    player = new Player(game.rules);

  const research = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(research);
  // For Triremes.
  research.addAdvance(MapMaking);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new Despotism());

  const port = new City(
    player,
    world.get(3, 2),
    '',
    game.rules,
    game.workedTiles
  );

  port.yields = () => [new Production(10)];

  const dependencies = createDependencies(dependenciesFor(game)),
    memory = createMemory(),
    trireme = (x: number, y: number): Unit =>
      new Trireme(null, player, world.get(x, y), game.rules, game.transports);

  return { dependencies, game, memory, player, port, trireme, world };
};

describe('overseas (civ-clone/web-renderer#211, #374)', (): void => {
  it('sends a unit to a target on another island, from the port nearest it, and not to one on its own', async (): Promise<void> => {
    const { dependencies, game, memory, player, port, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(1, 1), game.rules);

    trireme(4, 2);

    expect(
      planPassenger(dependencies, player, memory, explorer, 'explorer', [
        world.get(0, 0),
      ])
    ).null;

    const passenger = planPassenger(
      dependencies,
      player,
      memory,
      explorer,
      'explorer',
      [world.get(0, 0), world.get(7, 2)]
    );

    expect(passenger?.target).equal(world.get(7, 2));
    expect(passenger?.port).equal(port);
  });

  it('boards a transport alongside its port, and waits in port without one', async (): Promise<void> => {
    const { dependencies, game, memory, player, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(3, 2), game.rules),
      ship = trireme(4, 0),
      passenger = planPassenger(
        dependencies,
        player,
        memory,
        explorer,
        'explorer',
        [world.get(7, 2)]
      )!;

    // The ship isn't alongside: it waits.
    expect(travel(dependencies, player, memory, explorer, passenger)).true;
    expect(game.transports.hasUnit(explorer)).false;
    expect(passenger.since).not.null;

    explorer.moves().set(1);
    explorer.setActive(true);
    ship.setTile(world.get(4, 2));

    expect(travel(dependencies, player, memory, explorer, passenger)).true;
    expect(game.transports.hasUnit(explorer)).true;
  });

  it("unloads passengers only beside their target's island", async (): Promise<void> => {
    const { dependencies, game, memory, player, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(3, 2), game.rules),
      ship = trireme(4, 2) as Unit & { stow(unit: Unit): boolean },
      passenger = planPassenger(
        dependencies,
        player,
        memory,
        explorer,
        'explorer',
        [world.get(7, 2)]
      )!,
      unloadAt = (x: number) => {
        ship.setTile(world.get(x, 2));
        ship.moves().set(1);
        ship.setActive(true);

        return unloadTransport(
          dependencies,
          memory,
          ship,
          ship.tile(),
          ship.actions().find((action) => action instanceof Unload) as
            | Unload
            | undefined
        );
      };

    ship.stow(explorer);
    overseasStateFor(memory).origins.set(explorer, new Set([world.get(3, 2)]));

    expect(passenger.target).equal(world.get(7, 2));
    expect(unloadAt(4)).false;
    expect(unloadAt(5)).true;
    expect(overseasStateFor(memory).passengers.has(explorer)).false;
  });

  it('builds a transport in a port where passengers have waited, unless one is free', async (): Promise<void> => {
    const { dependencies, game, memory, player, port, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(3, 2), game.rules),
      ship = trireme(5, 0);

    overseasStateFor(memory).passengers.set(explorer, {
      target: world.get(7, 2),
      role: 'explorer',
      port,
      since: 0,
    });

    game.turn.increment();
    game.turn.increment();

    // An empty transport is free to come.
    expect(ferryShipFor(dependencies, player, memory, port)).null;

    game.units.unregister(ship);

    expect(ferryShipFor(dependencies, player, memory, port)).equal(Trireme);
  });
});
