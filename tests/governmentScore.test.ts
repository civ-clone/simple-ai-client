import {
  Communism,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  CityImprovementContent,
  Food,
  PopulationUnhappiness,
  Production,
  Trade,
} from '@civ-clone/library-city/Yields';
import { bestGovernment, governmentScore } from '../lib/Government/score';
import BornContent from '@civ-clone/base-city-happiness/Rules/BornContent';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Government from '@civ-clone/core-government/Government';
import GovernmentTerms from '@civ-clone/base-government-terms/Rules/GovernmentTerms';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import ScienceBias from '@civ-clone/base-leader-personality/Rules/Player/ScienceBias';
import { Terms } from '@civ-clone/base-government-terms/lib/terms';
import Unit from '@civ-clone/core-unit/Unit';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
import { preferredGovernment } from '../lib/Civ1/government';

// Civ2's terms (civ2-government's and civ2-city's) for the governments used here.
const civ2Terms = new Map<typeof Government, Partial<Terms>>([
  [
    Despotism,
    {
      freeUnits: (size: number): number => size,
      unitSupportCost: 1,
      martialLaw: { maximumUnits: 3, perUnit: 1 },
      militaryUnhappiness: { perUnit: 0, free: 0 },
      tilePenalty: { threshold: 2, amount: 1 },
      tradeBonus: 0,
      corruption: { perDistance: 3 / 100, fixedDistance: null },
      noUnhappiness: false,
      science: 1,
    },
  ],
  [
    Monarchy,
    {
      freeUnits: (): number => 3,
      unitSupportCost: 1,
      martialLaw: { maximumUnits: 3, perUnit: 1 },
      militaryUnhappiness: { perUnit: 0, free: 0 },
      tilePenalty: null,
      tradeBonus: 0,
      corruption: { perDistance: 3 / 120, fixedDistance: null },
      noUnhappiness: false,
      science: 1,
    },
  ],
  [
    Communism,
    {
      freeUnits: (): number => 3,
      unitSupportCost: 1,
      martialLaw: { maximumUnits: 3, perUnit: 2 },
      militaryUnhappiness: { perUnit: 0, free: 0 },
      tilePenalty: null,
      tradeBonus: 0,
      corruption: { perDistance: 3 / 140, fixedDistance: 10 },
      noUnhappiness: false,
      science: 1,
    },
  ],
  [
    Fundamentalism,
    {
      freeUnits: (): number => 8,
      unitSupportCost: 1,
      martialLaw: { maximumUnits: 0, perUnit: 1 },
      militaryUnhappiness: { perUnit: 0, free: 0 },
      tilePenalty: null,
      tradeBonus: 0,
      corruption: { perDistance: 0, fixedDistance: null },
      noUnhappiness: true,
      science: 0.5,
    },
  ],
  [
    Republic,
    {
      freeUnits: (): number => 0,
      unitSupportCost: 1,
      martialLaw: { maximumUnits: 0, perUnit: 1 },
      militaryUnhappiness: { perUnit: 1, free: 1 },
      tilePenalty: null,
      tradeBonus: 1,
      corruption: { perDistance: 3 / 160, fixedDistance: null },
      noUnhappiness: false,
      science: 1,
    },
  ],
]);

type Square = [food: number, shields: number, trade: number];

// A player under `GovernmentType` with `cities` cities, each `size` with born content `content`, working `squares`,
//  supporting `units` (of which `away` are away from it and the rest in it), `distance` from the capital, putting
//  `research` of its trade into science, led by a leader whose `ScienceBias` (civilize) is `bias`.
const setUp = ({
  GovernmentType = Monarchy as typeof Government,
  cities = 4,
  size = 8,
  content = 3,
  squares = [[2, 1, 2]] as Square[],
  units = 2,
  away = 0,
  distance = 6,
  research = 60,
  bias = 0,
  civ2 = true,
  buildings = 0,
} = {}) => {
  const ruleRegistry = new RuleRegistry(),
    player = new Player(ruleRegistry),
    government = new (GovernmentType as any)() as Government,
    capitalTile: { distanceFrom: (other: unknown) => number } = {
      distanceFrom: (other: unknown): number =>
        other === capitalTile ? 0 : distance,
    },
    cityList: City[] = new Array(cities).fill(null).map((_, index) => {
      const tile = {},
        squareYields = squares.map(([food, shields, trade]) => [
          new Food(food),
          new Production(shields),
          new Trade(trade),
        ]);

      return {
        player: () => player,
        tile: () => (index === 0 ? capitalTile : tile),
        tileYieldRules: () => [],
        yields: () => [
          new PopulationUnhappiness(Math.max(0, size - content)),
          ...(buildings > 0
            ? [
                new CityImprovementContent(buildings, {
                  id: () => 'temple',
                } as never),
              ]
            : []),
        ],
        tileYields: (square: number) => squareYields[square],
        index,
      } as unknown as City;
    }),
    unitsOf = (city: City): Unit[] =>
      new Array(units).fill(null).map(
        (_, index) =>
          ({
            attack: () => ({ value: () => 1 }),
            hasTrait: () => false,
            player: () => player,
            tile: () => (index < away ? {} : city.tile()),
          } as unknown as Unit)
      );

  if (civ2) {
    ruleRegistry.register(
      new GovernmentTerms(
        new Criterion((Type: typeof Government): boolean =>
          civ2Terms.has(Type)
        ),
        new Effect((Type: typeof Government) => civ2Terms.get(Type)!)
      ),
      new BornContent(new Effect((): number => content))
    );
  }

  ruleRegistry.register(new ScienceBias(new Effect((): number => bias)));

  return {
    player,
    dependencies: createDependencies({
      ruleRegistry,
      cityRegistry: { getByPlayer: () => cityList } as any,
      cityGrowthRegistry: {
        getByCity: () => ({ size: () => size }),
      } as any,
      cityImprovementRegistry: {
        getByCity: (city: any) =>
          city.index === 0 ? [Object.create(Palace.prototype)] : [],
      } as any,
      playerGovernmentRegistry: {
        getByPlayer: () => ({
          current: () => government,
          is: (...governments: (typeof Government)[]): boolean =>
            governments.some((Type) => government instanceof Type),
        }),
      } as any,
      playerTradeRatesRegistry: {
        getByPlayer: () => ({ get: () => ({ value: () => research }) }),
      } as any,
      unitRegistry: {
        getByCity: (city: City) => unitsOf(city),
        getByTile: (tile: unknown) =>
          cityList
            .filter((city) => city.tile() === tile)
            .flatMap((city) => unitsOf(city))
            .filter((unit) => unit.tile() === tile),
      } as any,
      workedTileRegistry: {
        getByCity: () =>
          squares.map((_, index) => ({ tile: () => index as unknown })),
      } as any,
    }),
  };
};

