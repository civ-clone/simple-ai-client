import * as Advances from '@civ-clone/civ1-science/Advances';
import {
  GenghisKhan,
  MahatmaGandhi,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  NuclearPower,
  Recycling,
  Robotics,
  TheWheel,
} from '@civ-clone/civ1-science/Advances';
import Advance from '@civ-clone/core-science/Advance';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import ChooseResearch from '../Strategies/Science/ChooseResearch';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Leader from '@civ-clone/core-civilization/Leader';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
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
//  number generator that always returns `random`, with Civ1's personality rules if `wanted`.
const setUp = (
  LeaderType: typeof Leader,
  unknown: (typeof Advance)[],
  random: number,
  wanted = true
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

  if (wanted) {
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

  it('should draw once, among the wanted advances only, when several are available', (): void => {
    const setup = setUp(
      MahatmaGandhi,
      [TheWheel, Robotics, Recycling, NuclearPower],
      0.99
    );

    expect(['NuclearPower', 'Recycling', 'Robotics']).to.include(
      setup.choose()
    );
    expect(setup.draws()).to.equal(1);
  });

  it("should pick at random as before when none of the leader's wanted advances is available", (): void => {
    const setup = setUp(GenghisKhan, [TheWheel, Recycling], 0),
      control = setUp(GenghisKhan, [TheWheel, Recycling], 0, false);

    expect(setup.choose()).to.equal(control.choose());
    expect(setup.draws()).to.equal(1);
  });

  it('should still choose once science has stopped', (): void => {
    // Genghis Khan has Robotics, so his science has stopped, but the engine still asks for a choice.
    const setup = setUp(GenghisKhan, [TheWheel], 0.5);

    expect(setup.choose()).to.equal('TheWheel');
    expect(setup.draws()).to.equal(1);
  });
});
