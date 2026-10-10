import {
  ElizabethI,
  GenghisKhan,
  MahatmaGandhi,
} from '@civ-clone/civ1-civilization/Leaders';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Leader from '@civ-clone/core-civilization/Leader';
import MemoryRegistry from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TraitRegistry from '@civ-clone/core-civilization/TraitRegistry';
import { expect } from 'chai';
import { militaryPower, shouldAttack } from '../lib/shouldAttack';
import { personalityRules } from '@civ-clone/civ1-civilization/registerPersonality';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';

describe('shouldAttack', (): void => {
  // Units here are only their attack and defence, which is all `shouldAttack` weighs; `strength` is each player's
  //  total, and `asked` counts the units whose strength was worked out.
  //  `leader` leads the player, with Civ1's traits and personality rules.
  const setUp = (leader: typeof Leader | null = null) => {
    const traitRegistry = new TraitRegistry(),
      ruleRegistry = new RuleRegistry(),
      player = new Player(),
      rival = new Player(),
      strength = new Map<Player, number>([
        [player, 10],
        [rival, 5],
      ]),
      state = { turn: 1, asked: 0 },
      dependencies = {
        memoryRegistry: new MemoryRegistry(),
        ruleRegistry,
        turn: { value: (): number => state.turn },
        unitRegistry: {
          getByPlayer: (owner: Player) => [
            {
              attack: () => {
                state.asked++;

                return { value: (): number => strength.get(owner)! };
              },
              defence: () => ({ value: (): number => 0 }),
            },
          ],
        },
      } as unknown as Dependencies;

    if (leader !== null) {
      const civilization = new Civilization();

      registerTraits(traitRegistry);
      ruleRegistry.register(...personalityRules(traitRegistry));
      civilization.setLeader(
        new (leader as unknown as new (registry: TraitRegistry) => Leader)(
          traitRegistry
        )
      );
      player.setCivilization(civilization);
    }

    return { dependencies, player, rival, state, strength };
  };

  it('should weigh each side once a turn, however often it is asked (civ-clone/web-renderer#311)', (): void => {
    const { dependencies, player, rival, state } = setUp();

    expect(shouldAttack(dependencies, player, rival)).to.true;
    expect(shouldAttack(dependencies, player, rival)).to.true;
    expect(shouldAttack(dependencies, player, rival)).to.true;

    expect(state.asked).to.equal(2);
  });

  it('should keep the totals for the rest of the turn, and weigh again in the next', (): void => {
    const { dependencies, player, rival, state, strength } = setUp();

    expect(shouldAttack(dependencies, player, rival)).to.true;

    // The rival grows stronger mid-turn: not seen until the next turn.
    strength.set(rival, 20);

    expect(shouldAttack(dependencies, player, rival)).to.true;

    state.turn = 2;

    expect(shouldAttack(dependencies, player, rival)).to.false;
    expect(militaryPower(dependencies, player, rival)).to.equal(20);
  });

  it("should keep each player's view of the totals apart", (): void => {
    const { dependencies, player, rival, strength } = setUp();

    expect(militaryPower(dependencies, player, rival)).to.equal(5);

    strength.set(rival, 7);

    // Worked out afresh for a player who hasn't weighed the rival this turn.
    expect(militaryPower(dependencies, rival, rival)).to.equal(7);
    expect(militaryPower(dependencies, player, rival)).to.equal(5);
  });

  // 17 against 20 is 0.85: enough for an Aggressive leader (× 1.25), not for a Friendly (× 0.9) or normal one
  //  (civ-clone/web-renderer#157).
  (
    [
      [GenghisKhan, true],
      [ElizabethI, false],
      [MahatmaGandhi, false],
    ] as [typeof Leader, boolean][]
  ).forEach(([leader, expected]) =>
    it(`should ${
      expected ? '' : 'not '
    }attack at 0.85 of the rival's strength as ${leader.name}`, (): void => {
      const { dependencies, player, rival, strength } = setUp(leader);

      strength.set(player, 17);
      strength.set(rival, 20);

      expect(shouldAttack(dependencies, player, rival)).to.equal(expected);
    })
  );

  it("should hold back at 1.05 of the rival's strength as a Friendly leader", (): void => {
    const { dependencies, player, rival, strength } = setUp(MahatmaGandhi);

    strength.set(player, 21);
    strength.set(rival, 20);

    expect(shouldAttack(dependencies, player, rival)).false;
  });
});