const available = [
  Despotism,
  Monarchy,
  Communism,
  Fundamentalism,
  Republic,
] as (typeof Government)[];

describe('governments by what they do (governmentScore)', (): void => {
  it("should score nothing, and choose as v474.05 does, where the rule set numbers no government (Civ1's)", (): void => {
    const { dependencies, player } = setUp({ civ2: false });

    expect(governmentScore(dependencies, player, Monarchy)).null;
    expect(
      preferredGovernment(dependencies, player, [Despotism, Monarchy])
    ).equal(Monarchy);
  });

  it('should choose the Republic for a civilized leader whose cities have trade and few units abroad', (): void => {
    const { dependencies, player } = setUp({
      squares: [
        [2, 1, 2],
        [2, 0, 3],
        [1, 2, 1],
        [2, 1, 2],
      ],
      content: 8,
      bias: 1,
    });

    expect(bestGovernment(dependencies, player, available)).equal(Republic);
  });

  it('should choose Fundamentalism for a militaristic leader with unhappy cities, many units and little trade', (): void => {
    const { dependencies, player } = setUp({
      squares: [
        [2, 2, 0],
        [2, 1, 0],
      ],
      size: 9,
      content: 3,
      units: 6,
      away: 3,
      bias: -1,
    });

    expect(bestGovernment(dependencies, player, available)).equal(
      Fundamentalism
    );
  });

  it('should keep science for a civilized leader that a militaristic one would trade for content', (): void => {
    const squares: Square[] = [
        [2, 1, 3],
        [2, 1, 3],
        [2, 1, 3],
      ],
      civilized = setUp({ squares, size: 7, units: 3, bias: 1, research: 70 }),
      militaristic = setUp({
        squares,
        size: 7,
        units: 3,
        bias: -1,
        research: 70,
      });

    expect(
      governmentScore(civilized.dependencies, civilized.player, Fundamentalism)!
    ).lessThan(
      governmentScore(
        militaristic.dependencies,
        militaristic.player,
        Fundamentalism
      )!
    );
  });

  it('should stay with the government it has unless another is worth a sixteenth of its trade more', (): void => {
    // Monarchy is worth a little more than Communism for these cities (Communism's corruption is the same everywhere,
    //  the capital included), but less than the 2 of their 32 trade a revolution has to repay.
    const under = (GovernmentType: typeof Government) =>
      setUp({
        GovernmentType,
        squares: [[2, 1, 8]],
        units: 3,
        size: 5,
        distance: 10,
      });

    [Monarchy, Communism].forEach((GovernmentType) => {
      const { dependencies, player } = under(GovernmentType);

      expect(bestGovernment(dependencies, player, [Monarchy, Communism])).equal(
        GovernmentType
      );
    });

    const { dependencies, player } = under(Communism);

    expect(
      governmentScore(dependencies, player, Monarchy)! -
        governmentScore(dependencies, player, Communism)!
    ).within(0, 2);
  });

  it("should count only the unhappy citizens the city's improvements leave", (): void => {
    const options = {
        squares: [
          [2, 2, 0],
          [2, 1, 0],
        ] as Square[],
        size: 9,
        units: 6,
        away: 3,
        bias: -1,
      },
      bare = setUp(options),
      built = setUp({ ...options, buildings: 4 });

    expect(
      governmentScore(bare.dependencies, bare.player, Fundamentalism)! -
        governmentScore(built.dependencies, built.player, Fundamentalism)!
    ).equal(4 * 2 * 4);
  });

  it('should keep the government it has on a tie, as with no cities', (): void => {
    const { dependencies, player } = setUp({ cities: 0 });

    expect(bestGovernment(dependencies, player, available)).equal(Monarchy);
  });
});
