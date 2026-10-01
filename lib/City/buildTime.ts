// Generic: how long a city takes to build something, judged at its net shields, the shields it makes now less what its
//  units cost to support (civ-clone/web-renderer#212).
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { Production } from '@civ-clone/library-city/Yields';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// The shields `city` makes each turn after unit support. Unit support yields are negative `Production`.
export const netShields = (city: City): number =>
  reduceYield(city.yields(), Production);

// How many turns `city` takes to finish a build item, counting the shields it has stored: 0 for one it has the shields
//  for already, and `Infinity` for any other when it makes no shields to spare. Built once per decision, as working out
//  a city's yields isn't cheap.
export const buildTime = (
  dependencies: Dependencies,
  city: City
): ((buildItem: BuildItem) => number) => {
  const shields = netShields(city),
    stored = dependencies.cityBuildRegistry.getByCity(city).progress().value();

  return (buildItem: BuildItem): number => {
    const remaining = buildItem.cost().value() - stored;

    if (remaining <= 0) {
      return 0;
    }

    return shields > 0 ? Math.ceil(remaining / shields) : Infinity;
  };
};

export default buildTime;
