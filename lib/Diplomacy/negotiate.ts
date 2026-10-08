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

declare global {
  interface ChoiceMetaDataMap {
    'negotiation.next-step': IAction;
  }
}

const awaitTimeout = (delay: number, reason?: any) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(
        () => (reason === undefined ? resolve() : reject(reason)),
        delay
      )
    ),
  MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;

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
    const lastInteraction = negotiation.lastInteraction(),
      players =
        lastInteraction !== null
          ? lastInteraction.for()
          : negotiation.players().slice(1);

    await players.reduce(
      async (promise, participant) =>
        promise
          .then(async () => {
            const client = dependencies.clientRegistry.getByPlayer(participant),
              nextSteps = negotiation.nextSteps(),
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

// Negotiates, one after another, with each other player that has a unit next to `unit` and hasn't negotiated with
//  `player` recently.
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
    .filter((other) =>
      dependencies.interactionRegistry
        .getByPlayer(other)
        .filter(
          (interaction) =>
            interaction instanceof Negotiation &&
            interaction.isBetween(other, player)
        )
        .every(
          (interaction) =>
            dependencies.turn.value() - interaction.when() >
            MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION
        )
    )
    .reduce(
      (promise, other): Promise<any> =>
        promise.then(() => handleNegotiation(dependencies, player, other)),
      Promise.resolve()
    );
};

export default canNegotiate;
