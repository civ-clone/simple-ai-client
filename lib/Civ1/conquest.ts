// Civ1: the numbers behind a computer player's conquest (civ-clone/web-renderer#377), for `base-strategy-victory`'s
//  generic campaign.
//
// All ours: v474.05's AI attacks case by case, with no campaign to decode. Conquest weighs on a player as it gets
//  closer: nothing until it holds `CONQUEST_FROM` of the world's cities, rising to `CONQUEST_WEIGHT` at `CONQUEST_AT`,
//  and passing the space race's 1 half way, where finishing the conquest becomes the nearer win. Until then its attacks
//  are the case-by-case ones every player makes, which took more cities in the arena than a campaign run against a
//  stronger player's nearest rival, and a campaign started early cost players cities and score (Dom, on
//  civ-clone/web-renderer#377). Not while it still knows of good sites for cities on its landmasses: once it has none
//  it's done expanding for good, as the sites a revealed coast or a razed city turn up came and went from one turn to
//  the next. Its target is its rival's (`lib/Player/rivals`) on a landmass where it has a city: an overseas rival is
//  left to the invasions of `lib/Unit/overseas`.
//
// The target is the rival's city nearest the player's own, one without City Walls counting as `WALLS_DISTANCE` nearer.
//  Attackers gather in the player's city nearest it, and go once there are `MUSTER_ATTACKERS` of them with
//  `MUSTER_ADVANTAGE` times the attack of the city's defence (tripled behind its walls, as Civ1's are), or with the
//  `MUSTER_ATTACKERS` alone once the campaign has waited `MUSTER_WAIT` turns. Only attackers within `MARCH_TURNS`
//  of it join in.
import {
  Automobile,
  HorsebackRiding,
  IronWorking,
  Mathematics,
  Metallurgy,
  TheWheel,
} from '@civ-clone/civ1-science/Advances';
import { knownEnemyCities, rivalOf } from '../Player/rivals';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import { CityWalls } from '@civ-clone/civ1-city-improvement/CityImprovements';
import { ConquestPolicy } from '@civ-clone/base-strategy-victory/lib/Conquest/ConquestPolicy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { defendersIn, defendersKept, keepsOrder } from '../City/defence';
import { directPrerequisites } from '@civ-clone/base-strategy-victory/lib/research';
import {
  ProductionPolicy,
  defaultProductionPolicy,
  isAttacker,
} from './buildItemInCity';
import { militaryStrength } from '@civ-clone/core-power/lib/strength';

export const CONQUEST_FROM = 0.5;
export const CONQUEST_AT = 0.75;
// Twice the space race's 1.
export const CONQUEST_WEIGHT = 2;
export const WALLS_DISTANCE = 8;
export const MUSTER_ATTACKERS = 3;
export const MUSTER_ADVANTAGE = 2;
export const MUSTER_WAIT = 10;
export const MARCH_TURNS = 10;
// Civ1's City Walls triple a city's defence against land units.
const WALLS_DEFENCE = 3;

// The advances for each better attacker in turn: Horsemen, Chariots, Legions, Catapults, Cannons, Armor.
const attackerAdvances: (typeof Advance)[] = [
  HorsebackRiding,
  TheWheel,
  IronWorking,
  Mathematics,
  Metallurgy,
  Automobile,
];

const knows = (
  dependencies: Dependencies,
  player: Player,
  AdvanceType: typeof Advance
): boolean =>
  dependencies.playerResearchRegistry
    .getByPlayer(player)
    .completed(AdvanceType);

const hasWalls = (dependencies: Dependencies, city: City): boolean =>
  dependencies.cityImprovementRegistry
    .getByCity(city)
    .some(
      (improvement: CityImprovement): boolean =>
        improvement instanceof CityWalls
    );

// The share of the world's cities `player` holds. A destroyed city stays in the registry, so it isn't counted from
//  there.
const shareOf = (dependencies: Dependencies, player: Player): number =>
  dependencies.cityRegistry.getByPlayer(player).length /
  Math.max(
    1,
    dependencies.cityRegistry
      .entries()
      .filter((city: City): boolean => !city.destroyed()).length
  );

// The players done expanding.
const settled = new WeakSet<Player>();

// Whether `player` still knows of a good site for a city on a landmass where it has one: its Settlers come first.
//  Asked only once it holds `CONQUEST_FROM` of the world's cities, as early on it may know of none yet.
const expanding = (dependencies: Dependencies, player: Player): boolean => {
  if (settled.has(player)) {
    return false;
  }

  const turn = dependencies.turn.value(),
    landmasses = dependencies.cityRegistry
      .getByPlayer(player)
      .map((city: City): Set<Tile> => continentOf(turn, city.tile()));

  const sites = dependencies.memoryRegistry
    .memoryFor(player)
    .targets.goodSitesForCities.some((site: Tile): boolean =>
      landmasses.some((landmass: Set<Tile>): boolean => landmass.has(site))
    );

  if (!sites) {
    settled.add(player);
  }

  return sites;
};

const weights = new WeakMap<Player, { turn: number; weight: number }>();

