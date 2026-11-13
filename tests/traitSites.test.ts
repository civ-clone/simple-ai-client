// Two places the computer players ask unit traits that the rest of the suite doesn't reach (civ-clone/web-renderer#1008).
import { Bomber, Settlers, Warrior } from '@civ-clone/civ1-unit/Units';
import Action from '@civ-clone/core-unit/Action';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import { aircraftCanReturn } from '../lib/Civ1/aircraft';
import { defendUndefendedCity } from '../lib/Unit/assignMission';
import { expect } from 'chai';
import unitGame from './lib/unitGame';

describe('unit traits the computer players ask', (): void => {
  it("should count a Bomber's attack as ending its turn where it is (AttackEndsTurn)", async (): Promise<void> => {
    const { addCity, addUnit, dependencies, player } = await unitGame(
        '30G',
        1,
        30,
        Monarchy
      ),
      bomber = addUnit(Bomber, 10, 0),
      // Not a move: an attack from where it stands.
      attack = {} as Action;

    bomber.moves().set(bomber.movement().value());

    // A full first turn aloft: this turn's 8 moves and the next turn's 8. Attacking ends this turn, so 8 are left.
    addCity(0, 0);
    expect(aircraftCanReturn(dependencies, player, bomber, attack)).false;

    addCity(2, 0);
    expect(aircraftCanReturn(dependencies, player, bomber, attack)).true;
  });

  it('should send only units that fortify to defend an undefended city', async (): Promise<void> => {
    const { addCity, addUnit, dependencies, player } = await unitGame(
        '30G',
        1,
        30,
        Monarchy
      ),
      city = addCity(0, 0),
      memory = dependencies.memoryRegistry.memoryFor(player),
      // Both have some defence; only the Warrior fortifies.
      warrior = addUnit(Warrior, 3, 0),
      settlers = addUnit(Settlers, 3, 0);

    memory.targets.undefendedCities.push(city.tile());
    expect(defendUndefendedCity(dependencies, memory, settlers)).false;
    expect(defendUndefendedCity(dependencies, memory, warrior)).true;
  });
});
