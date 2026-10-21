import unitGame from './lib/unitGame';
import Action from '@civ-clone/core-unit/Action';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import moveUnit from '../lib/Unit/moveUnit';
import shuffle from '../lib/shuffle';

// A seeded generator (mulberry32), so that the draws are the same each run.
const seeded =
  (seed: number): (() => number) =>
  (): number => {
    seed = (seed + 0x6d2b79f5) | 0;

    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

describe('shuffle', (): void => {
  it('should put each item first equally often', (): void => {
    const rng = seeded(1),
      firsts = new Map<number, number>(),
      draws = 8000;

    for (let i = 0; i < draws; i++) {
      const [first] = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rng);

      firsts.set(first, (firsts.get(first) ?? 0) + 1);
    }

    // A fair 1,000 each. A random comparator puts the first item first 53% of the time
    //  (civ-clone/web-renderer#284).
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((item): void => {
      expect(firsts.get(item)).to.be.within(880, 1120);
    });
  });
});

describe('moveUnit', (): void => {
  it('should take any of the steps that score the same equally often', async (): Promise<void> => {
    // Grassland the player knows all of: every step from the middle scores the same.
    const { addUnit, dependencies, player, world } = await unitGame(
        '84G',
        7,
        12,
        Monarchy
      ),
      start = world.get(5, 3),
      warrior = addUnit(Warrior, 5, 3),
      memory = dependencies.memoryRegistry.memoryFor(player),
      steps = new Map<string, number>(),
      draws = 800;

    dependencies.randomNumberGenerator = seeded(2);

    for (let i = 0; i < draws; i++) {
      warrior.setTile(start);
      warrior.moves().set(1);
      warrior.setActive(true);
      memory.lastUnitMoves.delete(warrior);

      await moveUnit(dependencies, player, memory, civ1Knowledge, warrior);

      const step = `${warrior.tile().x() - 5},${warrior.tile().y() - 3}`;

      steps.set(step, (steps.get(step) ?? 0) + 1);
    }

    // All eight neighbours, about 100 each.
    expect(steps.size).to.equal(8);
    steps.forEach((count): void => {
      expect(count).to.be.within(65, 135);
    });
  });

  it('should carry straight on among the steps that score the same', async (): Promise<void> => {
    const { addUnit, dependencies, player, world } = await unitGame(
        '84G',
        7,
        12,
        Monarchy
      ),
      start = world.get(5, 3),
      warrior = addUnit(Warrior, 5, 3),
      memory = dependencies.memoryRegistry.memoryFor(player),
      steps = new Set<string>();

    dependencies.randomNumberGenerator = seeded(3);

    for (let i = 0; i < 50; i++) {
      warrior.setTile(start);
      warrior.moves().set(1);
      warrior.setActive(true);
      // Its last step was east, from 4,3.
      memory.lastUnitMoves.set(warrior, [world.get(4, 3), start]);

      await moveUnit(dependencies, player, memory, civ1Knowledge, warrior);

      steps.add(`${warrior.tile().x()},${warrior.tile().y()}`);
    }

    expect([...steps]).to.deep.equal(['6,3']);
  });

  it("should stand a unit down when the step it takes doesn't spend its moves", async (): Promise<void> => {
    const { addUnit, dependencies, player } = await unitGame(
        '84G',
        7,
        12,
        Monarchy
      ),
      warrior = addUnit(Warrior, 5, 3),
      memory = dependencies.memoryRegistry.memoryFor(player),
      action = warrior.action.bind(warrior),
      taken: string[] = [];

    // A step that leaves the unit where it was with its moves unspent, as a land unit unloaded beside a coast it
    //  couldn't step onto did (civ-clone/web-renderer#446). Standing down still works.
    warrior.action = (step: Action, ...args: any[]): void => {
      taken.push(step.constructor.name);

      if (step.to() === warrior.tile()) {
        action(step, ...args);
      }
    };

    await moveUnit(dependencies, player, memory, civ1Knowledge, warrior);

    // One step, then stood down.
    expect(taken).to.deep.equal(['Move', 'NoOrders']);
    expect(warrior.moves().value()).to.equal(0);
  });

  it('should stand a unit down after a few steps that cost it nothing, as along a railroad', async (): Promise<void> => {
    const { addUnit, dependencies, player } = await unitGame(
        '84G',
        7,
        12,
        Monarchy
      ),
      warrior = addUnit(Warrior, 5, 3),
      memory = dependencies.memoryRegistry.memoryFor(player),
      action = warrior.action.bind(warrior),
      taken: string[] = [];

    // Each step moves the unit and gives it its move back, as a step along a railroad costs nothing: it stepped back and
    //  forth for ever (civ-clone/web-renderer#377).
    warrior.action = (step: Action, ...args: any[]): void => {
      taken.push(step.constructor.name);
      action(step, ...args);

      if (step.constructor.name !== 'NoOrders') {
        warrior.moves().set(1);
        warrior.setActive(true);
      }
    };

    await moveUnit(dependencies, player, memory, civ1Knowledge, warrior);

    expect(taken).to.deep.equal(['Move', 'Move', 'Move', 'NoOrders']);
  });
});
