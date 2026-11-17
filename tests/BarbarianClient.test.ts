import {
  Battleship,
  Cannon,
  Diplomat,
  Horseman,
  Musketman,
  Nuclear,
  Swordman,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import {
  generateGenerator,
  generateWorld,
} from '@civ-clone/core-world/tests/lib/buildWorld';
import { isLeader, leaderGivesUp, leaves, sail } from '../lib/Barbarian/raid';
import BarbarianClient, { createBarbarianStrategies } from '../BarbarianClient';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import BuildRaiders from '../Strategies/Barbarian/BuildRaiders';
import Raid from '../Strategies/Barbarian/Raid';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { StrategyRegistry } from '@civ-clone/core-strategy/StrategyRegistry';
import {
  createDependencies,
  dependenciesFor,
} from '@civ-clone/base-strategy-ai/lib/Dependencies';
import City from '@civ-clone/core-city/City';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import PathFinderRegistry from '@civ-clone/core-world-path/PathFinderRegistry';
import { Water } from '@civ-clone/core-terrain/Types';
import { expect } from 'chai';
import unitYields from '@civ-clone/civ1-unit/Rules/Unit/yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import LeadsGroup from '@civ-clone/base-barbarians/Rules/LeadsGroup';
import LeavesMap from '@civ-clone/base-barbarians/Rules/LeavesMap';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

describe('BarbarianClient', (): void => {
  it('plays with the barbarian strategies only, in its own registry', (): void => {
    const rules = new RuleRegistry(),
      dependencies = dependenciesFor({ rules } as any),
      client = new BarbarianClient(new Player(rules), dependencies);

    expect(
      createBarbarianStrategies(dependencies).map(
        (strategy) => strategy.constructor
      )
    ).to.eql([Raid, BuildRaiders]);
    expect(client['strategyRegistry']().length).to.equal(2);
    expect(client['strategyRegistry']()).not.to.equal(
      dependencies.strategyRegistry
    );
  });
});

describe('BuildRaiders', (): void => {
  const rules = new RuleRegistry();

  rules.register(...unitYields(undefined, rules));

  const dependencies = dependenciesFor({ rules } as any),
    strategy = new BuildRaiders(dependencies),
    item = (Item: unknown, cost: number): BuildItem =>
      ({
        item: () => Item,
        cost: () => ({ value: () => cost }),
      } as unknown as BuildItem),
    chosen = (items: BuildItem[]) => strategy.choose(items)?.item();

  it('builds the dearest attacker, the strongest at a price', (): void => {
    // Horseman 2/1 at 20, Cannon 8/1 at 40, Musketman 2/3 at 30: the Cannon.
    expect(
      chosen([item(Horseman, 20), item(Cannon, 40), item(Musketman, 30)])
    ).to.equal(Cannon);
    expect(chosen([item(Horseman, 20), item(Warrior, 10)])).to.equal(Horseman);
    expect(chosen([item(Horseman, 20), item(Cannon, 20)])).to.equal(Cannon);
  });

  it('builds land units only: no ship, no missile', (): void => {
    expect(
      chosen([item(Battleship, 160), item(Nuclear, 160), item(Horseman, 20)])
    ).to.equal(Horseman);
  });

  it('builds the strongest defender when no attacker is on offer', (): void => {
    // Musketman 2/3 and Warrior 1/1: the Musketman.
    expect(chosen([item(Warrior, 10), item(Musketman, 30)])).to.equal(
      Musketman
    );
  });

  it('leaves improvements alone', (): void => {
    expect(chosen([item(class Granary {}, 60)])).to.be.undefined;
  });
});

describe('a stranded leader', (): void => {
  it('gives up (turn % 8) + 4 or more from the nearest city', (): void => {
    expect([0, 3, 4, 7, 8].map((turn) => leaderGivesUp(turn, 6))).to.eql([
      true,
      false,
      false,
      false,
      true,
    ]);
    expect(leaderGivesUp(7, 11)).to.be.true;
    expect(leaderGivesUp(7, 10.9)).to.be.false;
  });

  it('gives up with no city left to go to', (): void => {
    expect(leaderGivesUp(0, null)).to.be.true;
  });
});

describe('what the raiders ask the rule set', (): void => {
  it("takes the group's Diplomat as its leader, unless the rule set says who leads", async (): Promise<void> => {
    const rules = new RuleRegistry(),
      dependencies = dependenciesFor({ rules } as any),
      world = await generateWorld(undefined, rules),
      player = new Player(rules),
      diplomat = new Diplomat(null, player, world.get(0, 0), rules),
      swordman = new Swordman(null, player, world.get(0, 0), rules);

    expect(isLeader(dependencies, diplomat)).to.be.true;
    expect(isLeader(dependencies, swordman)).to.be.false;

    rules.register(
      new LeadsGroup(
        new Criterion((unit: Unit): boolean => unit instanceof Swordman),
        new Effect((): boolean => true)
      )
    );

    expect(isLeader(dependencies, diplomat)).to.be.false;
    expect(isLeader(dependencies, swordman)).to.be.true;
  });

  it('leaves the map within 2 of 50 rows of the top or bottom, unless the rule set says where', async (): Promise<void> => {
    const rules = new RuleRegistry(),
      dependencies = dependenciesFor({ rules } as any),
      // 100 rows: 2 of 50 is 4.
      world = await generateWorld(generateGenerator(100, 4, Terrain), rules),
      at = (y: number): Tile => world.get(0, y);

    expect(
      [0, 3, 4, 50, 95, 96, 99].map((y) => leaves(dependencies, at(y)))
    ).to.eql([true, true, false, false, false, true, true]);

    rules.register(
      new LeavesMap(new Effect((tile: Tile): boolean => tile.y() === 50))
    );

    expect([0, 3, 4, 50, 96].map((y) => leaves(dependencies, at(y)))).to.eql([
      false,
      false,
      false,
      true,
      false,
    ]);
  });
});

describe('a raiding ship', (): void => {
  // A ship mid-ocean with a raider aboard, and one city 20 squares away on the coast, where nothing can find it a way.
  const setUp = async () => {
    const rules = new RuleRegistry(),
      world = await generateWorld(generateGenerator(40, 40, Water), rules),
      owner = new Player(rules),
      city = {
        destroyed: () => false,
        player: () => owner,
        tile: () => world.get(20, 20),
      } as unknown as City,
      actions: unknown[] = [],
      ship = {
        active: () => true,
        action: (action: unknown) => actions.push(action),
        cargo: () => [{}],
        destroy: () => actions.push('destroyed'),
        destroyed: () => false,
        moves: () => ({ value: () => 3 }),
        tile: () => world.get(0, 20),
      } as unknown as NavalTransport,
      dependencies = (cities: City[]) =>
        createDependencies({
          cityGrowthRegistry: {
            getByCity: () => ({ size: () => 1 }),
          } as any,
          cityRegistry: {
            entries: () => cities,
            getByPlayer: () => cities,
          } as any,
          pathFinderRegistry: new PathFinderRegistry(),
          playerTreasuryRegistry: {
            getByPlayerAndType: () => ({ value: () => 0 }),
          } as any,
          ruleRegistry: rules,
        });

    return { actions, city, dependencies, ship };
  };

  it("waits where it is when it can reach no city's coast, rather than failing (civ-clone/web-renderer#979)", async (): Promise<void> => {
    const { actions, city, dependencies, ship } = await setUp();

    expect(() =>
      sail(dependencies([city]), new Player(new RuleRegistry()), ship)
    ).not.to.throw();
    expect(actions.length).to.equal(1);
    expect((actions[0] as object).constructor.name).to.equal('NoOrders');
  });

  it('is gone when there is no city to sail for', async (): Promise<void> => {
    const { actions, dependencies, ship } = await setUp();

    sail(dependencies([]), new Player(new RuleRegistry()), ship);

    expect(actions).to.eql(['destroyed']);
  });
});
