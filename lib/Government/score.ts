// Generic: what a government would be worth to a player, from what it does as the rule set numbers it
//  (base-government-terms' `GovernmentTerms`), after the original Civilization II AI's government score (OpenCiv2
//  `game/bigframes.cpp` `ai_choose_government`, the city terms of `city.cpp` 2911–4553 and 3523–3594): for each of the
//  player's cities,
//  - the trade its worked squares gain (the trade bonus) or lose (the tile penalty);
//  - the shields its units cost beyond those supported for free;
//  - the citizens its aggressive units make unhappy (war weariness), weighed by the leader's tolerance;
//  - the unhappy citizens its units keep content (martial law), or all of them (a government with no unhappiness);
//  - the trade lost to corruption;
//  - the research lost (Fundamentalism's), weighed by how much the leader cares for science.
// Each term is in trade: a citizen counts `CITIZEN`, a shield `SHIELD` and a point of food `FOOD`. The leader's `ScienceBias` (civilize in
//  Civ2) scales the research lost by (bias + 3) / 4, as the original's `(civilize + 3) × science / 4`, so a militaristic
//  leader minds half as much: Fundamentalism mostly wins for them, and where luxuries and content outweigh science.
import {
  CityImprovementContent,
  Food,
  PopulationUnhappiness,
  Production,
  Trade,
} from '@civ-clone/library-city/Yields';
import {
  Terms,
  governmentTerms,
} from '@civ-clone/base-government-terms/lib/terms';
import { isA } from '@civ-clone/core-unit/traits';
import { Air } from '@civ-clone/library-unit/Types';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import MilitaryUnhappinessTolerance from '@civ-clone/base-leader-personality/Rules/Player/MilitaryUnhappinessTolerance';
import NonCombatant from '@civ-clone/base-unit-trait-non-combatant/NonCombatant';
import Player from '@civ-clone/core-player/Player';
import Research from '@civ-clone/base-trade-rate-research/Research';
import ScienceBias from '@civ-clone/base-leader-personality/Rules/Player/ScienceBias';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import Yield from '@civ-clone/core-yield/Yield';
import { governmentOf } from './terms';
import { isCapital } from '../Civ1/defence';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { sum } from '@civ-clone/base-leader-personality/lib/combine';

// What a citizen and a shield are worth, in trade: a citizen made an Entertainer gives 2 luxuries.
export const CITIZEN = 2;
export const SHIELD = 1;
export const FOOD = 1;
// How far a city with no capital to measure from counts, for corruption.
const NO_CAPITAL = 32;

// What a city has, read once for every government it's scored for.
type CityFacts = {
  // The yields of each square it works, as its own rules give them now.
  squares: { food: number; shields: number; trade: number }[];
  trade: number;
  supported: number;
  aggressive: number;
  inCity: number;
  unhappy: number;
  distance: number;
  size: number;
};

const factsOf = (
  dependencies: Dependencies,
  city: City,
  capital: City | null
): CityFacts => {
  const rules = city.tileYieldRules(),
    squares = dependencies.workedTileRegistry
      .getByCity(city)
      .map((workedTile: WorkedTile) => {
        const tileYields = city.tileYields(workedTile.tile(), rules);

        return {
          food: reduceYield(tileYields, Food),
          shields: reduceYield(tileYields, Production),
          trade: reduceYield(tileYields, Trade),
        };
      }),
    units = dependencies.unitRegistry.getByCity(city),
    size = dependencies.cityGrowthRegistry.getByCity(city).size(),
    // The citizens born unhappy that the city's improvements leave unhappy, by its own rules: what a government's
    //  martial law, or one with no unhappiness at all, would otherwise have to calm, or luxuries.
    cityYields = city.yields(),
    tile: Tile = city.tile();

  return {
    squares,
    trade: squares.reduce((total, square) => total + square.trade, 0),
    supported: units.filter(
      (unit: Unit): boolean => !unit.hasTrait(NonCombatant)
    ).length,
    aggressive: units.filter(
      (unit: Unit): boolean =>
        unit.attack().value() > 0 &&
        !unit.hasTrait(NonCombatant) &&
        (isA(unit, Air) || unit.tile() !== tile)
    ).length,
    inCity: dependencies.unitRegistry
      .getByTile(tile)
      .filter(
        (unit: Unit): boolean =>
          unit.player() === city.player() && unit.attack().value() > 0
      ).length,
    unhappy: Math.max(
      0,
      reduceYield(cityYields, PopulationUnhappiness) +
        reduceYield(
          cityYields,
          CityImprovementContent as unknown as typeof Yield
        )
    ),
    distance: capital === null ? NO_CAPITAL : capital.tile().distanceFrom(tile),
    size,
  };
};

