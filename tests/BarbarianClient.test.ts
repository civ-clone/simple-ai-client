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
import {
  bestStep,
  isLeader,
  leaderGivesUp,
  leaves,
  sail,
} from '../lib/Barbarian/raid';
import FillGenerator from '@civ-clone/core-world/tests/lib/FillGenerator';
import { Move } from '@civ-clone/library-unit/Actions';
import World from '@civ-clone/core-world/World';
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

describe("a raider's step towards its target (civ-clone/web-renderer#980)", (): void => {
  const world = async (
    topologyId: 'square' | 'hex-odd-r' | 'staggered-iso'
  ): Promise<World> =>
    generateWorld(
      new FillGenerator(20, 20, Terrain, { topologyId }),
      new RuleRegistry()
    );

  // The best step for a raider on `from` that may step only onto `allowed`, with every random roll 0: so +4 for a
  //  square that isn't its own city, plus what the way to `target` adds.
  const step = (from: Tile, target: Tile, allowed: Tile[]) => {
    const unit = {
        tile: () => from,
        actions: (to: Tile) =>
          allowed.includes(to) ? [Object.create(Move.prototype)] : [],
      } as unknown as Unit,
      dependencies = createDependencies({
        cityRegistry: { getByTile: () => null } as any,
        randomNumberGenerator: () => 0,
        ruleRegistry: new RuleRegistry(),
        tileImprovementRegistry: { getByTile: () => [] } as any,
        unitRegistry: { getByTile: () => [] } as any,
      });

    return bestStep(dependencies, new Player(new RuleRegistry()), unit, target);
  };

  const scoreOnto = (from: Tile, target: Tile, to: Tile): number =>
    step(from, target, [to])!.score;

  it('on the square grid, scores +2 for each storage axis the step agrees with, as v474.05', async (): Promise<void> => {
    const map = await world('square'),
      from = map.get(10, 10),
      target = map.get(10, 5);

    // Straight on (north) +4, a diagonal towards it +2, sideways nothing.
    expect(scoreOnto(from, target, map.get(10, 9))).to.equal(8);
    expect(scoreOnto(from, target, map.get(11, 9))).to.equal(6);
    expect(scoreOnto(from, target, map.get(11, 10))).to.equal(4);
    expect(step(from, target, from.getNeighbours())!.to).to.equal(
      map.get(10, 9)
    );
  });

  it('on the hexagonal grid, scores +4 a move nearer, +2 no further and nothing further away', async (): Promise<void> => {
    const map = await world('hex-odd-r'),
      topology = map.topology(),
      from = map.get(10, 10),
      target = map.get(10, 4),
      steps = (tile: Tile) =>
        topology.steps(tile.x(), tile.y(), target.x(), target.y()),
      here = steps(from),
      neighbours = from.getNeighbours(),
      nearer = neighbours.filter((tile) => steps(tile) < here),
      level = neighbours.filter((tile) => steps(tile) === here),
      further = neighbours.filter((tile) => steps(tile) > here);

    expect(neighbours).to.have.length(6);
    expect(nearer.length).to.be.greaterThan(0);
    expect(level.length).to.be.greaterThan(0);
    expect(further.length).to.be.greaterThan(0);
    nearer.forEach((tile) => expect(scoreOnto(from, target, tile)).to.equal(8));
    level.forEach((tile) => expect(scoreOnto(from, target, tile)).to.equal(6));
    further.forEach((tile) =>
      expect(scoreOnto(from, target, tile)).to.equal(4)
    );
    expect(nearer).to.include(step(from, target, neighbours)!.to);
  });

  it('on the staggered isometric grid, scores +2 for each logical axis the step agrees with', async (): Promise<void> => {
    const map = await world('staggered-iso'),
      topology = map.topology(),
      from = map.get(10, 10),
      neighbours = from.getNeighbours(),
      delta = (to: Tile): number[] =>
        topology.logicalDelta(from.x(), from.y(), to.x(), to.y())!,
      // The neighbour one logical step along +a (se), and a target further along the same way.
      along = neighbours.find(
        (tile) => delta(tile)[0] === 1 && delta(tile)[1] === 0
      )!,
      target = [1, 2, 3].reduce(
        (tile: Tile): Tile =>
          tile
            .getNeighbours()
            .find(
              (next) =>
                topology
                  .logicalDelta(tile.x(), tile.y(), next.x(), next.y())!
                  .join() === '1,0'
            )!,
        along
      );

    expect(neighbours).to.have.length(8);
    expect(delta(target)).to.eql([4, 0]);

    neighbours.forEach((tile) => {
      const [a, b] = delta(tile),
        agrees = (a === 1 ? 1 : 0) + (b === 0 ? 1 : 0);

      expect(scoreOnto(from, target, tile), `${a},${b}`).to.equal(
        4 + 2 * agrees
      );
    });
    expect(step(from, target, neighbours)!.to).to.equal(along);
  });
});
