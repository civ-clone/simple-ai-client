// Generic: the players a computer player might fight (civ-clone/web-renderer#424, #374). An enemy is a player it has
//  no peace treaty with. A rival is an enemy it's stronger than, by `core-power`'s `MilitaryStrength` with its leader's
//  `AttackConfidence` on its side, that has a city it knows of and could reach: on a landmass where it has a city, or
//  overseas, from a port it could ferry units from (`lib/Unit/overseas`).
import AttackConfidence from '@civ-clone/base-leader-personality/Rules/Player/AttackConfidence';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { canFerryFromLandmassOf } from '../Unit/overseas';
import { continentOf } from '../City/explorers';
import { militaryPower } from '@civ-clone/core-power/lib/strength';
import { product } from '@civ-clone/base-leader-personality/lib/combine';

export const atPeace = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  dependencies.interactionRegistry
    .getByPlayers(player, other)
    .some(
      (interaction) =>
        interaction instanceof Peace && (interaction as Peace).active()
    );

export const isEnemy = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean => other !== player && !atPeace(dependencies, player, other);

// The power of `units`, attack and defence together.
export const powerOf = (dependencies: Dependencies, units: Unit[]): number =>
  militaryPower(units, dependencies.ruleRegistry);

export const powerOfPlayer = (
  dependencies: Dependencies,
  player: Player
): number =>
  powerOf(dependencies, dependencies.unitRegistry.getByPlayer(player));

// `player`'s power as its leader sees it against `other`'s: `AttackConfidence` makes a bold leader feel the stronger.
export const confidentPower = (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  power: number = powerOfPlayer(dependencies, player)
): number =>
  power * product(dependencies.ruleRegistry, AttackConfidence, player, other);

// The enemy cities `player` knows of.
export const knownEnemyCities = (
  dependencies: Dependencies,
  player: Player
): City[] => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  return dependencies.cityRegistry
    .entries()
    .filter(
      (city: City): boolean =>
        isEnemy(dependencies, player, city.player()) &&
        playerWorld.includes(city.tile())
    );
};

const rivals = new WeakMap<Player, { turn: number; rival: Player | null }>();

// `player`'s nearest rival, if it has one. Worked out once a turn.
export const rivalOf = (
  dependencies: Dependencies,
  player: Player
): Player | null => {
  const turn = dependencies.turn.value(),
    known = rivals.get(player);

  if (known && known.turn === turn) {
    return known.rival;
  }

  const cities = dependencies.cityRegistry.getByPlayer(player),
    power = powerOfPlayer(dependencies, player),
    landmasses = cities.map(
      (city: City): Set<Tile> => continentOf(turn, city.tile())
    ),
    canFerry =
      power > 0 &&
      cities.some((city: City): boolean =>
        canFerryFromLandmassOf(dependencies, player, city.tile())
      ),
    weaker = new Map<Player, boolean>(),
    isWeaker = (other: Player): boolean => {
      if (!weaker.has(other)) {
        weaker.set(
          other,
          powerOfPlayer(dependencies, other) <
            confidentPower(dependencies, player, other, power)
        );
      }

      return weaker.get(other)!;
    },
    distance = (city: City): number =>
      Math.min(
        ...cities.map((own: City): number =>
          own.tile().distanceFrom(city.tile())
        )
      ),
    [nearest] =
      power > 0 && cities.length > 0
        ? knownEnemyCities(dependencies, player)
            .filter(
              (city: City): boolean =>
                (canFerry ||
                  landmasses.some((landmass: Set<Tile>): boolean =>
                    landmass.has(city.tile())
                  )) &&
                isWeaker(city.player())
            )
            .sort((a: City, b: City): number => distance(a) - distance(b))
        : [],
    rival = nearest?.player() ?? null;

  rivals.set(player, { turn, rival });

  return rival;
};

export default rivalOf;
