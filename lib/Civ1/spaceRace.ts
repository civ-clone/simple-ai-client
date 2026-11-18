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
//
// The policy plays only where the game's spaceship layout is the one its steps were planned for, Civ1's Default
//  (`civ1-default-spaceship-layout`, registered in the game's `LayoutRegistry`): a rule set with a ship of its own
//  (Civilization II's) has a policy of its own, even if its parts are the same classes. What the ship needs comes from
//  the rule set: what every part requires anyone to have built (the Apollo Program) and the advances each part
//  requires, from the game's `requirements` (civ-clone/web-renderer#37), in `spaceRaceData`. The final year is Civ1's
//  unless the policy is made with another (`createCiv1SpaceRacePolicy`).
//
// A rule set whose own computer players build and launch their ships their own way (Civilization II's) says so with
//  base-spaceship's `ComputerSpaceshipPart` and `ComputerLaunch` rules (`rulesPlaySpaceRace`). There the policy plays
//  too, on that rule set's terms: the same Apollo Program and advances from its requirements, the part and the launch
//  as its rules answer (nothing, where they give no answer), and it plays for space once its player could research the
//  first part's advance, rather than once it knows Civ1's Computers.
import { Computers, SpaceFlight } from '@civ-clone/civ1-science/Advances';
import {
  LayoutRegistry,
  instance as layoutRegistryInstance,
} from '@civ-clone/core-spaceship/LayoutRegistry';
import {
  RequirementRegistry,
  instance as requirementRegistryInstance,
} from '@civ-clone/core-requirement/RequirementRegistry';
import {
  Fuel,
  Habitation,
  LifeSupport,
  Power,
  Propulsion,
  Structural,
} from '@civ-clone/civ1-spaceship/Parts';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Advance from '@civ-clone/core-science/Advance';
import ComputerLaunch from '@civ-clone/base-spaceship/lib/Rules/ComputerLaunch';
import ComputerSpaceshipPart from '@civ-clone/base-spaceship/lib/Rules/ComputerSpaceshipPart';
import City from '@civ-clone/core-city/City';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import { Production as CityProduction } from '@civ-clone/library-city/Yields';
import Default from '@civ-clone/civ1-default-spaceship-layout/Default';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Part from '@civ-clone/core-spaceship/Part';
import Player from '@civ-clone/core-player/Player';
import Requirement from '@civ-clone/core-requirement/Requirement';
import { SpaceRacePolicy } from '@civ-clone/base-strategy-victory/lib/Space/SpaceRacePolicy';
import Slot from '@civ-clone/core-spaceship/Slot';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import VictoryDependencies from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import Wonder from '@civ-clone/core-wonder/Wonder';
import { rankings } from '@civ-clone/core-power/lib/rank';
import { endYear } from '@civ-clone/civ1-game-end/lib/scoring';
import { levelOf } from '@civ-clone/civ1-difficulty/level';
import civ1Knowledge from './knowledge';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { wantsDefender } from '../City/defence';

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

// The parts this policy builds: the steps' modules and components, and the Structurals that join them.
const builds: (typeof Part)[] = [
  Structural,
  ...step.map(([PartType]): typeof Part => PartType),
];

export type SpaceRaceData = {
  // What every part requires anyone to have built first: what gives a player a ship.
  enablers: IBuildable[];
  // The advances the parts require, in the order the rule set lists them.
  advances: (typeof Advance)[];
};

const isA = (Type: unknown, Base: unknown): boolean =>
  typeof Type === 'function' &&
  (Type === Base ||
    Object.prototype.isPrototypeOf.call(
      (Base as { prototype: object }).prototype,
      (Type as { prototype: object }).prototype
    ));

// Whether the game's ships are built on the layout this policy's steps were planned for (or one made from it).
export const buildsOnDefaultLayout = (
  layoutRegistry: LayoutRegistry
): boolean =>
  layoutRegistry
    .entries()
    .some((LayoutType: unknown): boolean => isA(LayoutType, Default));

// Whether the rule set says how its own computer players choose their ships' parts (base-spaceship's
//  `ComputerSpaceshipPart`): the policy then plays the space race on its terms, whatever its layout.
export const rulesPlaySpaceRace = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): boolean => ruleRegistry.get(ComputerSpaceshipPart).length > 0;

