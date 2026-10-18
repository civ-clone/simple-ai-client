// Civ1: how many defenders a city wants (civ-clone/web-renderer#423). From v474.05's AI:
//  - to build or buy (OpenCivOne `Segment_1ade.cs` `F0_1ade_0421`, ~L1060-1095), a quarter of its size, and one more
//    where it's contested, at least one;
//  - to keep, and call idle defenders in to (`AIEngine.cs` L858-930), its size over 4, plus one, or over 3 with a rival
//    unit next to it.
// On top, as #423 asks, a city wants as many defenders as there are units able to attack it close by, up to
//  `THREAT_CAP`: the attacks an enemy could make on it in a turn or two. v474.05 also keeps more in the capital
//  (one less to divide by); measured in the arena, that cost about a tenth of a player's power and score for no fewer
//  cities lost, so it's left out.
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// How far from a city an enemy unit counts as a threat to it, and how many such units a city answers with defenders.
export const THREAT_RADIUS = 3;
export const THREAT_CAP = 3;

// Whether `player` has a peace treaty with `other`.
const atPeace = (
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

// A unit of a player `city`'s owner has no peace treaty with.
const enemyOf =
  (dependencies: Dependencies, city: City) =>
  (unit: Unit): boolean =>
    unit.player() !== city.player() &&
    !atPeace(dependencies, city.player(), unit.player());

// Whether an enemy unit is on a tile next to `city`. v474.05 counts any other player's unit; a treaty partner's
//  explorer passing by isn't counted here, as it isn't a threat.
export const threatened = (dependencies: Dependencies, city: City): boolean =>
  city
    .tile()
    .getNeighbours()
    .some((tile: Tile): boolean =>
      dependencies.unitRegistry
        .getByTile(tile)
        .some(enemyOf(dependencies, city))
    );

// How many enemy units that can attack are within `THREAT_RADIUS` of `city`.
export const attackersNear = (dependencies: Dependencies, city: City): number =>
  city
    .tile()
    .getSurroundingArea(THREAT_RADIUS)
    .entries()
    .reduce(
      (total: number, tile: Tile): number =>
        total +
        dependencies.unitRegistry
          .getByTile(tile)
          .filter(
            (unit: Unit): boolean =>
              enemyOf(dependencies, city)(unit) && unit.attack().value() > 0
          ).length,
      0
    );

export const isCapital = (dependencies: Dependencies, city: City): boolean =>
  dependencies.cityImprovementRegistry
    .getByCity(city)
    .some((improvement) => improvement instanceof Palace);

const sizeOf = (dependencies: Dependencies, city: City): number =>
  dependencies.cityGrowthRegistry.getByCity(city).size();

export const defendersWanted = (
  dependencies: Dependencies,
  city: City
): number =>
  Math.max(
    1,
    Math.floor(sizeOf(dependencies, city) / 4) +
      (threatened(dependencies, city) ? 1 : 0),
    Math.min(attackersNear(dependencies, city), THREAT_CAP)
  );

export const defendersKept = (dependencies: Dependencies, city: City): number =>
  Math.max(
    defendersWanted(dependencies, city),
    Math.floor(
      sizeOf(dependencies, city) / (threatened(dependencies, city) ? 3 : 4)
    ) + 1
  );
