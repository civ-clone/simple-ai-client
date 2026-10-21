import {
  Horseman,
  Settlers,
  Trireme,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import OverseasSettlers from '@civ-clone/base-leader-personality/Rules/Player/OverseasSettlers';
import Effect from '@civ-clone/core-rule/Effect';
import MilitaryStrength from '@civ-clone/core-power/Rules/MilitaryStrength';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
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
import {
  INVADERS,
  isFerrying,
  overseasStateFor,
  planGarrison,
  planInvasion,
  planPassenger,
  settlesOverseas,
  travel,
} from '../lib/Unit/overseas';
import civ1Knowledge from '../lib/Civ1/knowledge';
import ferry from '../lib/Unit/ferry';
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

  it('unloads a transport once a turn, so cargo that stays aboard in port takes up its own orders', async (): Promise<void> => {
    const { dependencies, game, memory, player, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(3, 2), game.rules),
      ship = trireme(5, 2) as Unit & { stow(unit: Unit): boolean },
      unload = () => {
        ship.moves().set(1);
        ship.setActive(true);
        ship.stow(explorer);

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

    // Cargo from before a load goes ashore anywhere it hasn't just come from.
    expect(unload()).true;
    expect(unload()).false;

    game.turn.increment();

    expect(unload()).true;
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

  it('sends a defender to a city on another island that is short of defenders, one at a time (#441)', async (): Promise<void> => {
    const { dependencies, game, memory, player, trireme, world } =
        await setUp(),
      defender = new Warrior(null, player, world.get(1, 1), game.rules),
      another = new Warrior(null, player, world.get(1, 2), game.rules),
      island = new City(
        player,
        world.get(7, 2),
        '',
        game.rules,
        game.workedTiles
      );

    trireme(4, 2);

    const passenger = planGarrison(
      dependencies,
      civ1Knowledge,
      player,
      memory,
      defender
    );

    expect(passenger?.role).equal('garrison');
    expect(passenger?.target === island.tile()).true;
    // That city has one on its way.
    expect(planGarrison(dependencies, civ1Knowledge, player, memory, another))
      .null;
  });

  it('counts a transport as ferrying while it has cargo or ferried last turn (#440)', async (): Promise<void> => {
    const { dependencies, game, memory, player, trireme, world } =
        await setUp(),
      ship = trireme(4, 2) as Unit & { stow(unit: Unit): boolean };

    expect(isFerrying(dependencies, memory, ship)).false;

    overseasStateFor(memory).ferried.set(ship, dependencies.turn.value());

    expect(isFerrying(dependencies, memory, ship)).true;

    game.turn.increment();
    game.turn.increment();

    expect(isFerrying(dependencies, memory, ship)).false;

    ship.stow(new Warrior(null, player, world.get(3, 2), game.rules));

    expect(isFerrying(dependencies, memory, ship)).true;
  });

  describe('invasions (#374)', (): void => {
    // An enemy with an undefended city on island B, and the units' power counted as their attack and defence.
    const withEnemy = async () => {
      const setup = await setUp(),
        { game, world } = setup,
        enemy = new Player(game.rules);

      game.rules.register(
        new MilitaryStrength(
          new Effect((unit: Unit) => ({
            attack: unit.attack().value(),
            defence: unit.defence().value(),
          }))
        )
      );
      game.playerWorlds.register(new PlayerWorld(enemy, world));

      const city = new City(
        enemy,
        world.get(7, 2),
        '',
        game.rules,
        game.workedTiles
      );

      setup.trireme(4, 2);

      return { ...setup, city, enemy };
    };

    it("sends an attacker for an enemy's city on another island", async (): Promise<void> => {
      const { city, dependencies, game, memory, player, world } =
          await withEnemy(),
        horseman = new Horseman(null, player, world.get(1, 1), game.rules),
        passenger = planInvasion(dependencies, player, memory, horseman);

      expect(passenger?.role).equal('invader');
      expect(passenger?.target === city.tile()).true;
    });

    it('leaves alone a city of a player at peace, or one too strong there', async (): Promise<void> => {
      const atPeace = await withEnemy();

      atPeace.game.interactions.register(
        new Peace(
          atPeace.player,
          atPeace.enemy,
          new Never(),
          atPeace.game.rules
        )
      );

      expect(
        planInvasion(
          atPeace.dependencies,
          atPeace.player,
          atPeace.memory,
          new Horseman(
            null,
            atPeace.player,
            atPeace.world.get(1, 1),
            atPeace.game.rules
          )
        )
      ).null;

      const strong = await withEnemy();

      for (let i = 0; i < 3; i++) {
        new Warrior(
          strong.city,
          strong.enemy,
          strong.city.tile(),
          strong.game.rules
        );
      }

      expect(
        planInvasion(
          strong.dependencies,
          strong.player,
          strong.memory,
          new Horseman(
            null,
            strong.player,
            strong.world.get(1, 1),
            strong.game.rules
          )
        )
      ).null;
    });

    it('sends up to INVADERS invaders for the same city, and not a defender', async (): Promise<void> => {
      const { dependencies, game, memory, player, world } = await withEnemy(),
        invaders = Array.from(
          { length: INVADERS + 1 },
          (value: unknown, i: number): Unit =>
            new Horseman(null, player, world.get(i % 4, i % 5), game.rules)
        );

      expect(
        invaders.map(
          (unit: Unit): boolean =>
            planInvasion(dependencies, player, memory, unit) !== null
        )
      ).eql([...Array(INVADERS).fill(true), false]);
      expect(
        planInvasion(
          dependencies,
          player,
          memory,
          new Warrior(null, player, world.get(1, 1), game.rules)
        )
      ).null;
    });
  });

  it('sails a transport out of its port city to the sea beside it, where passengers can board', async (): Promise<void> => {
    const { dependencies, game, memory, player, port, trireme, world } =
        await setUp(),
      explorer = new Warrior(null, player, world.get(3, 2), game.rules),
      ship = trireme(3, 2);

    planPassenger(dependencies, player, memory, explorer, 'explorer', [
      world.get(7, 2),
    ])!.since = 0;
    ship.setActive(true);

    expect(await ferry(dependencies, player, memory, civ1Knowledge, ship)).true;
    expect(ship.tile().isWater()).true;
    expect(ship.tile().isNeighbourOf(port.tile())).true;
  });

  it("sends overseas the share of founders its leader's OverseasSettlers says, once home is filling up", async (): Promise<void> => {
    const { dependencies, game, memory, player, world } = await setUp(),
      settlers = Array.from(
        { length: 40 },
        (): Unit => new Settlers(null, player, world.get(1, 1), game.rules)
      ),
      share = (): number =>
        settlers.filter((unit: Unit): boolean =>
          settlesOverseas(dependencies, player, memory, unit)
        ).length;

    expect(share()).equal(0);

    game.rules.register(new OverseasSettlers(new Effect(() => 0.5)));

    expect(share()).within(10, 30);

    // Not while home has plenty of room.
    memory.targets.goodSitesForCities.push(
      ...[0, 1, 2, 3, 4, 5].map((y: number) => world.get(y % 4, y % 5))
    );

    expect(share()).equal(0);
    expect(
      settlesOverseas(
        dependencies,
        player,
        memory,
        new Warrior(null, player, world.get(1, 1), game.rules)
      )
    ).false;
  });
});
