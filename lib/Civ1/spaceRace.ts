// Civ1: the numbers behind a computer player's space race (civ-clone/web-renderer#376), for `base-strategy-victory`'s
//  generic strategies.
//
// When to launch is v474.05's (OpenCivOne `CityWorker.cs` ~L1037-1095), checked as each part is added there and at the
//  end of each turn here. A ship with less than a 40% chance of success never launches. Otherwise it does once nothing
//  more can be added, once it's better than 75%, once a rival ranks higher, or once a rival has launched and this ship
//  would arrive no later; while no rival knows Space Flight it never does, and keeps growing. v474.05 compares only
//  with the human; here every rival counts, as any of them can be a person or a computer.
//
// On top, ours: a ship whose modules and components are all on launches, and so does one that would otherwise arrive
//  within `LATE_LAUNCH_YEARS` of the final year, which v474.05 doesn't need while the human is the only one to wait for.
//
// What to build is ours: v474.05 lists the parts in each city's production menu, but how its AI weighs them isn't
//  decoded. A ship here grows in balanced steps, each a Habitation, a Life Support and a Power module (the energy one
//  Habitation and one Life Support need) and two each of Fuel and Propulsion, with Structurals whenever a part isn't
//  yet joined to the frame. The first step is a ship good for about 20 years with a chance of 100%.
import { ApolloProgram } from '@civ-clone/civ1-wonder/Wonders';
import {
  Computers,
  Plastics,
  Robotics,
  SpaceFlight,
} from '@civ-clone/civ1-science/Advances';
import {
  Fuel,
  Habitation,
  LifeSupport,
  Power,
  Propulsion,
  Structural,
} from '@civ-clone/civ1-spaceship/Parts';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import { Production as CityProduction } from '@civ-clone/library-city/Yields';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Part from '@civ-clone/core-spaceship/Part';
import Player from '@civ-clone/core-player/Player';
import { SpaceRacePolicy } from '@civ-clone/base-strategy-victory/lib/Space/SpaceRacePolicy';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import VictoryDependencies from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import Wonder from '@civ-clone/core-wonder/Wonder';
import { rankings } from '@civ-clone/core-power/lib/rank';
import { endYear } from '@civ-clone/civ1-game-end/lib/scoring';
import { levelOf } from '@civ-clone/civ1-difficulty/level';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// v474.05's launch thresholds.
export const MINIMUM_LAUNCH_CHANCE = 0.4;
export const SURE_LAUNCH_CHANCE = 0.75;

// Ours: a ship that would otherwise arrive within this many years of the final year launches now, rather than wait for
//  a rival who may never learn Space Flight and finish the game without one.
export const LATE_LAUNCH_YEARS = 10;

// The most each module and component the Default layout takes: 4 of each module, 8 of each component.
export const MAXIMUM_STEPS = 4;

// One step of the ship: how many of each part it has, as the step's multiple.
const step: [typeof Part, number][] = [
  [Habitation, 1],
  [LifeSupport, 1],
  [Power, 1],
  [Fuel, 2],
  [Propulsion, 2],
];

const knows = (
  dependencies: Dependencies,
  player: Player,
  AdvanceType: typeof Advance
): boolean =>
  dependencies.playerResearchRegistry
    .getByPlayer(player)
    .completed(AdvanceType);

const productionOf = (city: City): number =>
  reduceYield(city.yields(), CityProduction);

// The player's cities by their shields, most first: worked out once a turn, as it asks every city for its yields.
const ranked = new WeakMap<Player, { turn: number; cities: City[] }>();

const citiesByProduction = (
  dependencies: Dependencies,
  player: Player
): City[] => {
  const turn = dependencies.turn.value(),
    cached = ranked.get(player);

  if (cached && cached.turn === turn) {
    return cached.cities;
  }

  const cities = dependencies.cityRegistry
    .getByPlayer(player)
    .map((city: City) => ({ city, production: productionOf(city) }))
    .sort((a, b) => b.production - a.production)
    .map(({ city }) => city);

  ranked.set(player, { turn, cities });

  return cities;
};

const partsOf = (spaceship: Spaceship): Part[] => [
  ...spaceship.activeParts(),
  ...spaceship.inactiveParts(),
];

const countOf = (
  PartType: typeof Part,
  parts: Part[],
  building: (typeof Part)[]
): number =>
  parts.filter((part: Part): boolean => part instanceof PartType).length +
  building.filter((Building: typeof Part): boolean => Building === PartType)
    .length;

// The module or component the ship wants next, in its balanced steps: `null` once it has every step.
export const wantedModule = (
  spaceship: Spaceship,
  building: (typeof Part)[]
): typeof Part | null => {
  const parts = partsOf(spaceship);

  for (let level = 1; level <= MAXIMUM_STEPS; level++) {
    const [wanted] = step.find(
      ([PartType, multiple]) =>
        countOf(PartType, parts, building) < multiple * level
    ) ?? [null];

    if (wanted !== null) {
      return wanted;
    }
  }

  return null;
};

