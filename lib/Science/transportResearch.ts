// Generic: the advance to research next on the way to a ship that carries land units (civ-clone/web-renderer#632), for
//  a player bound to its land (`lib/Player/islandBound`). It reads the ruleset's requirements (#37) rather than naming
//  any advance or unit: in Civ1 it comes out as Map Making for the Trireme, by way of Alphabet.
import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import Requirement from '@civ-clone/core-requirement/Requirement';

const isAdvance = (target: unknown): target is typeof Advance =>
  typeof target === 'function' &&
  (target === Advance || Object.prototype.isPrototypeOf.call(Advance, target));

// The advances an entry names, of its targets.
const advancesIn = (entry: Requirement): (typeof Advance)[] =>
  entry.targets.filter(isAdvance);

// Each item of `more` not in `list` yet, added to its end.
const merge = (
  list: (typeof Advance)[],
  more: (typeof Advance)[]
): (typeof Advance)[] => [
  ...list,
  ...more.filter((AdvanceType) => !list.includes(AdvanceType)),
];

// The advances `playerResearch`'s player still needs to meet `entries`, prerequisites included, each before the ones
//  that need it: every advance of an all-of entry, and the one of an any-of entry that needs fewest. `null` when one
//  can't be met, which a requirement that leads back to itself (`visiting`) can't be.
const toMeet = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  entries: Requirement[],
  visiting: Set<typeof Advance> = new Set()
): (typeof Advance)[] | null => {
  let found: (typeof Advance)[] = [];

  for (const entry of entries) {
    const options = advancesIn(entry).map(
      (AdvanceType: typeof Advance): (typeof Advance)[] | null =>
        toResearch(dependencies, playerResearch, AdvanceType, visiting)
    );

    if (options.length === 0) {
      // Only conditions (a coastal city), which research can't meet.
      continue;
    }

    if (entry.mode === 'any') {
      const [fewest] = options
        .filter((option): option is (typeof Advance)[] => option !== null)
        .sort((a, b): number => a.length - b.length);

      if (!fewest) {
        return null;
      }

      found = merge(found, fewest);

      continue;
    }

    if (options.some((option): boolean => option === null)) {
      return null;
    }

    options.forEach((option): void => {
      found = merge(found, option!);
    });
  }

  return found;
};

// `AdvanceType` and the advances it needs that `playerResearch`'s player hasn't got, prerequisites first, or `null`.
const toResearch = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  AdvanceType: typeof Advance,
  visiting: Set<typeof Advance>
): (typeof Advance)[] | null => {
  if (playerResearch.completed(AdvanceType)) {
    return [];
  }

  if (visiting.has(AdvanceType)) {
    return null;
  }

  visiting.add(AdvanceType);

  const before = toMeet(
    dependencies,
    playerResearch,
    dependencies.requirementRegistry.for(AdvanceType, 'requires'),
    visiting
  );

  visiting.delete(AdvanceType);

  return before === null ? null : merge(before, [AdvanceType]);
};

// Whether `playerResearch`'s player has made `TransportType` obsolete: it has the advances of an entry saying so, all
//  of them or any one, as the entry says.
const obsolete = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  TransportType: IConstructor
): boolean =>
  dependencies.requirementRegistry
    .for(TransportType, 'obsoletedBy')
    .some((entry: Requirement): boolean => {
      const advances = advancesIn(entry);

      return (
        advances.length > 0 &&
        (entry.mode === 'any'
          ? advances.some((AdvanceType) =>
              playerResearch.completed(AdvanceType)
            )
          : advances.every((AdvanceType) =>
              playerResearch.completed(AdvanceType)
            ))
      );
    });

// The transports the ruleset has: the subjects of its requirements that carry land units.
const transportTypes = (dependencies: Dependencies): IConstructor[] => [
  ...new Set(
    dependencies.requirementRegistry
      .filter((entry: Requirement): boolean =>
        Object.prototype.isPrototypeOf.call(NavalTransport, entry.subject)
      )
      .map((entry: Requirement): IConstructor => entry.subject)
  ),
];

// An advance `playerResearch` can research now, on the shortest way to a transport its player hasn't made obsolete,
//  or `null` if it already has one (or the ruleset has none it can reach).
export const transportResearch = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch
): typeof Advance | null => {
  const paths = transportTypes(dependencies)
    .filter(
      (TransportType: IConstructor): boolean =>
        !obsolete(dependencies, playerResearch, TransportType)
    )
    .map((TransportType: IConstructor): (typeof Advance)[] | null =>
      toMeet(
        dependencies,
        playerResearch,
        dependencies.requirementRegistry.for(TransportType, 'requires')
      )
    )
    .filter((path): path is (typeof Advance)[] => path !== null)
    .sort((a, b): number => a.length - b.length);

  if (paths.length === 0 || paths[0].length === 0) {
    return null;
  }

  const available = playerResearch.available();

  return (
    paths[0].find((AdvanceType: typeof Advance): boolean =>
      available.includes(AdvanceType)
    ) ?? null
  );
};

export default transportResearch;
