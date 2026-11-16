// Generic: hands a ruleset's offer of a revolution (`player:government:available`, from base-government-change's
//  `offerGovernments`, emitted with the player and the government an advance made available) to the player's client,
//  when it's a computer player's. Civ2's rules make the offer; Civ1's never do, so nothing is heard there.
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
import SimpleAIClient from '../../SimpleAIClient';

export const GOVERNMENT_AVAILABLE = 'player:government:available';

// Engines already listened to, so registering the rules for a game twice doesn't answer each offer twice.
const listening = new WeakSet<Engine>();

export const listen = (
  engine: Engine,
  clientRegistry: ClientRegistry
): void => {
  if (listening.has(engine)) {
    return;
  }

  listening.add(engine);

  engine.on(
    GOVERNMENT_AVAILABLE,
    (player: Player, GovernmentType: typeof Government): void => {
      const [client] = clientRegistry.getBy('player', player);

      if (client instanceof SimpleAIClient) {
        client.governmentAvailable(GovernmentType);
      }
    }
  );
};

export default listen;
