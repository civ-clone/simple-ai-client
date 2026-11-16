import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
export declare const GOVERNMENT_AVAILABLE = 'player:government:available';
export declare const listen: (
  engine: Engine,
  clientRegistry: ClientRegistry
) => void;
export default listen;
