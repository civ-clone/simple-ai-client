import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import DemandTribute from '@civ-clone/library-diplomacy/Proposals/DemandTribute';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import chooseNegotiationStep from '../lib/Diplomacy/chooseNegotiationStep';
import { expect } from 'chai';

// Steps of the talks as the chooser sees them: only their class matters.
const step = (Type: { prototype: object }) => Object.create(Type.prototype),
  choose = (...steps: object[]) =>
    chooseNegotiationStep(
      {} as Dependencies,
      {} as Player,
      {
        choices: () => steps.map((value) => ({ value: () => value })),
      } as unknown as ChoiceMeta<'negotiation.next-step'>
    );

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
