import {
  SneakAttack,
  SneakStealTechnology,
} from '@civ-clone/library-unit/Actions';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Action from '@civ-clone/core-unit/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Effect from '@civ-clone/core-rule/Effect';
import ExchangeKnowledge from '@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge';
import MemoryRegistry from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import OfferPeace from '@civ-clone/library-diplomacy/Proposals/OfferPeace';
import Pacified from '@civ-clone/library-diplomacy/Rules/Player/Pacified';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { actionToTake } from '../lib/Unit/moveUnit';
import chooseNegotiationStep from '../lib/Diplomacy/chooseNegotiationStep';
import { expect } from 'chai';

// A player twice as strong as its rival, pacified towards the rival or not (as the Great Wall's or the United Nations'
//  owner would make it, civ-clone/web-renderer#30). `shouldAttack` weighs each side's units' attack and defence; the
//  units here are only that.
const setUp = (pacified: boolean) => {
  const player = new Player(),
    rival = new Player(),
    ruleRegistry = new RuleRegistry(),
    unitOf = (strength: number) => ({
      attack: () => ({ value: () => strength }),
      defence: () => ({ value: () => 0 }),
    }),
    dependencies = {
      memoryRegistry: new MemoryRegistry(),
      ruleRegistry,
      turn: { value: () => 1 },
      unitRegistry: {
        getByPlayer: (owner: Player) => [unitOf(owner === player ? 10 : 5)],
      },
    } as unknown as Dependencies,
    // Only the class and the players matter, so the steps are made without running their constructors.
    stepOf = <T>(StepType: new (...args: any[]) => T, fields: object = {}): T =>
      Object.assign(Object.create(StepType.prototype), {
        players: () => [player, rival],
        ...fields,
      }),
    choose = (...steps: object[]): unknown =>
      chooseNegotiationStep(dependencies, player, {
        choices: () => steps.map((step) => ({ value: () => step })),
      } as any);

  if (pacified) {
    ruleRegistry.register(
      new Pacified(
        new Criterion(
          (who: Player, towards: Player): boolean =>
            who === player && towards === rival
        ),
        new Effect((): boolean => true)
      )
    );
  }

  return { choose, dependencies, player, rival, stepOf };
};

describe('pacified (civ-clone/web-renderer#30)', (): void => {
  it("should decline a weaker rival's peace, unless pacified towards it", (): void => {
    [false, true].forEach((pacified: boolean): void => {
      const { choose, stepOf } = setUp(pacified),
        accept = stepOf(Accept),
        decline = stepOf(Decline);

      expect(choose(accept, decline)).equal(pacified ? accept : decline);
    });
  });

  it('should offer peace to a weaker rival it is pacified towards, after exchanging knowledge', (): void => {
    const { choose, stepOf } = setUp(true),
      exchange = stepOf(ExchangeKnowledge),
      offer = stepOf(OfferPeace);

    expect(choose(offer, exchange)).equal(exchange);
    expect(choose(offer)).equal(offer);
  });

  it('should not break the peace with a weaker rival it is pacified towards', (): void => {
    [SneakAttack, SneakStealTechnology].forEach((SneakAction): void => {
      const hostile = setUp(false),
        pacified = setUp(true),
        sneak = (rival: Player) =>
          Object.assign(Object.create(SneakAction.prototype), {
            _enemy: rival,
          }) as Action;

      const hostileSneak = sneak(hostile.rival);

      expect(
        actionToTake(hostile.dependencies, hostile.player, [hostileSneak])
      ).equal(hostileSneak);
      expect(
        actionToTake(pacified.dependencies, pacified.player, [
          sneak(pacified.rival),
        ])
      ).null;
    });
  });
});
