import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import Negotiation from '@civ-clone/core-diplomacy/Negotiation';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import {
  MOST_UNANSWERED,
  choosers,
  handleNegotiation,
} from '../lib/Diplomacy/negotiate';
import { expect } from 'chai';

// By identity: a failed deep comparison of two players would print the whole game.
const only = (players: Player[], player: Player): boolean =>
  players.length === 1 && players[0] === player;

// A meeting between `computer` and `human`, its last interaction for `lastFor` (or none), and steps made by `by`.
const setUp = (lastFor: 'computer' | 'human' | null) => {
  const ruleRegistry = new RuleRegistry(),
    computer = new Player(ruleRegistry),
    human = new Player(ruleRegistry),
    players = { computer, human },
    negotiation = Object.assign(
      new Negotiation(computer, human, ruleRegistry),
      {
        lastInteraction: () =>
          lastFor === null ? null : { for: () => [players[lastFor]] },
      }
    ) as unknown as Negotiation,
    steps = (...by: ('computer' | 'human')[]): IAction[] =>
      by.map((who) => ({ by: () => players[who] } as unknown as IAction));

  return { computer, human, negotiation, steps };
};

describe('choosers (civ-clone/web-renderer#450)', (): void => {
  it("asks the player whose steps are on offer, even when the last interaction was for the other: the human's move after the hand-over", (): void => {
    // The human's OK to "You respond..." is for the computer player, but the demand and the goodbye are the human's.
    const { human, negotiation, steps } = setUp('computer');

    expect(only(choosers(negotiation, steps('human', 'human')), human)).true;
  });

  it("asks whoever the last interaction was for when the steps are more than one player's", (): void => {
    const { human, negotiation, steps } = setUp('human');

    expect(only(choosers(negotiation, steps('computer', 'human')), human)).true;
  });

  it('asks the player met when nothing has been said yet', (): void => {
    const { human, negotiation, steps } = setUp(null);

    expect(only(choosers(negotiation, steps('computer', 'human')), human)).true;
  });
});

describe('handleNegotiation (civ-clone/web-renderer#877)', (): void => {
  // A meeting under no rules at all, so the only step ever on offer is leaving, with a client for both players that
  //  answers the `answers`th time it's asked and with nothing before that.
  const meet = async (answers: number) => {
    const ruleRegistry = new RuleRegistry(),
      player = new Player(ruleRegistry),
      other = new Player(ruleRegistry),
      registered: unknown[] = [];

    let asked = 0;

    const negotiation = await handleNegotiation(
      {
        ruleRegistry,
        clientRegistry: {
          getByPlayer: () => ({
            chooseFromList: async (
              meta: ChoiceMeta<'negotiation.next-step'>
            ): Promise<IAction | undefined> =>
              ++asked >= answers ? meta.choices()[0].value() : undefined,
          }),
        },
        interactionRegistry: {
          register: (interaction: unknown) => registered.push(interaction),
        },
      } as unknown as Dependencies,
      player,
      other
    );

    return { asked, negotiation, player, registered };
  };

  it('ends a negotiation no one answers, rather than asking for ever', async (): Promise<void> => {
    const { asked, negotiation, player, registered } = await meet(Infinity);

    expect(asked).equal(MOST_UNANSWERED);
    expect(negotiation.terminated()).true;
    expect(negotiation.lastInteraction()).instanceof(Terminate);
    expect(negotiation.lastInteraction()!.by() === player).true;
    expect(registered.length).equal(1);
  });

  it('goes on asking a player who has only been slow, and takes the answer', async (): Promise<void> => {
    const { asked, negotiation } = await meet(MOST_UNANSWERED - 1);

    expect(asked).equal(MOST_UNANSWERED - 1);
    expect(negotiation.terminated()).true;
    // Initiate, then the one answer: nothing was ended for them.
    expect(negotiation.interactions().length).equal(2);
  });
});
