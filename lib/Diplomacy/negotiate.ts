// Generic: opening negotiations with the players whose units are next to one of ours, and seeing them through.
import { IInteraction } from '@civ-clone/core-diplomacy/Interaction';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import Initiate from '@civ-clone/core-diplomacy/Negotiation/Initiate';
import Negotiation from '@civ-clone/core-diplomacy/Negotiation';
import Player from '@civ-clone/core-player/Player';
import Resolution from '@civ-clone/core-diplomacy/Proposal/Resolution';
import Unit from '@civ-clone/core-unit/Unit';
import mayNegotiate from '@civ-clone/library-diplomacy/lib/mayNegotiate';

declare global {
  interface ChoiceMetaDataMap {
    'negotiation.next-step': IAction;
  }
}

const awaitTimeout = (delay: number, reason?: any) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay)
  );

// Who chooses the next step of `negotiation` from `offered`: the player whose steps they are, or, when they're more
//  than one player's, whoever the last interaction was for. Usually those are the same, but not always: after the
//  hand-over in a meeting at peace, the other player's acknowledgement is for the computer player, and the next move
//  is the other player's (civ-clone/web-renderer#450). The page's own client asks the same way.
export const choosers = (
  negotiation: Negotiation,
  offered: IAction[]
): Player[] => {
  const actors = Array.from(new Set(offered.map((step) => step.by()))),
    lastInteraction = negotiation.lastInteraction();

  if (actors.length === 1) {
    return actors;
  }

  return lastInteraction !== null
    ? lastInteraction.for()
    : negotiation.players().slice(1);
};

export const handleNegotiation = async (
  dependencies: Dependencies,
  player: Player,
  other: Player
): Promise<Negotiation> => {
  const negotiation = new Negotiation(player, other, dependencies.ruleRegistry);

  negotiation.proceed(
    new Initiate(player, negotiation, dependencies.ruleRegistry) as IAction
  );

  while (!negotiation.terminated()) {
    // The steps on offer, worked out once for the first player asked: each call makes new actions.
    let offered: IAction[] | null = negotiation.nextSteps();

    const players = choosers(negotiation, offered);

    await players.reduce(
      async (promise, participant) =>
        promise
          .then(async () => {
            const client = dependencies.clientRegistry.getByPlayer(participant),
              nextSteps = offered ?? negotiation.nextSteps(),
              resultPromise = Promise.race([
                client.chooseFromList(
                  new ChoiceMeta(
                    nextSteps,
                    'negotiation.next-step',
                    negotiation
                  )
                ),
                client instanceof AIClient
                  ? awaitTimeout(
                      500,
                      new Error(
                        `Timeout waiting for ${client.player().id()} (${
                          client.player().civilization().sourceClass().name
                        }) - sent ${nextSteps.length} options`
                      )
                    )
                  : new Promise<void>(() => {}),
              ]);

            offered = null;

            const interaction = await resultPromise;

            if (!interaction) {
              return;
            }

            negotiation.proceed(interaction);

            if (interaction instanceof Resolution) {
              await interaction.proposal().resolve(interaction);
            }

            // Sleep for a bit to ensure any other async actions have taken place
            await awaitTimeout(20);
          })
          .catch((reason) => console.error(reason)),
      Promise.resolve()
    );

    if (negotiation.terminated()) {
      break;
    }
  }

  dependencies.interactionRegistry.register(negotiation as IInteraction);

  return negotiation;
};

// Negotiates, one after another, with each other player that has a unit next to `unit` and may negotiate with `player`
//  now.
export const canNegotiate = async (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): Promise<void> => {
  const surroundingPlayers = Array.from(
    new Set(
      unit
        .tile()
        .getNeighbours()
        .flatMap((tile) =>
          dependencies.unitRegistry
            .getByTile(tile)
            .map((tileUnit) => tileUnit.player())
            .filter((other) => other !== player)
        )
    )
  );

  if (surroundingPlayers.length === 0) {
    return;
  }

  await surroundingPlayers
    // How often players talk is the ruleset's to say (`MayNegotiate`).
    .filter((other) =>
      mayNegotiate(
        player,
        other,
        dependencies.ruleRegistry,
        dependencies.interactionRegistry,
        dependencies.turn
      )
    )
    .reduce(
      (promise, other): Promise<any> =>
        promise.then(() => handleNegotiation(dependencies, player, other)),
      Promise.resolve()
    );
};

export default canNegotiate;
