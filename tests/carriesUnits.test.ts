// Which transports the computer players treat as ferries and carriers (civ-clone/web-renderer#1007, M2b): a
//  `NavalTransport` the ruleset declares to carry something. Civ2's Submarine is a `NavalTransport` so it can carry
//  missiles; Civ1 declares no `Carries` for it, so it must be no ferry or carrier, as when it was a plain naval unit.
import {
  Carrier,
  Frigate,
  Sail,
  Submarine,
  Transport,
  Trireme,
} from '@civ-clone/civ1-unit/Units';
import { carriesUnits, carriesUnitsType } from '../lib/Unit/carriesUnits';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
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
});
