import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import DemandTribute from '@civ-clone/library-diplomacy/Proposals/DemandTribute';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import { expect } from 'chai';
import { handleNegotiation } from '../lib/Diplomacy/negotiate';
import interaction from '@civ-clone/civ1-diplomacy/Rules/Negotiation/interaction';
import position from '@civ-clone/civ1-diplomacy/tests/lib/position';
import resolved from '@civ-clone/civ1-diplomacy/Rules/Proposal/resolved';
import step from '@civ-clone/civ1-diplomacy/Rules/Negotiation/step';

describe('handleNegotiation (civ-clone/web-renderer#450)', (): void => {
  it('asks the player whose move it is, so the human chooses after the hand-over', async (): Promise<void> => {
    // At peace, the computer player afraid (fear 2) and with $200: after the hand-over the human may demand tribute.
    const setup = position([
        {
          gold: 200,
          cities: [0, 0],
          units: [{ on: 0, attack: 1, defence: 2 }],
        },
        { human: true, units: [{ on: 0, attack: 4, defence: 1 }] },
      ]),
      { dependencies, players, ruleRegistry } = setup,
      [computer, human] = players,
      asked = new Map<Player, string[][]>(
        players.map((player) => [player, []])
      ),
      // Each client records what it's offered and takes a demand, then an acceptance, then the first step.
      clientFor = (player: Player) => ({
        player: () => player,
        chooseFromList: async (meta: ChoiceMeta<'negotiation.next-step'>) => {
          const steps = meta
            .choices()
            .map((choice) => choice.value() as unknown as IAction);

          asked
            .get(player)!
            .push(steps.map((action) => action.constructor.name));

          return (
            steps.find(
              (action) =>
                action instanceof DemandTribute && action.by() === player
            ) ??
            steps.find((action) => action instanceof Accept) ??
            steps[0]
          );
        },
      });

    ruleRegistry.register(
      ...step(dependencies, () => 0.9),
      ...resolved(dependencies, () => 0.9),
      ...interaction(dependencies)
    );
    setup.interactionRegistry.register(
      new Peace(computer, human, new Never(), ruleRegistry)
    );

    const clients = new Map(
      players.map((player) => [player, clientFor(player)])
    );

    // The rules still tell a human from a computer player by the helper's `getBy`.
    Object.assign(dependencies.clientRegistry, {
      getByPlayer: (player: Player) => clients.get(player),
    });

    await handleNegotiation(dependencies, computer, human);

    expect(asked.get(human)).deep.include(['DemandTribute', 'Terminate']);
    expect(
      asked
        .get(computer)!
        .some(
          (offered) =>
            offered.includes('Terminate') && offered.includes('DemandTribute')
        )
    ).false;
    expect(setup.gold.get(human)).equal(100);
  });
});