// What the rule set's `requirements` say the ship needs: `null` unless every part this policy builds requires an
//  advance and every part requires something built by anyone (`range: 'world'`).
const requiredForSpace = (
  requirementRegistry: RequirementRegistry
): SpaceRaceData | null => {
  const entries = requirementRegistry
      .entries()
      .filter(
        (entry: Requirement): boolean =>
          entry.relation === 'requires' && isA(entry.subject, Part)
      ),
    enablers = entries
      .filter(
        (entry: Requirement): boolean =>
          entry.subject === Part && entry.range === 'world'
      )
      .flatMap((entry: Requirement) => entry.targets)
      .filter(
        (target: unknown): boolean =>
          typeof target === 'function' && !isA(target, Advance)
      ) as unknown as IBuildable[],
    advancesOf = (entry: Requirement): (typeof Advance)[] =>
      entry.targets.filter((target: unknown): boolean =>
        isA(target, Advance)
      ) as (typeof Advance)[],
    advances = entries
      .filter((entry: Requirement): boolean =>
        builds.includes(entry.subject as typeof Part)
      )
      .flatMap(advancesOf)
      .filter(
        (AdvanceType: typeof Advance, index: number, all): boolean =>
          all.indexOf(AdvanceType) === index
      ),
    complete =
      enablers.length > 0 &&
      builds.every((PartType: typeof Part): boolean =>
        entries.some(
          (entry: Requirement): boolean =>
            entry.subject === PartType && advancesOf(entry).length > 0
        )
      );

  return complete ? { enablers, advances } : null;
};

/**
 * What the rule set says the ship needs, from its `requirements`, when this policy plays the space race: `null` unless
 * the game's layout is Civ1's (`buildsOnDefaultLayout`) or the rule set has its computer players' own rules
 * (`rulesPlaySpaceRace`), every part this policy builds requires an advance and every part requires something built by
 * anyone (`range: 'world'`). Read afresh each time: the entries are a few hundred, and a replaced entry changes no
 * count.
 */
export const spaceRaceData = (
  requirementRegistry: RequirementRegistry,
  layoutRegistry: LayoutRegistry = layoutRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): SpaceRaceData | null =>
  buildsOnDefaultLayout(layoutRegistry) || rulesPlaySpaceRace(ruleRegistry)
    ? requiredForSpace(requirementRegistry)
    : null;

// Whether Civ1's own space race is played in the game whose `requirements` and layouts these are: only on Civ1's layout.
//  Elsewhere no Civ1 step builds a part or launches: production's fallback never ranks a part, and a rule set with its
//  computer players' own rules (`rulesPlaySpaceRace`) builds and launches as they say, through the policy alone.
export const playsSpaceRace = (
  requirementRegistry: RequirementRegistry,
  layoutRegistry: LayoutRegistry = layoutRegistryInstance
): boolean =>
  buildsOnDefaultLayout(layoutRegistry) &&
  requiredForSpace(requirementRegistry) !== null;

// The year the game ends in, at the game's level: Civ1's unless the policy is made with another.
export type FinalYear = (victoryDependencies: VictoryDependencies) => number;

export const civ1FinalYear: FinalYear = (victoryDependencies) =>
  endYear(levelOf(victoryDependencies.difficulty));

// A Structural to ask the layout about: only its type matters.
const structuralProbe = Object.create(Structural.prototype) as Part;

