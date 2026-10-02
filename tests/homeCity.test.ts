import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import unitGame, { at } from './lib/unitGame';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import Government from '@civ-clone/core-government/Government';
import Path from '@civ-clone/core-world-path/Path';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import { expect } from 'chai';
import { netShields } from '../lib/City/buildTime';

// Two cities of the player's, `home` at (0, 1), of `homeSize`, and `there` at (4, 1), of size 1. `home` has a fortified
//  defender of its own. With `defended`, so has `there`.
const twoCities = async (
  map: string,
  Governments: typeof Government,
  defended: boolean,
  homeSize: number = 1
) => {
  const setup = await unitGame(map, 3, 7, Governments),
    home = setup.addCity(0, 1, homeSize),
    there = setup.addCity(4, 1);

  setup.fortify(setup.addUnit(Warrior, 0, 1, home));

  if (defended) {
    setup.fortify(setup.addUnit(Warrior, 4, 1, there));
  }

  return { ...setup, home, there };
};

const fortified = (game: { unitImprovements: any }, unit: Unit): boolean =>
  game.unitImprovements
    .getByUnit(unit)
    .some(
      (improvement: UnitImprovement): boolean =>
        improvement instanceof Fortified
    );

describe('homeCity', (): void => {
  it('should make a city the home of a unit that `Garrison` fortifies there', async (): Promise<void> => {
    // `there` has no defender, so the Warrior from `home` standing in it is fortified there.
    const { game, home, there, addUnit, takeTurns } = await twoCities(
        '21P',
        Despotism,
        false
      ),
      warrior = addUnit(Warrior, 4, 1, home);

    // Fortifying takes effect at the start of the next turn.
    await takeTurns(2);

    expect(fortified(game, warrior)).true;
    expect(warrior.city() === there).true;
  });

  it('should make a city the home of a unit that `StandDown` leaves waiting there', async (): Promise<void> => {
    // Both cities have the defender they want, and there's nothing to explore: the spare Warrior waits where it is.
    const { game, home, there, addUnit, takeTurns } = await twoCities(
        '21P',
        Despotism,
        true
      ),
      warrior = addUnit(Warrior, 4, 1, home);

    await takeTurns(1);

    expect(at(warrior)).to.equal('4,1');
    expect(fortified(game, warrior)).false;
    expect(warrior.city() === there).true;
  });

  it('should not make a city the home of a unit passing through it', async (): Promise<void> => {
    const { dependencies, home, player, world, addUnit, takeTurns } =
        await twoCities('21P', Despotism, true),
      warrior = addUnit(Warrior, 4, 1, home),
      path = new Path();

    path.push(world.get(5, 1));
    path.push(world.get(6, 1));
    dependencies.memoryRegistry
      .memoryFor(player)
      .unitPathData.set(warrior, path);

    await takeTurns(1);

    expect(at(warrior)).to.equal('5,1');
    expect(warrior.city() === home).true;
  });

  it('should leave a unit homed where it is when the city it defends could not support it', async (): Promise<void> => {
    // Plains round `home` (x 6, where the map wraps, to 2) and Grassland round `there` (x 3-5): under Monarchy `there`, a
    //  city of 1, makes at most a shield, which its first unit would take. `home`, of 5, supports both its units.
    const { game, home, there, addUnit, takeTurns } = await twoCities(
        '3P3G4P3G4P3GP',
        Monarchy,
        false,
        5
      ),
      warrior = addUnit(Warrior, 4, 1, home);

    expect(netShields(there)).to.be.at.most(1);

    await takeTurns(2);

    expect(warrior.destroyed()).false;
    expect(fortified(game, warrior)).true;
    expect(warrior.city() === home).true;
  });
});
