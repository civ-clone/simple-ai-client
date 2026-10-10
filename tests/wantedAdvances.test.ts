import * as Advances from '@civ-clone/civ1-science/Advances';
import {
  AbrahamLincoln,
  AlexanderTheGreat,
  ElizabethI,
  GenghisKhan,
  JosephStalin,
  MahatmaGandhi,
  MaoZedong,
  Shaka,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  Computers,
  FusionPower,
  GeneticEngineering,
  NuclearPower,
  Plastics,
  Recycling,
  Robotics,
  SpaceFlight,
  Superconductor,
} from '@civ-clone/civ1-science/Advances';
import { scienceStopped, wantedAdvances } from '../lib/Science/wantedAdvances';
import Advance from '@civ-clone/core-science/Advance';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Leader from '@civ-clone/core-civilization/Leader';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
import { Friendly, Militaristic } from '@civ-clone/civ1-civilization/Traits';
import { personalityRules } from '@civ-clone/civ1-civilization/registerPersonality';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';

type SetUp = {
  dependencies: Dependencies;
  player: Player;
  playerResearch: PlayerResearch;
};

// A player led by `LeaderType`, with Civ1's leader traits, or `traitRegistry`'s, and Civ1's personality rules (or none).
const setUp = (
  LeaderType: typeof Leader,
  traitRegistry: TraitRegistry = new TraitRegistry(),
  withPersonality: boolean = true
): SetUp => {
  if (traitRegistry.length === 0) {
    registerTraits(traitRegistry);
  }

  const ruleRegistry = new RuleRegistry(),
    player = new Player(ruleRegistry),
    CivilizationType =
      LeaderType.civilization() as unknown as new () => Civilization,
    civilization = new CivilizationType(),
    advanceRegistry = new AdvanceRegistry(),
    playerResearch = new PlayerResearch(player, advanceRegistry, ruleRegistry),
    playerResearchRegistry = new PlayerResearchRegistry();

  if (withPersonality) {
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

  return {
    dependencies: createDependencies({
      playerResearchRegistry,
      ruleRegistry,
      traitRegistry,
    }),
    player,
    playerResearch,
  };
};

const names = (advances: (typeof Advance)[]): string[] =>
  advances
    .map((AdvanceType: typeof Advance): string => AdvanceType.name)
    .sort();

const stopped = ({ dependencies, player }: SetUp): boolean =>
  scienceStopped(dependencies, player);

describe('wantedAdvances', (): void => {
  (
    [
      // Militaristic: nothing beyond Robotics, whatever its other traits, unless it's Friendly.
      [GenghisKhan, [Robotics]],
      [AlexanderTheGreat, [Robotics]],
      [JosephStalin, [Robotics]],
      // Normal militarism: Recycling and Nuclear Power too.
      [MahatmaGandhi, [Robotics, Recycling, NuclearPower]],
      [ElizabethI, [Robotics, Recycling, NuclearPower]],
      [Shaka, [Robotics, Recycling, NuclearPower]],
      // Civilized: the advances behind the late Wonders and the spaceship. Mao Zedong's mood is normal, so not Recycling
      //  or Nuclear Power.
      [
        MaoZedong,
        [
          Robotics,
          Computers,
          GeneticEngineering,
          SpaceFlight,
          Plastics,
          Superconductor,
          FusionPower,
        ],
      ],
      // Abraham Lincoln is Friendly as well, so he wants all nine.
      [
        AbrahamLincoln,
        [
          Robotics,
          Recycling,
          NuclearPower,
          Computers,
          GeneticEngineering,
          SpaceFlight,
          Plastics,
          Superconductor,
          FusionPower,
        ],
      ],
    ] as [typeof Leader, (typeof Advance)[]][]
  ).forEach(([LeaderType, expected]) =>
    it(`should want ${names(expected).join(', ')} for ${
      LeaderType.name
    }`, (): void => {
      const { dependencies, player } = setUp(LeaderType);

      expect(names(wantedAdvances(dependencies, player)!)).to.deep.equal(
        names(expected)
      );
    })
  );

  it('should add Recycling and Nuclear Power for a Friendly leader, even a Militaristic one', (): void => {
    const traitRegistry = new TraitRegistry();

    traitRegistry.register(
      new Friendly(GenghisKhan),
      new Militaristic(GenghisKhan)
    );

    const { dependencies, player } = setUp(GenghisKhan, traitRegistry);

    expect(names(wantedAdvances(dependencies, player)!)).to.deep.equal(
      names([Robotics, Recycling, NuclearPower])
    );
  });

  it('should never want an advance Civ1 has no use for, nor list one twice', (): void => {
    [AbrahamLincoln, MahatmaGandhi, GenghisKhan].forEach(
      (LeaderType: typeof Leader): void => {
        const { dependencies, player } = setUp(LeaderType),
          wanted = names(wantedAdvances(dependencies, player)!);

        expect(new Set(wanted).size).to.equal(wanted.length);
        expect(wanted.filter((name) => /Future/.test(name))).to.deep.equal([]);
      }
    );
  });
});

describe('scienceStopped', (): void => {
  it('should stop Genghis Khan at Robotics', (): void => {
    const setup = setUp(GenghisKhan);

    expect(stopped(setup)).false;

    setup.playerResearch.addAdvance(Robotics);

    expect(stopped(setup)).true;
  });

  it('should carry Gandhi on past Robotics until he has Recycling and Nuclear Power', (): void => {
    const setup = setUp(MahatmaGandhi);

    setup.playerResearch.addAdvance(Robotics);

    expect(stopped(setup)).false;

    setup.playerResearch.addAdvance(Recycling);

    expect(stopped(setup)).false;

    setup.playerResearch.addAdvance(NuclearPower);

    expect(stopped(setup)).true;
  });

  it('should not stop Gandhi without Robotics, whatever else he has', (): void => {
    const setup = setUp(MahatmaGandhi);

    setup.playerResearch.addAdvance(Recycling);
    setup.playerResearch.addAdvance(NuclearPower);

    expect(stopped(setup)).false;
  });

  it('should carry a Civilized leader on until it has every advance it wants', (): void => {
    const setup = setUp(MaoZedong),
      wanted = [
        Robotics,
        Computers,
        GeneticEngineering,
        SpaceFlight,
        Plastics,
        Superconductor,
      ];

    wanted.forEach((AdvanceType: typeof Advance): void =>
      setup.playerResearch.addAdvance(AdvanceType)
    );

    expect(stopped(setup)).false;

    setup.playerResearch.addAdvance(FusionPower);

    expect(stopped(setup)).true;
  });

  it('should never stop a player with no research', (): void => {
    const { dependencies, player } = setUp(GenghisKhan),
      emptyDependencies = createDependencies({
        playerResearchRegistry: new PlayerResearchRegistry(),
        ruleRegistry: dependencies.ruleRegistry,
        traitRegistry: dependencies.traitRegistry,
      });

    expect(scienceStopped(emptyDependencies, player)).false;
  });

  it('should never stop a player whose ruleset says nothing about what its leader wants', (): void => {
    const setup = setUp(GenghisKhan, new TraitRegistry(), false);

    setup.playerResearch.addAdvance(Robotics);

    expect(wantedAdvances(setup.dependencies, setup.player)).null;
    expect(stopped(setup)).false;
  });
});
