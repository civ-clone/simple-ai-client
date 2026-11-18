// Warships at war (civ-clone/web-renderer#1128): hunting, escorting and bombarding, and building them, only where the
//  ruleset declares unit roles (base-unit-role), as Civ2 does. Built here on a small Civ1 game with Civ1's ships, with
//  and without roles registered: without them (Civ1 as it is) nothing changes.
import {
  Battleship,
  Carrier,
  Cruiser,
  Musketman,
  Submarine,
  Transport,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import { ActiveUnit } from '@civ-clone/civ1-unit/PlayerActions';
import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Firepower, HitPoints } from '@civ-clone/core-unit/Yields';
import {
  NavalSuperiorityRole,
  TransportRole,
} from '@civ-clone/base-unit-role/Roles';
import buildItemInCity, {
  defaultProductionPolicy,
} from '../lib/Civ1/buildItemInCity';
import planNavalTask, {
  bombardTargets,
  huntTargets,
  isWarshipType,
  transportsToEscort,
  warshipsWanted,
} from '../lib/Unit/navalWar';
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import NavalWar from '../Strategies/Unit/NavalWar';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import Unit from '@civ-clone/core-unit/Unit';
import UnitYield from '@civ-clone/core-unit/Rules/Yield';
import Yield from '@civ-clone/core-yield/Yield';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import requiredAdvances from '@civ-clone/civ1-unit/lib/requiredAdvances';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

// Land at x 0-2 and sea at x 3-15, 10 rows (or `height`): the player's port at (2, 4).

const setUp = async ({
  roles = true,
  height = 10,
}: { roles?: boolean; height?: number } = {}) => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableCityBuildItems.register(
    ...([
      Warrior,
      Cruiser,
      Submarine,
      Carrier,
      Transport,
    ] as unknown as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);
  game.pathFinders.register(BasePathFinder);

  // Every unit has hit points and firepower, as Civ2's do, for the odds.
  game.rules.register(
    ...(
      [
        [HitPoints, 10],
        [Firepower, 1],
      ] as [typeof Yield, number][]
    ).map(
      ([YieldType, value]) =>
        new UnitYield(
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean =>
              unitYield instanceof YieldType
          ),
          new Effect((unit: Unit, unitYield: Yield): void =>
            unitYield.set(value)
          )
        )
    )
  );

  if (roles) {
    game.rules.register(
      unitRole('test:role', Cruiser, NavalSuperiorityRole),
      unitRole('test:role', Battleship, NavalSuperiorityRole),
      unitRole('test:role', Submarine, NavalSuperiorityRole),
      // A carrier is a naval superiority type in Civ2 too, but carries aircraft: no warship.
      unitRole('test:role', Carrier, NavalSuperiorityRole),
      unitRole('test:role', Transport, TransportRole)
    );
  }

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '3G13O'.repeat(height),
      height,
      16
    ),
    player = new Player(game.rules),
    enemy = new Player(game.rules),
    research = new PlayerResearch(player, game.advances, game.rules);

  game.players.register(player, enemy);
  game.playerResearch.register(research);
  requiredAdvances
    .filter(([UnitType]) =>
      [Cruiser, Submarine, Carrier, Transport].includes(UnitType as any)
    )
    .forEach(([, Advance]) => research.addAdvance(Advance as any));
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.register(new PlayerWorld(enemy, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new Monarchy());

  const port = new City(
    player,
    world.get(2, 4),
    '',
    game.rules,
    game.workedTiles
  );

  port.yields = () => [new Production(20)];
  game.unitImprovements.register(
    new Fortified(new Musketman(port, player, port.tile(), game.rules))
  );

  const dependencies = createDependencies(dependenciesFor(game)),
    memory = createMemory(),
    unitOf = <T extends Unit>(
      owner: Player,
      UnitType: new (...args: any[]) => T,
      x: number,
      y: number
    ): T => {
      const unit = new UnitType(
        null,
        owner,
        world.get(x, y),
        game.rules,
        game.transports
      );

      if (!game.units.includes(unit)) {
        game.units.register(unit);
      }

      return unit;
    },
    // A transport of `owner`'s at `x`, `y` with a Warrior aboard.
    loaded = (owner: Player, x: number, y: number): Transport => {
      const transport = unitOf(owner, Transport, x, y);

      transport.stow(unitOf(owner, Warrior, x, y));

      return transport;
    },
    // Puts the enemy units and cities on the player's target board, as the survey would.
    survey = (): void => {
      memory.targets.enemyUnitsToAttack.splice(
        0,
        Infinity,
        ...[
          ...new Set(
            game.units
              .entries()
              .filter((unit: Unit) => unit.player() === enemy)
              .map((unit: Unit) => unit.tile())
          ),
        ].filter((tile) => game.cities.getByTile(tile) === null)
      );
      memory.targets.enemyCitiesToAttack.splice(
        0,
        Infinity,
        ...game.cities
          .entries()
          .filter((city: City) => city.player() === enemy)
          .map((city: City) => city.tile())
      );
    };

  return {
    dependencies,
    enemy,
    game,
    loaded,
    memory,
    player,
    port,
    survey,
    unitOf,
    world,
  };
};