// The part the ship wants next, of any, ignoring what can be built: a Structural to start the frame, or one for each
//  part not yet joined to it, before more modules and components; `null` once it has every step.
export const wantedPart = (
  spaceship: Spaceship,
  building: (typeof Part)[]
): typeof Part | null => {
  const structuralsBuilding = countOf(Structural, [], building);

  if (
    (partsOf(spaceship).length === 0 && structuralsBuilding === 0) ||
    spaceship.inactiveParts().length > structuralsBuilding
  ) {
    return Structural;
  }

  return wantedModule(spaceship, building);
};

// When the ship would arrive, as a year: `now` for one still to launch.
const arrival = (
  victoryDependencies: VictoryDependencies,
  spaceship: Spaceship
): number => {
  const launched = spaceship.launched();

  return (
    (launched === false
      ? victoryDependencies.year.value()
      : victoryDependencies.year.value(launched)) + spaceship.flightTime()
  );
};

export const civ1SpaceRacePolicy: SpaceRacePolicy = {
  // Once a player knows Computers (Space Flight's prerequisite with Rocketry), or has a ship with parts on it, it plays
  //  for space. Every leader does: v474.05's computer players all build parts.
  weight: (dependencies, victoryDependencies, player) =>
    knows(dependencies, player, Computers) ||
    partsOf(
      victoryDependencies.spaceshipRegistry.getActiveByPlayer(player) ??
        ({
          activeParts: () => [],
          inactiveParts: () => [],
        } as unknown as Spaceship)
    ).length > 0
      ? 1
      : 0,

  // Structurals need Space Flight, Fuel and Propulsion Plastics, the modules Robotics.
  advances: () => [SpaceFlight, Plastics, Robotics],

  enablers: [ApolloProgram],

  // The player's most productive city that isn't already building a Wonder.
  enablerCity: (dependencies, victoryDependencies, player) =>
    citiesByProduction(dependencies, player).find(
      (city: City): boolean =>
        !(
          dependencies.cityBuildRegistry.getByCity(city).building()?.item()
            .prototype instanceof Wonder
        )
    ) ?? null,

  // The most productive third of the player's cities (at least one), each making at least 5 shields: parts cost 80 to
  //  320, too much for a small city.
  buildsParts: (dependencies, victoryDependencies, city) => {
    const cities = citiesByProduction(dependencies, city.player()),
      index = cities.indexOf(city);

    return (
      index !== -1 &&
      index < Math.max(1, Math.ceil(cities.length / 3)) &&
      productionOf(city) >= 5
    );
  },

  nextPart: (
    dependencies,
    victoryDependencies,
    spaceship,
    available,
    building
  ) => {
    const wanted = wantedPart(spaceship, building);

    return wanted !== null && available.includes(wanted) ? wanted : null;
  },

  shouldLaunch: (dependencies, victoryDependencies, spaceship) => {
    const chance = spaceship.chanceOfSuccess();

    if (chance < MINIMUM_LAUNCH_CHANCE) {
      return false;
    }

    // Every module and component is on: there's nothing more to wait for. Structurals still wanted are ones whose
    //  parts couldn't be joined to the frame.
    if (wantedModule(spaceship, []) === null) {
      return true;
    }

    if (
      arrival(victoryDependencies, spaceship) + LATE_LAUNCH_YEARS >=
      endYear(levelOf(victoryDependencies.difficulty))
    ) {
      return true;
    }

    const player = spaceship.player(),
      rivals = victoryDependencies.playerRegistry
        .entries()
        .filter((other: Player): boolean => other !== player);

    if (!rivals.some((rival) => knows(dependencies, rival, SpaceFlight))) {
      return false;
    }

    if (chance > SURE_LAUNCH_CHANCE) {
      return true;
    }

    const [leader] = rankings(
      victoryDependencies.playerRegistry.entries(),
      dependencies.ruleRegistry
    );

    if (leader !== player) {
      return true;
    }

    const ours = arrival(victoryDependencies, spaceship);

    return rivals.some((rival: Player): boolean => {
      const theirs = victoryDependencies.spaceshipRegistry
        .getBy('player', rival)
        .find(
          (other: Spaceship): boolean =>
            other.launched() !== false && other.successful() === null
        );

      return (
        theirs !== undefined && ours <= arrival(victoryDependencies, theirs)
      );
    });
  },
};

// A capital whose player has a ship in flight keeps one more defender: losing it loses the ship (#177).
export const withSpaceshipDefence = (
  knowledge: Knowledge,
  victoryDependencies: VictoryDependencies,
  isCapital: (dependencies: Dependencies, city: City) => boolean
): Knowledge => {
  const extra = (dependencies: Dependencies, city: City): number => {
    const spaceship = victoryDependencies.spaceshipRegistry.getActiveByPlayer(
      city.player()
    );

    return spaceship !== null &&
      spaceship.launched() !== false &&
      isCapital(dependencies, city)
      ? 1
      : 0;
  };

  return {
    ...knowledge,
    defendersWanted: (dependencies, city) =>
      knowledge.defendersWanted(dependencies, city) + extra(dependencies, city),
    defendersKept: (dependencies, city) =>
      knowledge.defendersKept(dependencies, city) + extra(dependencies, city),
  };
};

export default civ1SpaceRacePolicy;
