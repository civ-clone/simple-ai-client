import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Horseman, Sail, Warrior } from '@civ-clone/civ1-unit/Units';
import GoodyHut from '@civ-clone/core-goody-hut/GoodyHut';
import unitGame, { at, paces } from './lib/unitGame';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import civ1Knowledge from '../lib/Civ1/knowledge';
import civ1StandDownPolicy from '../lib/Civ1/standDown';
import { createMemory } from '../lib/Memory';
import { expect } from 'chai';
import { hasStepWorthTaking } from '../lib/Unit/moveUnit';
import { netShields } from '../lib/City/buildTime';
import scoreUnitMove from '../lib/Unit/scoreUnitMove';

const fortified = (game: { unitImprovements: any }, unit: Unit): boolean =>
  game.unitImprovements
    .getByUnit(unit)
    .some(
      (improvement: UnitImprovement): boolean =>
        improvement instanceof Fortified
    );

describe('StandDown', (): void => {
  it('should not walk a unit with nothing to do back and forth between two tiles', async (): Promise<void> => {
    // An island the player knows all of, with no city on it: nothing to explore, defend or attack.
    //   01234
    // 0 ~~~~~
    // 1 ~GGG~
    // 2 ~GGG~
    // 3 ~~~~~
    const { game, addUnit, takeTurns } = await unitGame(
        '6O3G2O3G6O',
        4,
        5,
        Despotism
      ),
      warrior = addUnit(Warrior, 2, 1),
      tiles: string[] = [at(warrior)];

    await takeTurns(8, () => tiles.push(at(warrior)));

    expect(paces(tiles)).false;
    // It stopped where it was on its first turn and fortified.
    expect(new Set(tiles).size).to.equal(1);
    expect(fortified(game, warrior)).true;
  });

  it('should send a unit with nothing to do to a city that wants another defender, and fortify it there', async (): Promise<void> => {
    //   0123456
    // 0 GGGGGGG
    // 1 GGGGGGG
    // 2 GGGGGGG
    const { game, addCity, addUnit, fortify, takeTurns } = await unitGame(
        '21G',
        3,
        7,
        Despotism
      ),
      // Size 6 wants two defenders, and has one.
      city = addCity(0, 1, 6),
      spare = addUnit(Warrior, 4, 1, city);

    fortify(addUnit(Warrior, 0, 1, city));

    // Four turns to get there, and one more for fortifying to take effect.
    await takeTurns(5);

    expect(at(spare)).to.equal('0,1');
    expect(fortified(game, spare)).true;
  });

  it('should keep a unit that reaches the city it was sent to with moves to spare there', async (): Promise<void> => {
    //   01234
    // 0 GGGGG
    // 1 GGGGG
    // 2 GGGGG
    const { game, addCity, addUnit, fortify, takeTurns, world } =
        await unitGame('15G', 3, 5, Despotism),
      // Size 6 wants two defenders, and has one.
      city = addCity(1, 1, 6),
      // Two moves: one to get there, one to spare.
      horseman = addUnit(Horseman, 2, 1, city);

    fortify(addUnit(Warrior, 1, 1, city));
    // Something worth a step from the city, but not from where the Horseman starts.
    game.goodyHuts.register(new GoodyHut(world.get(0, 1), game.rules));

    await takeTurns(1);

    expect(at(horseman)).to.equal('1,1');
  });

  it('should send a unit with nothing to do to the nearest city, and keep it there, ready for a mission', async (): Promise<void> => {
    //   0123456
    // 0 GGGGGGG
    // 1 GGGGGGG
    // 2 GGGGGGG
    const { game, addCity, addUnit, fortify, takeTurns } = await unitGame(
        '21G',
        3,
        7,
        Despotism
      ),
      // Size 2: each supports its two units for nothing.
      near = addCity(1, 1, 2),
      far = addCity(5, 1, 2),
      spare = addUnit(Warrior, 2, 1, far),
      tiles: string[] = [];

    // Each city has the defender it wants.
    [near, far].forEach((city) =>
      fortify(addUnit(Warrior, city.tile().x(), 1, city))
    );

    await takeTurns(4, () => tiles.push(at(spare)));

    expect(tiles).to.deep.equal(['1,1', '1,1', '1,1', '1,1']);
    // Not fortified: the city has the defender it wants, so this one waits, ready for a mission.
    expect(fortified(game, spare)).false;
    expect(spare.active()).true;
  });

  it('should disband a unit with nothing to do that its home city pays shields for and has none to spare', async (): Promise<void> => {
    //   012
    // 0 FGF
    const { addCity, addUnit, dependencies, fortify, takeTurns } =
        await unitGame('FGF', 1, 3, Monarchy),
      // Under Monarchy each unit costs its city a shield: a size 1 city working a Forest makes two, for its two.
      city = addCity(1, 0, 1),
      defender = addUnit(Warrior, 1, 0, city),
      spare = addUnit(Warrior, 1, 0, city);

    fortify(defender);

    expect(netShields(city)).to.equal(0);
    expect(civ1StandDownPolicy.disband(dependencies, spare)).true;

    await takeTurns(1);

    expect(spare.destroyed()).true;
    expect(defender.destroyed()).false;
  });

  it('should keep a unit with nothing to do that costs its home city nothing', async (): Promise<void> => {
    //   012
    // 0 OGO
    const { addCity, addUnit, dependencies, fortify, game, takeTurns } =
        await unitGame('OGO', 1, 3, Despotism),
      // Under Despotism a city supports as many units as its size for nothing.
      city = addCity(1, 0, 2),
      spare = addUnit(Warrior, 1, 0, city);

    fortify(addUnit(Warrior, 1, 0, city));

    expect(civ1StandDownPolicy.disband(dependencies, spare)).false;

    await takeTurns(2);

    expect(spare.destroyed()).false;
    expect(at(spare)).to.equal('1,0');
  });

  it('should bring a ship with nothing to explore into port and keep it there', async (): Promise<void> => {
    //   01234
    // 0 OOOOO
    // 1 OOOOO
    // 2 GOOOO
    const { addCity, addUnit, takeTurns } = await unitGame(
        '10OG4O',
        3,
        5,
        Despotism
      ),
      city = addCity(0, 2, 1),
      ship = addUnit(Sail, 4, 0, city),
      tiles: string[] = [];

    await takeTurns(4, () => tiles.push(at(ship)));

    expect(tiles[tiles.length - 1]).to.equal('0,2');
    expect(tiles.slice(tiles.indexOf('0,2'))).to.deep.equal(
      tiles.slice(tiles.indexOf('0,2')).map(() => '0,2')
    );
  });

  it('should count only the unknown tiles a unit could go on to as worth exploring', async (): Promise<void> => {
    //   0123
    // 0 GGOO
    // 1 GGOO
    // 2 GGOO
    // The sea beyond the coast is unknown: a land unit can't go there, so the coast isn't worth a step.
    const { dependencies, player, world, addUnit } = await unitGame(
        '2G2O2G2O2G2O',
        3,
        4,
        Despotism,
        (tile) => tile.x() < 2
      ),
      warrior = addUnit(Warrior, 0, 1),
      memory = createMemory();

    expect(
      scoreUnitMove(
        dependencies,
        player,
        memory,
        civ1Knowledge,
        warrior,
        world.get(1, 1)
      )
    ).to.equal(0);
    expect(
      hasStepWorthTaking(dependencies, player, memory, civ1Knowledge, warrior)
    ).false;
  });
});