describe('naval war (civ-clone/web-renderer#1128)', (): void => {
  describe('warships by role', (): void => {
    it('takes a naval superiority type as a warship, but not a carrier or a transport', async (): Promise<void> => {
      const { dependencies } = await setUp(),
        { ruleRegistry } = dependencies;

      expect(isWarshipType(Cruiser, ruleRegistry)).true;
      expect(isWarshipType(Submarine, ruleRegistry)).true;
      expect(isWarshipType(Carrier, ruleRegistry)).false;
      expect(isWarshipType(Transport, ruleRegistry)).false;
      expect(isWarshipType(Warrior, ruleRegistry)).false;
    });

    it('has no warships in a ruleset with no roles (Civ1)', async (): Promise<void> => {
      const { dependencies, player, unitOf } = await setUp({ roles: false }),
        cruiser = unitOf(player, Cruiser, 5, 4),
        strategy = new NavalWar(dependencies, civ1Knowledge);

      expect(isWarshipType(Cruiser, dependencies.ruleRegistry)).false;
      expect(isWarshipType(Submarine, dependencies.ruleRegistry)).false;
      expect(strategy.handles(new PlayerAction(player, cruiser) as any)).false;
    });

    it('handles a warship, and no other ship', async (): Promise<void> => {
      const { dependencies, player, unitOf } = await setUp(),
        strategy = new NavalWar(dependencies, civ1Knowledge);

      expect(
        strategy.handles(
          new PlayerAction(player, unitOf(player, Cruiser, 5, 4)) as any
        )
      ).true;
      expect(
        strategy.handles(
          new PlayerAction(player, unitOf(player, Transport, 5, 5)) as any
        )
      ).false;
      expect(
        strategy.handles(
          new PlayerAction(player, unitOf(player, Carrier, 5, 6)) as any
        )
      ).false;
    });
  });

  describe('hunting', (): void => {
    it('goes for a loaded transport before a nearer empty ship, and only those it would beat', async (): Promise<void> => {
      const { dependencies, enemy, loaded, memory, player, survey, unitOf } =
          await setUp(),
        cruiser = unitOf(player, Cruiser, 5, 4),
        empty = unitOf(enemy, Transport, 8, 4),
        full = loaded(enemy, 10, 4),
        // A Battleship (defence 12) the Cruiser (attack 6) wouldn't beat.
        battleship = unitOf(enemy, Battleship, 5, 7);

      survey();

      const targets = huntTargets(dependencies, player, memory, cruiser);

      expect(targets[0]).equal(full.tile());
      expect(targets).include(empty.tile());
      expect(targets).not.include(battleship.tile());
    });

    it("leaves a treaty partner's ships alone", async (): Promise<void> => {
      const {
          dependencies,
          enemy,
          game,
          loaded,
          memory,
          player,
          survey,
          unitOf,
        } = await setUp(),
        cruiser = unitOf(player, Cruiser, 5, 4);

      loaded(enemy, 8, 4);
      survey();
      game.interactions.register(new Peace(player, enemy, game.rules));

      expect(huntTargets(dependencies, player, memory, cruiser)).empty;
      expect(planNavalTask(dependencies, player, memory, cruiser)).null;
    });

    it('sails for the sea beside its prey, and strikes it once beside it', async (): Promise<void> => {
      const { dependencies, enemy, loaded, memory, player, survey, unitOf } =
          await setUp(),
        cruiser = unitOf(player, Cruiser, 5, 4),
        prey = loaded(enemy, 9, 4);

      survey();

      expect(planNavalTask(dependencies, player, memory, cruiser)).eql({
        task: 'hunt',
        strike: null,
      });
      expect(
        memory.unitPathData.get(cruiser)?.end()?.isNeighbourOf(prey.tile())
      ).true;

      cruiser.setTile(
        prey
          .tile()
          .getNeighbours()
          .find((tile) => tile.isWater() && tile.x() < 9)!
      );

      const planned = planNavalTask(dependencies, player, memory, cruiser);

      expect(planned?.task).equal('hunt');
      expect(planned?.strike).equal(prey.tile());
    });
  });

  describe('escorting', (): void => {
    it("sails with one of its player's loaded transports at sea, one warship to each", async (): Promise<void> => {
      const { dependencies, loaded, memory, player, unitOf } = await setUp(),
        first = unitOf(player, Cruiser, 5, 4),
        second = unitOf(player, Cruiser, 5, 5),
        transport = loaded(player, 7, 4);

      expect(transportsToEscort(dependencies, player, memory, first)).eql([
        transport,
      ]);
      expect(planNavalTask(dependencies, player, memory, first)?.task).equal(
        'escort'
      );
      expect(memory.unitPathData.get(first)?.end()).equal(transport.tile());
      expect(transportsToEscort(dependencies, player, memory, second)).empty;
      expect(planNavalTask(dependencies, player, memory, second)).null;
    });

    it('leaves the escorting to surface ships', async (): Promise<void> => {
      const { dependencies, loaded, memory, player, unitOf } = await setUp(),
        submarine = unitOf(player, Submarine, 5, 4);

      loaded(player, 7, 4);

      expect(transportsToEscort(dependencies, player, memory, submarine)).empty;
    });

    it('leaves an empty transport, or one in port, alone', async (): Promise<void> => {
      const { dependencies, memory, player, port, unitOf } = await setUp(),
        cruiser = unitOf(player, Cruiser, 5, 4);

      unitOf(player, Transport, 7, 4);
      unitOf(player, Transport, 2, 4).stow(
        unitOf(player, Warrior, 2, 4),
        port.tile()
      );

      expect(transportsToEscort(dependencies, player, memory, cruiser)).empty;
    });
  });

  describe('bombarding', (): void => {
    const withEnemyCity = async () => {
      const setup = await setUp(),
        { enemy, game, unitOf, world } = setup,
        // An enemy port down the coast from the player's.
        city = new City(
          enemy,
          world.get(2, 8),
          '',
          game.rules,
          game.workedTiles
        );

      unitOf(enemy, Warrior, 2, 8);

      return { ...setup, city };
    };

    it("goes for the sea beside an enemy's defended coastal city it would win at, a surface ship only", async (): Promise<void> => {
      const { city, dependencies, memory, player, survey, unitOf } =
          await withEnemyCity(),
        cruiser = unitOf(player, Cruiser, 5, 8),
        submarine = unitOf(player, Submarine, 5, 7);

      survey();

      expect(bombardTargets(dependencies, player, memory, cruiser)).eql([
        city.tile(),
      ]);
      expect(bombardTargets(dependencies, player, memory, submarine)).empty;
      expect(planNavalTask(dependencies, player, memory, cruiser)?.task).equal(
        'bombard'
      );
      expect(
        memory.unitPathData.get(cruiser)?.end()?.isNeighbourOf(city.tile())
      ).true;
    });

    it("leaves an empty city alone: a ship can't take it", async (): Promise<void> => {
      const {
          dependencies,
          enemy,
          game,
          memory,
          player,
          survey,
          unitOf,
          world,
        } = await setUp(),
        cruiser = unitOf(player, Cruiser, 5, 8);

      new City(enemy, world.get(2, 8), '', game.rules, game.workedTiles);
      survey();

      expect(bombardTargets(dependencies, player, memory, cruiser)).empty;
    });
  });

  describe('building warships', (): void => {
    const choose = (setup: Awaited<ReturnType<typeof setUp>>): unknown => {
      buildItemInCity(
        setup.dependencies,
        setup.player,
        setup.memory.targets,
        setup.port,
        defaultProductionPolicy
      );

      return setup.game.cityBuilds.getByCity(setup.port).building()?.item();
    };

    it('builds a warship in a port with an enemy ship in reach', async (): Promise<void> => {
      const setup = await setUp();

      setup.loaded(setup.enemy, 8, 4);
      setup.survey();

      expect(
        isWarshipType(choose(setup) as object, setup.dependencies.ruleRegistry)
      ).true;
    });

    it('builds none with no enemy in reach, nor in a ruleset with no roles (Civ1)', async (): Promise<void> => {
      const quiet = await setUp();

      expect(
        isWarshipType(choose(quiet) as object, quiet.dependencies.ruleRegistry)
      ).false;

      const civ1 = await setUp({ roles: false });

      civ1.loaded(civ1.enemy, 8, 4);
      civ1.survey();

      expect(choose(civ1)).not.oneOf([Cruiser, Submarine, Battleship]);
    });

    it('builds a surface ship, not a submarine, for a city to bombard alone', async (): Promise<void> => {
      const setup = await setUp();

      new City(
        setup.enemy,
        setup.world.get(2, 8),
        '',
        setup.game.rules,
        setup.game.workedTiles
      );
      setup.unitOf(setup.enemy, Warrior, 2, 8);
      setup.survey();

      expect(choose(setup)).equal(Cruiser);
    });

    it('stops once it has one warship for every two threatened ports', async (): Promise<void> => {
      const setup = await setUp();

      setup.loaded(setup.enemy, 8, 4);
      setup.unitOf(setup.player, Cruiser, 3, 4);
      setup.survey();

      expect(
        isWarshipType(choose(setup) as object, setup.dependencies.ruleRegistry)
      ).false;
    });
    it('wants one more for each transport in use while any port is threatened, and a submarine only once surface ships outnumber them', async (): Promise<void> => {
      const setup = await setUp({ height: 30 }),
        { dependencies, enemy, loaded, player, port, unitOf, world, game } =
          setup,
        // A second port, out of reach of the enemy ship.
        other = new City(
          player,
          world.get(2, 16),
          '',
          game.rules,
          game.workedTiles
        );

      loaded(enemy, 8, 4);
      setup.survey();

      expect(
        warshipsWanted(dependencies, player, setup.memory.targets, port)
      ).eql({ wanted: 1, have: 0, submarines: false });
      // The quiet port builds none while no transport is in use.
      expect(warshipsWanted(dependencies, player, setup.memory.targets, other))
        .null;

      loaded(player, 3, 16);

      expect(
        warshipsWanted(dependencies, player, setup.memory.targets, other)
      ).eql({ wanted: 2, have: 0, submarines: false });

      unitOf(player, Cruiser, 3, 2);

      expect(
        warshipsWanted(dependencies, player, setup.memory.targets, port)
      ).eql({ wanted: 2, have: 1, submarines: true });
    });
  });

  describe('the strategy', (): void => {
    // The player's memory as the strategy reads it, with the enemy on its board.
    const boardFor = (setup: Awaited<ReturnType<typeof setUp>>) => {
      const memory = setup.dependencies.memoryRegistry.memoryFor(setup.player);

      setup.survey();
      memory.targets.enemyUnitsToAttack.splice(
        0,
        Infinity,
        ...setup.memory.targets.enemyUnitsToAttack
      );
      memory.targets.enemyCitiesToAttack.splice(
        0,
        Infinity,
        ...setup.memory.targets.enemyCitiesToAttack
      );

      return memory;
    };

    const ready = (unit: Unit): void => {
      unit.moves().set(unit.movement().value());
      unit.setActive(true);
    };

    it('waits for its transport to move, then sails alongside it and stays there', async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, loaded, player, unitOf } = setup,
        cruiser = unitOf(player, Cruiser, 5, 4),
        transport = loaded(player, 8, 4),
        strategy = new NavalWar(dependencies, civ1Knowledge);

      boardFor(setup);
      ready(cruiser);
      ready(transport);

      expect(await strategy.attempt(new ActiveUnit(player, cruiser))).true;
      expect(cruiser.waiting()).true;
      expect(cruiser.tile()).equal(setup.world.get(5, 4));

      // The transport has moved.
      transport.moves().set(0);

      expect(await strategy.attempt(new ActiveUnit(player, cruiser))).true;
      expect(cruiser.tile()).equal(transport.tile());
      // Stood down there for the turn (`NoOrders`), rather than sailing on with its moves to spare.
      expect(cruiser.moves().value()).equal(0);
    });

    it('strikes an enemy ship beside it', async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, enemy, loaded, player, unitOf } = setup,
        cruiser = unitOf(player, Cruiser, 5, 4),
        prey = loaded(enemy, 6, 4),
        strategy = new NavalWar(dependencies, civ1Knowledge);

      boardFor(setup);
      ready(cruiser);

      const moves = cruiser.moves().value();

      expect(await strategy.attempt(new ActiveUnit(player, cruiser))).true;
      expect(
        prey.destroyed() ||
          cruiser.destroyed() ||
          cruiser.moves().value() < moves
      ).true;
      expect(cruiser.tile()).equal(setup.world.get(5, 4));
    });

    it('handles nothing with no task, leaving the ship to the other strategies', async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, player, unitOf } = setup,
        cruiser = unitOf(player, Cruiser, 5, 4);

      boardFor(setup);
      ready(cruiser);

      expect(
        await new NavalWar(dependencies, civ1Knowledge).attempt(
          new ActiveUnit(player, cruiser)
        )
      ).false;
    });
  });
});
