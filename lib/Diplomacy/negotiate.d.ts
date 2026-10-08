import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import Negotiation from '@civ-clone/core-diplomacy/Negotiation';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
declare global {
  interface ChoiceMetaDataMap {
    'negotiation.next-step': IAction;
  }
}
export declare const handleNegotiation: (
  dependencies: Dependencies,
  player: Player,
  other: Player
) => Promise<Negotiation>;
export declare const canNegotiate: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => Promise<void>;
export default canNegotiate;
