import {
  Communism,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import BornContent from '@civ-clone/base-city-happiness/Rules/BornContent';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import GovernmentTerms from '@civ-clone/base-government-terms/Rules/GovernmentTerms';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { Terms } from '@civ-clone/base-government-terms/lib/terms';
import { Unhappiness } from '@civ-clone/library-city/Yields';
import Unit from '@civ-clone/core-unit/Unit';
import civ1DisorderPolicy from '../lib/Civ1/disorder';
import civ1Knowledge from '../lib/Civ1/knowledge';
import civ1MartialLawPolicy from '../lib/Civ1/martialLaw';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
import { martialLawUnitsWanted } from '../lib/City/defence';
import unitSupport from '../lib/Civ1/unitSupport';

// Civ2's numbers, as civ2-government registers them (`Rules/Government/terms`), for the governments used here.
const civ2Terms = new Map<typeof Government, Partial<Terms>>([
  [
    Despotism,
    {
      freeUnits: (size: number): number => size,
      martialLaw: { maximumUnits: 3, perUnit: 1 },
      tilePenalty: { threshold: 2, amount: 1 },
      tradeBonus: 0,
    },
  ],
  [
    Monarchy,
    {
      freeUnits: (): number => 3,
      martialLaw: { maximumUnits: 3, perUnit: 1 },
      tilePenalty: null,
      tradeBonus: 0,
    },
  ],
  [
    Communism,
    {
      freeUnits: (): number => 3,
      martialLaw: { maximumUnits: 3, perUnit: 2 },
      tilePenalty: null,
      tradeBonus: 0,
    },
  ],
  [
    Fundamentalism,
    {
      freeUnits: (): number => 8,
      martialLaw: { maximumUnits: 0, perUnit: 1 },
      noUnhappiness: true,
      tilePenalty: null,
      tradeBonus: 0,
    },
  ],
  [
    Republic,
    {
      freeUnits: (): number => 0,
      martialLaw: { maximumUnits: 0, perUnit: 1 },
      tilePenalty: null,
      tradeBonus: 1,
    },
  ],
]);

// A city of `size` under `GovernmentType`, supporting `units` Warriors, in a game whose rules are Civ1's (no terms) or
//  number the governments as Civ2 does, and give `content` citizens born content when given.
const setUp = ({
  GovernmentType = Monarchy as typeof Government,
  size = 5,
  units = 0,
  civ2 = false,
  content = null as number | null,
} = {}) => {
  const ruleRegistry = new RuleRegistry(),
    city = {
      player: () => ({}),
      tile: () => ({}),
    } as unknown as City,
    government = new (GovernmentType as any)() as Government;

  if (civ2) {
    ruleRegistry.register(
      new GovernmentTerms(
        new Criterion((Type: typeof Government): boolean =>
          civ2Terms.has(Type)
        ),
        new Effect((Type: typeof Government) => civ2Terms.get(Type)!)
      )
    );
  }

  if (content !== null) {
    ruleRegistry.register(new BornContent(new Effect((): number => content)));
  }

  return {
    city,
    dependencies: createDependencies({
      ruleRegistry,
      cityGrowthRegistry: {
        getByCity: () => ({ size: () => size }),
      } as any,
      playerGovernmentRegistry: {
        getByPlayer: () => ({
          current: () => government,
          is: (...governments: (typeof Government)[]): boolean =>
            governments.some((Type) => government instanceof Type),
        }),
      } as any,
      unitRegistry: {
        getByCity: () =>
          new Array(units).fill(null).map(
            () =>
              Object.assign(Object.create(Unit.prototype), {
                hasTrait: () => false,
              }) as Unit
          ),
      } as any,
    }),
  };
};

describe('rule set terms (L24)', (): void => {
  describe('unit support', (): void => {
    it("should charge a shield for every unit outside Despotism by Civ1's rules", (): void => {
      const { dependencies, city } = setUp({ units: 0 });

      expect(unitSupport(dependencies, city)).equal(1);
    });

    it("should support as many units as the city's size for nothing under Despotism by Civ1's rules", (): void => {
      const under = setUp({ GovernmentType: Despotism, units: 4 }),
        at = setUp({ GovernmentType: Despotism, units: 5 });

      expect(unitSupport(under.dependencies, under.city)).equal(0);
      expect(unitSupport(at.dependencies, at.city)).equal(1);
    });

    it("should read the free units where the rule set numbers them: Civ2's Monarchy supports 3", (): void => {
      const two = setUp({ civ2: true, units: 2 }),
        three = setUp({ civ2: true, units: 3 }),
        republic = setUp({ civ2: true, units: 0, GovernmentType: Republic });

      expect(unitSupport(two.dependencies, two.city)).equal(0);
      expect(unitSupport(three.dependencies, three.city)).equal(1);
      expect(unitSupport(republic.dependencies, republic.city)).equal(1);
    });
  });

  describe('martial law', (): void => {
    it("should use up to 3 units at 1 citizen each under Civ1's Communism", (): void => {
      const { dependencies, city } = setUp({ GovernmentType: Communism });

      expect(civ1MartialLawPolicy.limit(dependencies, city)).equal(3);
      expect(civ1MartialLawPolicy.perUnit!(dependencies, city)).equal(1);
      expect(
        martialLawUnitsWanted(dependencies, civ1Knowledge, city, [
          new Unhappiness(3),
        ])
      ).equal(3);
    });

    it("should want a unit for each 2 unhappy citizens under Civ2's Communism, and none under its Republic", (): void => {
      const communism = setUp({ GovernmentType: Communism, civ2: true }),
        republic = setUp({ GovernmentType: Republic, civ2: true });

      expect(
        civ1MartialLawPolicy.perUnit!(communism.dependencies, communism.city)
      ).equal(2);
      expect(
        martialLawUnitsWanted(
          communism.dependencies,
          civ1Knowledge,
          communism.city,
          [new Unhappiness(3)]
        )
      ).equal(2);
      expect(
        martialLawUnitsWanted(
          communism.dependencies,
          civ1Knowledge,
          communism.city,
          [new Unhappiness(8)]
        )
      ).equal(3);
      expect(
        civ1MartialLawPolicy.limit(republic.dependencies, republic.city)
      ).equal(0);
    });
  });

  describe('growth unhappiness', (): void => {
    it("should count Civ1's 3 born content where the rule set says nothing", (): void => {
      const three = setUp({ size: 2 }),
        four = setUp({ size: 3 });

      expect(
        civ1DisorderPolicy.unhappinessOnGrowth(three.dependencies, three.city)
      ).equal(0);
      expect(
        civ1DisorderPolicy.unhappinessOnGrowth(four.dependencies, four.city)
      ).equal(1);
    });

    it("should read the rule set's born content: a person's Chieftain city in Civ2 has 6", (): void => {
      const five = setUp({ size: 5, content: 6 }),
        six = setUp({ size: 6, content: 6 }),
        deity = setUp({ size: 1, content: 1 });

      expect(
        civ1DisorderPolicy.unhappinessOnGrowth(five.dependencies, five.city)
      ).equal(0);
      expect(
        civ1DisorderPolicy.unhappinessOnGrowth(six.dependencies, six.city)
      ).equal(1);
      expect(
        civ1DisorderPolicy.unhappinessOnGrowth(deity.dependencies, deity.city)
      ).equal(1);
    });

    it('should expect no unhappiness from growth under a government with none', (): void => {
      const { dependencies, city } = setUp({
        GovernmentType: Fundamentalism,
        civ2: true,
        size: 6,
      });

      expect(civ1DisorderPolicy.unhappinessOnGrowth(dependencies, city)).equal(
        0
      );
    });
  });
});
