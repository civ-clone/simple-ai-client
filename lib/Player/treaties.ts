// Generic: how far a computer player's treaties with another player go, from base-diplomacy's `treatyLevel`. Civ1 has
//  only peace; Civ2 adds the ceasefire below it and the alliance above it (an alliance is also a peace).
import {
  TreatyLevel,
  hasTreatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';

// Whether `player` and `other` have a treaty: a ceasefire, a peace or an alliance.
export const hasTreaty = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  hasTreatyLevel(dependencies, player, other, TreatyLevel.Ceasefire);

// Whether `other` is `player`'s ally.
export const isAlly = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  other !== player &&
  hasTreatyLevel(dependencies, player, other, TreatyLevel.Alliance);

// The city on `tile`, if it's one of `player`'s allies'. Under Civ2's rules a unit can't go into an ally's city: moving
//  onto it repairs the unit there and ends its turn instead (civ2-unit's `allied-repair`).
export const alliedCityAt = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): City | null => {
  const city = dependencies.cityRegistry.getByTile(tile);

  return city !== null && isAlly(dependencies, player, city.player())
    ? city
    : null;
};