// The trade a square gains or loses under `terms`, from what it gives now under `current`'s terms: a tile penalty
//  taken off a yield over its threshold, so a yield the current one has already taken from counts at the threshold.
const squareTrade = (
  square: CityFacts['squares'][number],
  terms: Partial<Terms>,
  current: Partial<Terms> | null
): number => {
  const penalty = terms.tilePenalty ?? null,
    currentPenalty = current?.tilePenalty ?? null,
    bonus = terms.tradeBonus ?? 0,
    currentBonus = current?.tradeBonus ?? 0,
    // Each yield as it would be with no penalty: one the current government took from is back over its threshold.
    raw = (value: number): number =>
      currentPenalty !== null && value === currentPenalty.threshold
        ? value + currentPenalty.amount
        : value,
    penalised = (value: number): number =>
      penalty !== null && raw(value) > penalty.threshold ? penalty.amount : 0,
    trade = raw(square.trade) - (square.trade > 0 ? currentBonus : 0);

  return (
    (trade > 0 ? bonus : 0) -
    penalised(square.trade) -
    SHIELD * penalised(square.shields) -
    FOOD * penalised(square.food)
  );
};

/**
 * What `GovernmentType` would be worth to `player`, by its terms, or `null` where the rule set gives none. Only a
 *  comparison between governments means anything.
 */
export const governmentScore = (
  dependencies: Dependencies,
  player: Player,
  GovernmentType: typeof Government,
  facts: CityFacts[] = cityFactsOf(dependencies, player)
): number | null => {
  const terms = governmentTerms(dependencies.ruleRegistry, GovernmentType);

  if (terms === null) {
    return null;
  }

  const CurrentType = governmentOf(dependencies, player),
    current =
      CurrentType === null
        ? null
        : governmentTerms(dependencies.ruleRegistry, CurrentType),
    tolerance = sum(
      dependencies.ruleRegistry,
      MilitaryUnhappinessTolerance,
      player
    ),
    scienceBias = sum(dependencies.ruleRegistry, ScienceBias, player),
    research = researchShare(dependencies, player),
    free = terms.freeUnits ?? ((): number => 0),
    cost = terms.unitSupportCost ?? 1,
    martialLaw = terms.martialLaw ?? { maximumUnits: 0, perUnit: 1 },
    war = terms.militaryUnhappiness ?? { perUnit: 0, free: 0 },
    corruption = terms.corruption ?? { perDistance: 0, fixedDistance: null },
    science = terms.science ?? 1;

  return facts.reduce((total: number, city: CityFacts): number => {
    const squares = city.squares.reduce(
        (gain, square) => gain + squareTrade(square, terms, current),
        0
      ),
      support = SHIELD * cost * Math.max(0, city.supported - free(city.size)),
      weariness =
        CITIZEN *
        ((7 - tolerance) / 7) *
        war.perUnit *
        Math.max(0, city.aggressive - war.free),
      calmed = terms.noUnhappiness
        ? city.unhappy
        : Math.min(
            city.unhappy,
            Math.min(city.inCity, martialLaw.maximumUnits) * martialLaw.perUnit
          ),
      corrupt =
        city.trade *
        Math.min(
          1,
          corruption.perDistance * (corruption.fixedDistance ?? city.distance)
        ),
      scienceLost =
        ((scienceBias + 3) / 4) * (1 - science) * research * city.trade;

    return (
      total +
      squares -
      support -
      (terms.noUnhappiness ? 0 : weariness) +
      CITIZEN * calmed -
      corrupt -
      scienceLost
    );
  }, 0);
};

