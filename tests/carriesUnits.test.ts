// Which transports the computer players treat as ferries and carriers (civ-clone/web-renderer#1007, M2b): a
//  `NavalTransport` the ruleset declares to carry something. Civ2's Submarine is a `NavalTransport` so it can carry
//  missiles; Civ1 declares no `Carries` for it, so it must be no ferry or carrier, as when it was a plain naval unit.
import {
  Carrier,
  Fighter,
  Frigate,
  Sail,
  Submarine,
  Transport,
  Trireme,
} from '@civ-clone/civ1-unit/Units';
import {
  carriesUnits,
  carriesUnitsType,
  ferries,
  ferriesType,
} from '../lib/Unit/carriesUnits';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Ferry from '../Strategies/Unit/Ferry';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import { canFerryFrom } from '../lib/Unit/overseas';
import civ1Knowledge from '../lib/Civ1/knowledge';
import waitForCarrier from '../lib/Unit/waitForCarrier';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import unitGame from './lib/unitGame';

// A transport type the ruleset declares to carry nothing, as Civ1's Submarine once it is a `NavalTransport`.
class Holdless extends NavalTransport {}

describe('carriesUnits', (): void => {
  it("should count each of Civ1's transports, and not a transport with nothing to carry or a Submarine", async (): Promise<void> => {
    const { addUnit, dependencies } = await unitGame('30O', 1, 30, Monarchy),
      transports = [Trireme, Sail, Frigate, Transport, Carrier];

    transports.forEach((UnitType: typeof Unit, x: number): void => {
      expect(carriesUnits(addUnit(UnitType, x, 0)), UnitType.name).true;
      expect(carriesUnitsType(UnitType, dependencies.ruleRegistry)).true;
    });

    [Holdless, Submarine].forEach((UnitType: typeof Unit): void => {
      expect(carriesUnits(addUnit(UnitType, 10, 0)), UnitType.name).false;
      expect(carriesUnitsType(UnitType, dependencies.ruleRegistry)).false;
    });

    expect(carriesUnitsType({}, dependencies.ruleRegistry)).false;
  });

  it('should not sail one as a ferry, count it as a way overseas, or have aircraft wait for it', async (): Promise<void> => {
    const { addCity, addUnit, dependencies, player } = await unitGame(
        '1G29O',
        1,
        30,
        Monarchy
      ),
      // No Map Making: the port can't build a transport, so only a transport the player has counts.
      port = addCity(0, 0),
      ferry = new Ferry(dependencies, civ1Knowledge),
      holdless = addUnit(Holdless, 2, 0),
      fighter = addUnit(Fighter, 3, 0);

    holdless.moves().set(1);
    expect(ferry.handles(new PlayerAction(player, holdless))).false;
    expect(canFerryFrom(dependencies, player, port)).false;
    expect(waitForCarrier(dependencies, player, civ1Knowledge, fighter)).false;

    // A Carrier carries aircraft, not passengers: aircraft wait for it, but it's no ferry and no way overseas.
    const carrier = addUnit(Carrier, 4, 0);

    carrier.moves().set(1);
    expect(ferry.handles(new PlayerAction(player, carrier))).false;
    expect(canFerryFrom(dependencies, player, port)).false;
    expect(waitForCarrier(dependencies, player, civ1Knowledge, fighter)).true;

    const transport = addUnit(Transport, 5, 0);

    transport.moves().set(1);
    expect(ferry.handles(new PlayerAction(player, transport))).true;
    expect(canFerryFrom(dependencies, player, port)).true;
  });

  it("should count only Civ1's transports for land units as ferries", async (): Promise<void> => {
    const { addUnit, dependencies } = await unitGame('30O', 1, 30, Monarchy);

    [Trireme, Sail, Frigate, Transport].forEach(
      (UnitType: typeof Unit, x: number): void => {
        expect(
          ferries(addUnit(UnitType, x, 0), dependencies.ruleRegistry),
          UnitType.name
        ).true;
        expect(ferriesType(UnitType, dependencies.ruleRegistry)).true;
      }
    );

    [Holdless, Submarine, Carrier].forEach((UnitType: typeof Unit): void => {
      expect(
        ferries(addUnit(UnitType, 10, 0), dependencies.ruleRegistry),
        UnitType.name
      ).false;
      expect(ferriesType(UnitType, dependencies.ruleRegistry)).false;
    });

    expect(ferriesType({}, dependencies.ruleRegistry)).false;
  });
});