// Worked out once a turn: every strategy asks.
const weightOf = (dependencies: Dependencies, player: Player): number => {
  const turn = dependencies.turn.value(),
    known = weights.get(player);

  if (known && known.turn === turn) {
    return known.weight;
  }

  const share = shareOf(dependencies, player),
    weight =
      share < CONQUEST_FROM || expanding(dependencies, player)
        ? 0
        : CONQUEST_WEIGHT *
          Math.min(1, (share - CONQUEST_FROM) / (CONQUEST_AT - CONQUEST_FROM));

  weights.set(player, { turn, weight });

  return weight;
};

const targets = new WeakMap<Player, { turn: number; target: City | null }>();

// Kept while it's still the rival's and reachable, so that a campaign isn't turned round by a city that's a little
//  nearer.
const targetOf = (dependencies: Dependencies, player: Player): City | null => {
  const turn = dependencies.turn.value(),
    known = targets.get(player);

  if (known && known.turn === turn) {
    return known.target;
  }

  const rival = rivalOf(dependencies, player),
    cities = dependencies.cityRegistry.getByPlayer(player),
    landmasses = cities.map(
      (city: City): Set<Tile> => continentOf(turn, city.tile())
    ),
    candidates =
      rival === null
        ? []
        : knownEnemyCities(dependencies, player).filter(
            (city: City): boolean =>
              city.player() === rival &&
              // A razed city keeps its player, and the registry keeps it.
              !city.destroyed() &&
              landmasses.some((landmass: Set<Tile>): boolean =>
                landmass.has(city.tile())
              )
          ),
    distance = (city: City): number =>
      Math.min(
        ...cities.map((own: City): number =>
          own.tile().distanceFrom(city.tile())
        )
      ) + (hasWalls(dependencies, city) ? WALLS_DISTANCE : 0),
    previous = known?.target ?? null,
    target = candidates.includes(previous!)
      ? previous
      : [...candidates].sort((a, b) => distance(a) - distance(b))[0] ?? null;

  targets.set(player, { turn, target });

  return target;
};

const musters = new WeakMap<
  Player,
  { turn: number; target: City; since: number; go: boolean }
>();

export const civ1ConquestPolicy: ConquestPolicy = {
  weight: (dependencies, victoryDependencies, player) =>
    weightOf(dependencies, player),

  // The next better attacker, once it's the next advance away.
  advances: (dependencies, victoryDependencies, player) => {
    const next = attackerAdvances.find(
      (AdvanceType: typeof Advance): boolean =>
        !knows(dependencies, player, AdvanceType)
    );

    return next !== undefined &&
      directPrerequisites(
        next,
        victoryDependencies.advanceRegistry,
        dependencies.ruleRegistry
      ).every((Prerequisite: typeof Advance): boolean =>
        knows(dependencies, player, Prerequisite)
      )
      ? [next]
      : [];
  },

  target: (dependencies, victoryDependencies, player) =>
    targetOf(dependencies, player),

  musterCity: (dependencies, victoryDependencies, player, target) => {
    const landmass = continentOf(dependencies.turn.value(), target.tile());

    return (
      dependencies.cityRegistry
        .getByPlayer(player)
        .filter((city: City): boolean => landmass.has(city.tile()))
        .sort(
          (a: City, b: City): number =>
            a.tile().distanceFrom(target.tile()) -
            b.tile().distanceFrom(target.tile())
        )[0] ?? null
    );
  },

  marchTurns: MARCH_TURNS,

  isAttacker: (dependencies, unit) => isAttacker(unit),

  // From one of the player's cities that keeps the defenders it wants without it, and isn't using it for martial law.
  mayLeave: (dependencies, knowledge, unit) => {
    const city = dependencies.cityRegistry.getByTile(unit.tile());

    return (
      city !== null &&
      city.player() === unit.player() &&
      defendersIn(dependencies, city).length - 1 >=
        defendersKept(dependencies, knowledge, city) &&
      !keepsOrder(dependencies, knowledge, city, unit)
    );
  },

  // Decided once a turn, so that the first to leave doesn't keep the rest waiting.
  mustered: (dependencies, victoryDependencies, player, target, muster) => {
    const turn = dependencies.turn.value(),
      known = musters.get(player);

    if (known && known.turn === turn && known.target === target) {
      return known.go;
    }

    const since = known && known.target === target ? known.since : turn,
      // Not those fortified there as the city's garrison: they stay.
      attackers = dependencies.unitRegistry
        .getByTile(muster.tile())
        .filter(
          (unit: Unit): boolean =>
            unit.player() === player && isAttacker(unit) && unit.busy() === null
        ),
      { attack } = militaryStrength(attackers, dependencies.ruleRegistry),
      { defence } = militaryStrength(
        dependencies.unitRegistry.getByTile(target.tile()),
        dependencies.ruleRegistry
      ),
      go =
        attackers.length >= MUSTER_ATTACKERS &&
        (attack >=
          MUSTER_ADVANTAGE *
            defence *
            (hasWalls(dependencies, target) ? WALLS_DEFENCE : 1) ||
          turn - since >= MUSTER_WAIT);

    musters.set(player, { turn, target, since: go ? turn : since, go });

    return go;
  },
};

export default civ1ConquestPolicy;

// While a campaign is on, twice the attackers.
export const conquestProductionPolicy: ProductionPolicy = {
  ...defaultProductionPolicy,
  attackersPerCity: defaultProductionPolicy.attackersPerCity * 2,
};