// The share of trade the player puts into research (a rate is a percentage), or a half where it has no rates.
const researchShare = (dependencies: Dependencies, player: Player): number => {
  try {
    return (
      (dependencies.playerTradeRatesRegistry
        .getByPlayer(player)
        .get(Research)
        ?.value() ?? 50) / 100
    );
  } catch (e) {
    return 0.5;
  }
};

/** What each of `player`'s cities has, for `governmentScore`. */
export const cityFactsOf = (
  dependencies: Dependencies,
  player: Player
): CityFacts[] => {
  const cities = dependencies.cityRegistry.getByPlayer(player),
    capital =
      cities.find((city: City): boolean => isCapital(dependencies, city)) ??
      null;

  return cities.map((city: City) => factsOf(dependencies, city, capital));
};

/**
 * Whether the rule set numbers every one of `available` (so the scores can be compared), and so the player chooses by
 *  them. Civ1's numbers none.
 */
export const scoresGovernments = (
  dependencies: Dependencies,
  available: (typeof Government)[]
): boolean =>
  available.length > 0 &&
  available.every(
    (GovernmentType: typeof Government): boolean =>
      governmentTerms(dependencies.ruleRegistry, GovernmentType) !== null
  );

// A revolution costs one to a few turns of Anarchy, about two and a half turns of the cities' trade, which a better
//  government kept for the policy's 40 turns between revolutions pays back at a sixteenth of that trade a turn.
export const REVOLUTION_PAYBACK = 16;

/**
 * The government of `available` worth most to `player` (`governmentScore`), a later one winning a tie, as the
 *  original's does. The one it has keeps it unless another is worth more by a sixteenth of its cities' trade
 *  (`REVOLUTION_PAYBACK`).
 */
export const bestGovernment = (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
): typeof Government | null => {
  const facts = cityFactsOf(dependencies, player),
    margin =
      facts.reduce((total, city) => total + city.trade, 0) / REVOLUTION_PAYBACK,
    CurrentType = governmentOf(dependencies, player),
    scored = available.map((GovernmentType: typeof Government) => ({
      GovernmentType,
      score:
        (governmentScore(dependencies, player, GovernmentType, facts) ??
          -Infinity) - (GovernmentType === CurrentType ? 0 : margin),
    }));

  return (
    scored.reduce(
      (best, entry) =>
        best === null || entry.score >= best.score ? entry : best,
      null as { GovernmentType: typeof Government; score: number } | null
    )?.GovernmentType ?? null
  );
};

// The original scores its governments every eighth turn (`ai.cpp:1559`); so does this, unless the governments the player
//  may choose have changed since.
export const SCORE_TURNS = 8;

const chosen = new WeakMap<
  Player,
  { turn: number; available: string; best: typeof Government | null }
>();

/** `bestGovernment`, worked out again only every `SCORE_TURNS` turns or when `available` changes. */
export const bestGovernmentLately = (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
): typeof Government | null => {
  const turn = dependencies.turn.value(),
    key = available.map((GovernmentType) => GovernmentType.name).join(),
    known = chosen.get(player);

  if (known && known.available === key && turn - known.turn < SCORE_TURNS) {
    return known.best;
  }

  const best = bestGovernment(dependencies, player, available);

  chosen.set(player, { turn, available: key, best });

  return best;
};

export default governmentScore;
