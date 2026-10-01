// Civ1: whether a Wonder would do anything for a player (civ-clone/web-renderer#212). An obsolete Wonder does nothing,
//  and Civ1 makes one obsolete as soon as anyone discovers the advance that obsoletes it. The Lighthouse and Magellan's
//  Expedition only help ships, so they do nothing for a player with none.
import {
  Lighthouse,
  MagellansExpedition,
} from '@civ-clone/civ1-wonder/Wonders';
import Dependencies from '../Dependencies';
import { Naval } from '@civ-clone/library-unit/Types';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import { isObsolete } from '@civ-clone/civ1-wonder/Rules/lib/obsolete';

const forShips: (typeof Wonder)[] = [Lighthouse, MagellansExpedition];

export const isUsefulWonder = (
  dependencies: Dependencies,
  player: Player,
  WonderType: typeof Wonder
): boolean =>
  !isObsolete(WonderType, dependencies.playerResearchRegistry) &&
  (!forShips.includes(WonderType) ||
    dependencies.unitRegistry
      .getByPlayer(player)
      .some((unit: Unit): boolean => unit instanceof Naval));

export default isUsefulWonder;
