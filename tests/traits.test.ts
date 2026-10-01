import {
  AbrahamLincoln,
  AlexanderTheGreat,
  ElizabethI,
  FrederickTheGreat,
  GenghisKhan,
  Hammurabi,
  JosephStalin,
  JuliusCaesar,
  MahatmaGandhi,
  MaoZedong,
  MoctezumaII,
  NapoleonI,
  RamessesII,
  Shaka,
} from '@civ-clone/civ1-civilization/Leaders';
import { ideology, mood, policy } from '../lib/traits';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Leader from '@civ-clone/core-civilization/Leader';
import Player from '@civ-clone/core-player/Player';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import { createDependencies } from '../lib/Dependencies';
import { expect } from 'chai';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';

// A player led by `LeaderType`, with its traits looked up in `traitRegistry`.
const playerLedBy = (
  LeaderType: typeof Leader,
  traitRegistry: TraitRegistry
): Player => {
  const player = new Player(new RuleRegistry()),
    CivilizationType =
      LeaderType.civilization() as unknown as new () => Civilization,
    civilization = new CivilizationType();

  civilization.setLeader(
    new (LeaderType as unknown as new (registry: TraitRegistry) => Leader)(
      traitRegistry
    )
  );
  player.setCivilization(civilization);

  return player;
};

describe('traits', (): void => {
  // `civ1-civilization/registerTraits.ts`, OpenCivOne's `nationTypes` and the book's Table 7-1: Mood is Friendly (−1)
  //  to Aggressive (1), Policy Perfectionist (−1) to Expansionist (1) and Ideology Militaristic (−1) to Civilized (1).
  (
    [
      [AbrahamLincoln, -1, 0, 1],
      [MoctezumaII, 0, -1, 1],
      [Hammurabi, -1, -1, 1],
      [MaoZedong, 0, 0, 1],
      [RamessesII, 0, 0, 1],
      [ElizabethI, 0, 1, 0],
      [NapoleonI, 1, 1, 1],
      [FrederickTheGreat, 1, -1, 1],
      [AlexanderTheGreat, 0, 1, -1],
      [MahatmaGandhi, -1, -1, 0],
      [GenghisKhan, 1, 1, -1],
      [JuliusCaesar, 0, 1, 1],
      [JosephStalin, 1, 0, -1],
      [Shaka, 1, 0, 0],
    ] as [typeof Leader, number, number, number][]
  ).forEach(([LeaderType, expectedMood, expectedPolicy, expectedIdeology]) =>
    it(`should read ${LeaderType.name}'s mood, policy and ideology from the trait registry`, (): void => {
      const traitRegistry = new TraitRegistry();

      registerTraits(traitRegistry);

      const dependencies = createDependencies({ traitRegistry }),
        player = playerLedBy(LeaderType, traitRegistry);

      expect(mood(dependencies, player)).to.equal(expectedMood);
      expect(policy(dependencies, player)).to.equal(expectedPolicy);
      expect(ideology(dependencies, player)).to.equal(expectedIdeology);
    })
  );

  it('should look traits up when asked, not when the leader was created', (): void => {
    const traitRegistry = new TraitRegistry(),
      player = playerLedBy(GenghisKhan, traitRegistry),
      dependencies = createDependencies({ traitRegistry });

    // The leader was created before its traits were registered, so its own `traits()` is empty.
    registerTraits(traitRegistry);

    expect(player.civilization().leader()!.traits().length).to.equal(0);
    expect(ideology(dependencies, player)).to.equal(-1);
  });

  it('should treat a player with no civilization or leader as normal on every axis', (): void => {
    const traitRegistry = new TraitRegistry();

    registerTraits(traitRegistry);

    const dependencies = createDependencies({ traitRegistry }),
      player = new Player(new RuleRegistry());

    expect(mood(dependencies, player)).to.equal(0);
    expect(policy(dependencies, player)).to.equal(0);
    expect(ideology(dependencies, player)).to.equal(0);
  });
});