// The part the ship wants next, of any, ignoring what can be built: a Structural to start the frame, or one for each
//  part waiting to be joined to it while the frame has room, before more modules and components; `null` once it has
//  every step. A Propulsion waits for a Fuel next to it, not for the frame, so it isn't counted.
export const wantedPart = (
  spaceship: Spaceship,
  building: (typeof Part)[]
): typeof Part | null => {
  const structuralsBuilding = countOf(Structural, [], building),
    unjoined = spaceship
      .inactiveParts()
      .filter((part: Part): boolean => !(part instanceof Propulsion)).length,
    room = spaceship
      .layout()
      .slots()
      .filter(
        (slot: Slot): boolean => slot.empty() && slot.accepts(structuralProbe)
      ).length;

  if (
    room > structuralsBuilding &&
    ((partsOf(spaceship).length === 0 && structuralsBuilding === 0) ||
      unjoined > structuralsBuilding)
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

// Whether `player` could research `AdvanceType` now, or knows it: worked out once a turn, as `available` asks every
//  advance's requirements.
const reached = new WeakMap<
  Player,
  { turn: number; advance: unknown; known: boolean }
>();

const reaches = (
  dependencies: Dependencies,
  player: Player,
  AdvanceType: typeof Advance
): boolean => {
  const turn = dependencies.turn.value(),
    cached = reached.get(player);

  if (cached && cached.turn === turn && cached.advance === AdvanceType) {
    return cached.known;
  }

  const playerResearch =
      dependencies.playerResearchRegistry.getByPlayer(player),
    known =
      playerResearch.completed(AdvanceType) ||
      playerResearch.available().includes(AdvanceType);

  reached.set(player, { turn, advance: AdvanceType, known });

  return known;
};

const emptyShip = {
  activeParts: () => [],
  inactiveParts: () => [],
} as unknown as Spaceship;

/**
 * Civ1's space race, with what the ship needs from `requirementRegistry`, the layouts from `layoutRegistry` (the
 * game's) and the final year from `finalYear`. Where the game's ship isn't Civ1's and the rule set has no computer
 * players' rules of its own (`spaceRaceData` is `null`), it never plays for space: it wants no advance and no enabler,
 * and never launches, as it has no ship. Where the rule set has them (`rulesPlaySpaceRace`, read from `ruleRegistry`
 * for the enablers and from the game's rules otherwise), the part and the launch are theirs.
 */
export const createCiv1SpaceRacePolicy = (
  requirementRegistry: RequirementRegistry = requirementRegistryInstance,
  finalYear: FinalYear = civ1FinalYear,
  layoutRegistry: LayoutRegistry = layoutRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): SpaceRacePolicy => ({
  // On Civ1's layout, once a player knows Computers (Space Flight's prerequisite with Rocketry), or has a ship with
  //  parts on it, it plays for space. Every leader does: v474.05's computer players all build parts. On a rule set's
  //  own terms, once it could research the first part's advance (Civilization II's Space Flight), or has parts.
  weight: (dependencies, victoryDependencies, player) => {
    const data = spaceRaceData(
      dependencies.requirementRegistry,
      layoutRegistry,
      dependencies.ruleRegistry
    );

    if (data === null) {
      return 0;
    }

    if (
      partsOf(
        victoryDependencies.spaceshipRegistry.getActiveByPlayer(player) ??
          emptyShip
      ).length > 0
    ) {
      return 1;
    }

    if (buildsOnDefaultLayout(layoutRegistry)) {
      return knows(dependencies, player, Computers) ? 1 : 0;
    }

    const [First] = data.advances;

    return First !== undefined && reaches(dependencies, player, First) ? 1 : 0;
  },

  // What the parts require: in Civ1, Structurals Space Flight, Fuel and Propulsion Plastics, the modules Robotics.
  advances: (dependencies) =>
    spaceRaceData(
      dependencies.requirementRegistry,
      layoutRegistry,
      dependencies.ruleRegistry
    )?.advances ?? [],

  // What every part requires built first: in Civ1, the Apollo Program.
  get enablers(): IBuildable[] {
    return (
      spaceRaceData(requirementRegistry, layoutRegistry, ruleRegistry)
        ?.enablers ?? []
    );
  },

  // The player's most productive city that isn't already building a Wonder, and has the defenders it wants first.
  enablerCity: (dependencies, victoryDependencies, player) =>
    citiesByProduction(dependencies, player).find(
      (city: City): boolean =>
        !wantsDefender(dependencies, civ1Knowledge, city) &&
        !(
          dependencies.cityBuildRegistry.getByCity(city).building()?.item()
            .prototype instanceof Wonder
        )
    ) ?? null,

  // The most productive third of the player's cities (at least one), each making at least 5 shields: parts cost 80 to
  //  320, too much for a small city. A city still wanting defenders builds those first.
  buildsParts: (dependencies, victoryDependencies, city) => {
    const cities = citiesByProduction(dependencies, city.player()),
      index = cities.indexOf(city);

    return (
      index !== -1 &&
      index < Math.max(1, Math.ceil(cities.length / 3)) &&
      productionOf(city) >= 5 &&
      !wantsDefender(dependencies, civ1Knowledge, city)
    );
  },

  nextPart: (
    dependencies,
    victoryDependencies,
    spaceship,
    available,
    building
  ) => {
    // The rule set's own computer players' choice, where it has one (Civilization II's): its first answer, nothing
    //  without one.
    if (!buildsOnDefaultLayout(layoutRegistry)) {
      const [ruled] = dependencies.ruleRegistry.process(
        ComputerSpaceshipPart,
        spaceship,
        available,
        building
      );

      return ruled ?? null;
    }

    const wanted = wantedPart(spaceship, building);

    return wanted !== null && available.includes(wanted) ? wanted : null;
  },

  shouldLaunch: (dependencies, victoryDependencies, spaceship) => {
    // The rule set's own computer players' decision, where it has one (Civilization II's): its first answer, no launch
    //  without one.
    if (
      !buildsOnDefaultLayout(layoutRegistry) &&
      rulesPlaySpaceRace(dependencies.ruleRegistry)
    ) {
      const [ruled] = dependencies.ruleRegistry.process(
        ComputerLaunch,
        spaceship
      );

      return ruled === true;
    }

    // Another rule set's ship (one handed out by its own rules) is never launched on Civ1's terms.
    if (!playsSpaceRace(dependencies.requirementRegistry, layoutRegistry)) {
      return false;
    }

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
      finalYear(victoryDependencies)
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
});

export const civ1SpaceRacePolicy: SpaceRacePolicy = createCiv1SpaceRacePolicy();

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

// Whether `player` plays for space and still lacks an advance the ship needs: its science mustn't stop yet, even once
//  it has everything its leader wants (it might have been given Robotics before Space Flight).
export const spaceAdvancesWanted = (
  dependencies: Dependencies,
  victoryDependencies: VictoryDependencies,
  player: Player
): boolean =>
  civ1SpaceRacePolicy.weight(dependencies, victoryDependencies, player) > 0 &&
  civ1SpaceRacePolicy
    .advances(dependencies, victoryDependencies, player)
    .some(
      (AdvanceType: typeof Advance): boolean =>
        !knows(dependencies, player, AdvanceType)
    );
