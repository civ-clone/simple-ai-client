import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import DemandTribute from '@civ-clone/library-diplomacy/Proposals/DemandTribute';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import chooseNegotiationStep, {
  MOST_NEGOTIATION_STEPS,
} from '../lib/Diplomacy/chooseNegotiationStep';
import { expect } from 'chai';

// Steps of the talks as the chooser sees them: only their class matters.
const step = (Type: { prototype: object }) => Object.create(Type.prototype),
  // `player`'s answer from `steps` in `negotiation` (the choice's data: what tells one negotiation from another).
  chooseIn = (negotiation: object, player: Player, ...steps: object[]) =>
    chooseNegotiationStep({} as Dependencies, player, {
      choices: () => steps.map((value) => ({ value: () => value })),
      data: () => negotiation,
    } as unknown as ChoiceMeta<'negotiation.next-step'>),
  choose = (...steps: object[]) => chooseIn({}, {} as Player, ...steps);

describe('chooseNegotiationStep (civ-clone/web-renderer#674)', (): void => {
  it('accepts where it can, whichever comes first', (): void => {
    const accept = step(Accept);

    expect(choose(step(Decline), accept)).equal(accept);
    expect(choose(accept, step(Decline))).equal(accept);
  });

  it('carries on rather than leaving, with Good bye offered first', (): void => {
    const demand = step(DemandTribute);

    expect(choose(step(Terminate), demand)).equal(demand);
  });

  it('leaves when that is all there is', (): void => {
    const goodbye = step(Terminate);

    expect(choose(goodbye)).equal(goodbye);
  });
});

describe('chooseNegotiationStep: a negotiation that goes on and on (civ-clone/web-renderer#877)', (): void => {
  // A ruleset that offers leaving and carrying on for ever: the AI carries on until it has answered
  //  `MOST_NEGOTIATION_STEPS`, then leaves. The answers given, until it leaves.
  const talk = (
    negotiation: object,
    player: Player,
    limit = MOST_NEGOTIATION_STEPS * 2
  ): object[] => {
    const answers: object[] = [];

    while (answers.length < limit) {
      const answer = chooseIn(
        negotiation,
        player,
        step(Terminate),
        step(DemandTribute)
      );

      answers.push(answer);

      if (answer instanceof Terminate) {
        break;
      }
    }

    return answers;
  };

  it('leaves once it has answered as many steps as it will', (): void => {
    const answers = talk({}, {} as Player);

    expect(answers.length).equal(MOST_NEGOTIATION_STEPS + 1);
    expect(
      answers.slice(0, -1).every((answer) => answer instanceof DemandTribute)
    ).true;
    expect(answers[answers.length - 1]).instanceOf(Terminate);
  });

  it('leaves rather than accepting, past that', (): void => {
    const negotiation = {},
      player = {} as Player;

    talk(negotiation, player, MOST_NEGOTIATION_STEPS);

    expect(
      chooseIn(negotiation, player, step(Accept), step(Terminate))
    ).instanceOf(Terminate);
  });

  it('still answers past that when leaving is not on offer', (): void => {
    const negotiation = {},
      player = {} as Player,
      demand = step(DemandTribute);

    talk(negotiation, player, MOST_NEGOTIATION_STEPS);

    expect(chooseIn(negotiation, player, demand)).equal(demand);
  });

  it('counts each negotiation on its own, however they interleave', (): void => {
    const first = {},
      second = {},
      player = {} as Player;

    // Turn about, each of the two is at most just under the limit: neither is left.
    for (let i = 0; i < MOST_NEGOTIATION_STEPS; i++) {
      expect(
        chooseIn(first, player, step(Terminate), step(DemandTribute))
      ).instanceOf(DemandTribute);
      expect(
        chooseIn(second, player, step(Terminate), step(DemandTribute))
      ).instanceOf(DemandTribute);
    }

    expect(
      chooseIn(first, player, step(Terminate), step(DemandTribute))
    ).instanceOf(Terminate);
    // A new negotiation starts again from nothing.
    expect(talk({}, player).length).equal(MOST_NEGOTIATION_STEPS + 1);
  });

  it('counts each player on its own in the same negotiation', (): void => {
    const negotiation = {},
      first = {} as Player,
      second = {} as Player;

    expect(talk(negotiation, first, MOST_NEGOTIATION_STEPS).length).equal(
      MOST_NEGOTIATION_STEPS
    );
    expect(talk(negotiation, second).length).equal(MOST_NEGOTIATION_STEPS + 1);
  });
});
