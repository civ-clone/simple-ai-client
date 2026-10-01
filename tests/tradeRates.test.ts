import {
  MAX_LUXURIES,
  Rates,
  TradeRateState,
  startingRates,
  tradeRates,
} from '../lib/tradeRates';
import { expect } from 'chai';

// Rates as `sci/tax/lux`, in tenths, the way the spec on civ-clone/web-renderer#25 writes them.
const show = ({ science, tax, luxuries }: Rates): string =>
  `${science}/${tax}/${luxuries}`;

const rates = (written: string): Rates => {
  const [science, tax, luxuries] = written.split('/').map(Number);

  return { science, tax, luxuries };
};

const state = (
  current: string,
  overrides: Partial<TradeRateState> = {}
): TradeRateState => ({
  rates: rates(current),
  inDisorder: false,
  onTheEdge: false,
  turn: 5,
  gold: 0,
  ideology: 0,
  scienceStopped: false,
  ...overrides,
});

describe('tradeRates', (): void => {
  // v474.05's `F0_1ade_0006` (OpenCivOne `Segment_1ade.cs`), in tenths: sci/tax/lux before → after.
  (
    [
      // Lux is what sci and tax leave, sci is Ideology + (10 − lux) / 2 rounded down, tax the rest.
      [
        'a Civilized civ with 1 lux, no disorder, on turn 5',
        '5/4/1',
        { ideology: 1 },
        '5/4/1',
      ],
      ['a normal civ with 1 lux', '5/4/1', {}, '4/5/1'],
      ['a Militaristic civ with 1 lux', '5/4/1', { ideology: -1 }, '3/6/1'],
      ['a Civilized civ with no lux', '5/5/0', { ideology: 1 }, '6/4/0'],
      ['a normal civ with 2 lux', '4/4/2', {}, '4/4/2'],
      // +1 lux when a city is in disorder and sci + tax > 6.
      ['a city in disorder', '4/5/1', { inDisorder: true }, '4/4/2'],
      [
        'a city in disorder with lux already at 3',
        '3/4/3',
        { inDisorder: true },
        '3/3/4',
      ],
      // Lux never above 4: sci + tax is then 6, so disorder adds nothing.
      [
        'a city in disorder at the most lux',
        '3/3/4',
        { inDisorder: true },
        '3/3/4',
      ],
      ['more lux than the most', '2/2/6', {}, '3/3/4'],
      // −1 lux every 4th turn, while no city is in disorder or on the edge and sci + tax < 10 (v474.05: < 8).
      ['3 lux on a 4th turn', '3/4/3', { turn: 8 }, '4/4/2'],
      ['3 lux on another turn', '3/4/3', { turn: 9 }, '3/4/3'],
      [
        '3 lux on a 4th turn, a city on the edge',
        '3/4/3',
        { turn: 8, onTheEdge: true },
        '3/4/3',
      ],
      // In disorder on a 4th turn: the rise and the fall don't both happen.
      [
        '3 lux on a 4th turn, a city in disorder',
        '3/4/3',
        { turn: 8, inDisorder: true },
        '3/3/4',
      ],
      // Down to none: v474.05 keeps 2, and 1.
      ['2 lux on a 4th turn', '4/4/2', { turn: 8 }, '4/5/1'],
      ['1 lux on a 4th turn', '4/5/1', { turn: 8 }, '5/5/0'],
      ['no lux on a 4th turn', '5/5/0', { turn: 8 }, '5/5/0'],
      // +1 sci when gold > turn + 100.
      ['gold of turn + 101', '4/5/1', { gold: 106 }, '5/4/1'],
      ['gold of turn + 100', '4/5/1', { gold: 105 }, '4/5/1'],
      // Science stopped: none at all, tax takes it.
      ['science stopped', '4/5/1', { scienceStopped: true }, '0/9/1'],
      [
        'science stopped and rich',
        '4/5/1',
        { scienceStopped: true, gold: 1000, ideology: 1 },
        '0/9/1',
      ],
      // Luxuries beyond the routine's, still never above 4.
      ['one more lux', '4/5/1', { extraLuxuries: 1 }, '4/4/2'],
      [
        'one more lux with a city in disorder',
        '4/5/1',
        { extraLuxuries: 1, inDisorder: true },
        '3/4/3',
      ],
      ['one more lux at the most', '3/3/4', { extraLuxuries: 1 }, '3/3/4'],
    ] as [string, string, Partial<TradeRateState>, string][]
  ).forEach(([description, before, overrides, after]) =>
    it(`should set ${after} for ${description} (from ${before})`, (): void => {
      expect(show(tradeRates(state(before, overrides)))).to.equal(after);
    })
  );

  it('should always share out all ten tenths, none below 0 and lux at most 4', (): void => {
    for (let science = 0; science <= 10; science++) {
      for (let tax = 0; tax <= 10 - science; tax++) {
        [-1, 0, 1].forEach((ideology: number): void =>
          [false, true].forEach((inDisorder: boolean): void =>
            [0, 1000].forEach((gold: number): void => {
              const result = tradeRates(
                state(`${science}/${tax}/${10 - science - tax}`, {
                  ideology,
                  inDisorder,
                  gold,
                  turn: 8,
                })
              );

              expect(result.science + result.tax + result.luxuries).to.equal(
                10
              );
              expect(
                Math.min(result.science, result.tax, result.luxuries)
              ).to.be.at.least(0);
              expect(result.luxuries).to.be.at.most(MAX_LUXURIES);
            })
          )
        );
      }
    }
  });

  // `StartGameMenu.cs` ~L555: sci = Ideology + 3, tax = 9 − sci, so 1 lux.
  (
    [
      [1, '4/5/1'],
      [0, '3/6/1'],
      [-1, '2/7/1'],
    ] as [number, string][]
  ).forEach(([ideology, expected]) =>
    it(`should start a player with Ideology ${ideology} at ${expected}`, (): void => {
      expect(show(startingRates(ideology))).to.equal(expected);
    })
  );

  it('should keep the starting 1 lux through the first turn', (): void => {
    expect(
      show(
        tradeRates({
          ...state('0/0/0', { ideology: 1, turn: 1 }),
          rates: startingRates(1),
        })
      )
    ).to.equal('5/4/1');
  });
});
