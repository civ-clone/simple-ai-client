import * as Advances from '@civ-clone/civ1-science/Advances';
import {
  GenghisKhan,
  MahatmaGandhi,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  AbrahamLincoln,
  ElizabethI,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  Democracy,
  Feudalism,
  NuclearPower,
  Recycling,
  Robotics,
  TheWheel,
} from '@civ-clone/civ1-science/Advances';
import Advance from '@civ-clone/core-science/Advance';
import AdvanceGrade from '@civ-clone/base-leader-personality/Rules/Player/AdvanceGrade';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import ChooseResearch from '../Strategies/Science/ChooseResearch';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Effect from '@civ-clone/core-rule/Effect';
import Leader from '@civ-clone/core-civilization/Leader';
import { Militaristic } from '@civ-clone/civ1-civilization/Traits';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import Rule from '@civ-clone/core-rule/Rule';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
import leaderHas from '@civ-clone/base-leader-personality/lib/leaderHas';
import { personalityRules } from '@civ-clone/civ1-civilization/registerPersonality';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import requirements from '@civ-clone/civ1-science/Rules/Research/requirements';

type SetUp = {
  draws: () => number;
  playerResearch: PlayerResearch;
  // Offers the research choice to the strategy, as `StrategyAIClient` does, and returns what it picked.
  choose: () => string | null;
};

// A Civ1 player led by `LeaderType` who knows every advance but `unknown`, choosing what to research with a random
//  number generator that always returns `random`, with Civ1's personality rules if `wanted`, or `rules` in their place.
const setUp = (
  LeaderType: typeof Leader,
  unknown: (typeof Advance)[],
  random: number,
  wanted = true,
  rules: ((traitRegistry: TraitRegistry) => Rule[]) | null = null
): SetUp => {
  const traitRegistry = new TraitRegistry(),
    ruleRegistry = new RuleRegistry(),
    advanceRegistry = new AdvanceRegistry(),
    player = new Player(ruleRegistry),
    CivilizationType =
      LeaderType.civilization() as unknown as new () => Civilization,
    civilization = new CivilizationType(),
    playerResearch = new PlayerResearch(player, advanceRegistry, ruleRegistry),
    playerResearchRegistry = new PlayerResearchRegistry();

  let draws = 0;

  registerTraits(traitRegistry);
  ruleRegistry.register(...requirements());

  if (rules !== null) {
    ruleRegistry.register(...rules(traitRegistry));
  } else if (wanted) {
    ruleRegistry.register(...personalityRules(traitRegistry));
  }
  advanceRegistry.register(
    ...(Object.values(Advances) as unknown as (typeof Advance)[])
  );
  civilization.setLeader(
    new (LeaderType as unknown as new (registry: TraitRegistry) => Leader)(
      traitRegistry
    )
  );
  player.setCivilization(civilization);
  playerResearchRegistry.register(playerResearch);

  advanceRegistry
    .entries()
    .filter(
      (AdvanceType: typeof Advance): boolean => !unknown.includes(AdvanceType)
    )
    .forEach((AdvanceType: typeof Advance): void =>
      playerResearch.addAdvance(AdvanceType)
    );

  const dependencies = createDependencies({
      playerResearchRegistry,
      randomNumberGenerator: (): number => {
        draws += 1;

        return random;
      },
      ruleRegistry,
      traitRegistry,
    }),
    strategy = new ChooseResearch(dependencies, civ1Knowledge);

  return {
    choose: (): string | null => {
      const action = new PlayerAction(player, playerResearch);

      expect(strategy.handles(action)).true;
      expect(strategy.attempt(action)).true;

      return playerResearch.researching()?.name ?? null;
    },
    draws: (): number => draws,
    playerResearch,
  };
};

describe('ChooseResearch', (): void => {
  it('should research a wanted advance ahead of any other', (): void => {
    // The Wheel comes last in what's available, and a draw of 0.99 would pick it.
    const setup = setUp(MahatmaGandhi, [TheWheel, Robotics], 0.99);

    expect(
      setup.playerResearch
        .available()
        .map((AdvanceType: typeof Advance): string => AdvanceType.name)
    ).to.deep.equal(['Robotics', 'TheWheel']);
    expect(setup.choose()).to.equal('Robotics');
    expect(setup.draws()).to.equal(1);
  });

  it('should choose among the wanted advances only, drawing once for each, when several are available', (): void => {
    const setup = setUp(
      MahatmaGandhi,
      [TheWheel, Robotics, Recycling, NuclearPower],
      0.99
    );

    expect(['NuclearPower', 'Recycling', 'Robotics']).to.include(
      setup.choose()
    );
    expect(setup.draws()).to.equal(3);
  });

  // Democracy grades 3 + 2 × Ideology and Feudalism 5 − Ideology, so at a draw of 0.5 (2 × the grade) a Civilized
  //  leader picks Democracy (10 against 8), a Militaristic one Feudalism (12 against 2), and a normal one Feudalism
  //  (10 against 6) (civ-clone/web-renderer#157).
  (
    [
      [AbrahamLincoln, 'Democracy'],
      [GenghisKhan, 'Feudalism'],
      [ElizabethI, 'Feudalism'],
    ] as [typeof Leader, string][]
  ).forEach(([LeaderType, expected]) =>
    it(`should research ${expected} ahead of the other as ${LeaderType.name}, by its grade`, (): void => {
      const setup = setUp(LeaderType, [Democracy, Feudalism], 0.5);

      expect(setup.choose()).to.equal(expected);
      expect(setup.draws()).to.equal(2);
    })
  );

  // A grade for Militaristic leaders alone leaves everyone else's research as it was: at random, with one draw, not
  //  always the first of what's available.
  it('should pick at random, with one draw, when no grade applies to the leader', (): void => {
    const militaristicGrades = (traitRegistry: TraitRegistry): Rule[] => [
        new AdvanceGrade(
          leaderHas(traitRegistry, Militaristic),
          new Effect(() => 5)
        ),
      ],
      gandhi = setUp(
        MahatmaGandhi,
        [Democracy, Feudalism],
        0.99,
        false,
        militaristicGrades
      ),
      genghisKhan = setUp(
        GenghisKhan,
        [Democracy, Feudalism],
        0.99,
        false,
        militaristicGrades
      );

    expect(gandhi.choose()).to.equal('Feudalism');
    expect(gandhi.draws()).to.equal(1);
    // Graded alike, so the first highest draw: Democracy.
    expect(genghisKhan.choose()).to.equal('Democracy');
    expect(genghisKhan.draws()).to.equal(2);
  });

  it('should pick at random, with one draw, when the ruleset grades no advance', (): void => {
    const setup = setUp(AbrahamLincoln, [Democracy, Feudalism], 0.99, false);

    expect(setup.choose()).to.equal('Feudalism');
    expect(setup.draws()).to.equal(1);
  });

  it('should still choose once science has stopped', (): void => {
    // Genghis Khan has Robotics, so his science has stopped, but the engine still asks for a choice.
    const setup = setUp(GenghisKhan, [TheWheel], 0.5);

    expect(setup.choose()).to.equal('TheWheel');
    expect(setup.draws()).to.equal(1);
  });
});
