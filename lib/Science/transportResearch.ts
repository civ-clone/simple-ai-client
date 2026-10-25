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

// The advances an entry about `Subject` with `relation` names.
const advancesFor = (
  dependencies: Dependencies,
  Subject: IConstructor,
  relation: 'requires' | 'obsoletedBy'
): (typeof Advance)[] =>
  dependencies.requirementRegistry
    .for(Subject, relation)
    .flatMap((entry: Requirement): unknown[] => [...entry.targets])
    .filter(isAdvance);

// The advances `player` still needs for all of `goals`, prerequisites included, each before the ones that need it.
const missing = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  goals: (typeof Advance)[]
): (typeof Advance)[] => {
  const found: (typeof Advance)[] = [],
    visit = (AdvanceType: typeof Advance): void => {
      if (
        found.includes(AdvanceType) ||
        playerResearch.completed(AdvanceType)
      ) {
        return;
      }

      advancesFor(dependencies, AdvanceType, 'requires').forEach(visit);

      found.push(AdvanceType);
    };

  goals.forEach(visit);

  return found;
};

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
        !advancesFor(dependencies, TransportType, 'obsoletedBy').some(
          (AdvanceType: typeof Advance): boolean =>
            playerResearch.completed(AdvanceType)
        )
    )
    .map((TransportType: IConstructor): (typeof Advance)[] =>
      missing(
        dependencies,
        playerResearch,
        advancesFor(dependencies, TransportType, 'requires')
      )
    )
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
