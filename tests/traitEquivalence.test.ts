// The unit-class checks the computer players made before they asked unit traits, kept as literal fixtures: each must
//  give the same answer as its trait form for every Civ1 unit type (civ-clone/web-renderer#1008). The checks civ1-unit's
//  own `traitEquivalence` test already pairs one to one are left to it: `Fortifiable` → `Fortifies` (`assignMission`),
//  `Settlers` → `FoundsCities` (`isFoundingSettlers`), `Worker` → `Terraforms` (`isExploring`, `isExplorerType`,
//  `spendTreasury`), `Trireme` → `CoastBound`, `Bomber` → `AttackEndsTurn`, `Diplomatic` → `NonCombatant` and
//  `supported` → `!NonCombatant` (`unitSupport`, as a unit and as a class).
import * as Units from '@civ-clone/civ1-unit/Units';
import { Fortifiable, Worker } from '@civ-clone/library-unit/Types';
import { isDefender, isDefenderType } from '../lib/City/defence';
import unitGame, { UnitGame } from './lib/unitGame';
import Defence from '@civ-clone/core-unit/Yields/Defence';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import FoundCapital from '../Strategies/Unit/FoundCapital';
import FoundsCities from '@civ-clone/base-unit-trait-founds-cities/FoundsCities';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import WorkerTurn from '../Strategies/Unit/WorkerTurn';
import baseYieldOf from '../lib/Unit/unitType';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import { hasTrait } from '@civ-clone/core-unit/traits';
import { isFounder } from '../lib/Unit/overseas';

type Row = [
  name: string,
  // The check as it was.
  old: (unit: Unit, setup: UnitGame) => boolean,
  // The check as it is now.
  now: (unit: Unit, setup: UnitGame) => boolean
];

const isA = (Type: object, item: object): boolean =>
    Object.prototype.isPrototypeOf.call(Type, item),
  classOf = (unit: Unit): typeof Unit => unit.constructor as typeof Unit,
  rows: Row[] = [
    [
      'isFounder: Worker → FoundsCities',
      (unit) => unit instanceof Worker,
      (unit) => isFounder(unit),
    ],
    [
      'isFounder as a class: Worker → FoundsCities',
      (unit) => isA(Worker, classOf(unit)),
      (unit, { game }) => hasTrait(classOf(unit), FoundsCities, game.rules),
    ],
    [
      'FoundCapital handles: Worker → FoundsCities',
      (unit) => unit instanceof Worker,
      (unit, { dependencies, player }) =>
        new FoundCapital(dependencies, civ1Knowledge).handles(
          new PlayerAction(player, unit)
        ),
    ],
    [
      'WorkerTurn handles: Worker → FoundsCities || Terraforms',
      (unit) => unit instanceof Worker,
      (unit, { dependencies, player }) =>
        new WorkerTurn(dependencies, civ1Knowledge).handles(
          new PlayerAction(player, unit)
        ),
    ],
    [
      'isDefender: Fortifiable → Fortifies, with some defence',
      (unit) => unit instanceof Fortifiable && unit.defence().value() > 0,
      (unit) => isDefender(unit),
    ],
    [
      'isDefenderType: Fortifiable → Fortifies, with some defence',
      (unit, { dependencies }) =>
        isA(Fortifiable, classOf(unit)) &&
        baseYieldOf(dependencies, classOf(unit), Defence) > 0,
      (unit, { dependencies }) => isDefenderType(dependencies, classOf(unit)),
    ],
  ];

describe('unit traits in the computer players', (): void => {
  const UnitTypes = Object.values(Units) as (new (...args: any[]) => Unit)[];

  it('should check all 28 Civ1 unit types', (): void => {
    expect(UnitTypes.length).to.equal(28);
  });

  rows.forEach(([name, old, now]: Row): void =>
    it(`should agree with the old check: ${name}`, async (): Promise<void> => {
      const setup = await unitGame('9G', 3, 3, Despotism),
        held = UnitTypes.filter((UnitType): boolean => {
          const unit = setup.addUnit(UnitType, 1, 1),
            expected = old(unit, setup);

          expect(now(unit, setup), UnitType.name).to.equal(expected);

          return expected;
        });

      // Neither always nor never, so that the row says something.
      expect(held.length, 'holds for some').to.be.greaterThan(0);
      expect(held.length, 'fails for some').to.be.lessThan(UnitTypes.length);
    })
  );

  it('should handle nothing that is not a unit', async (): Promise<void> => {
    const { dependencies, player } = await unitGame('9G', 3, 3, Despotism);

    expect(
      new FoundCapital(dependencies, civ1Knowledge).handles(
        new PlayerAction(player, player)
      )
    ).false;
    expect(
      new WorkerTurn(dependencies, civ1Knowledge).handles(
        new PlayerAction(player, player)
      )
    ).false;
  });
});
