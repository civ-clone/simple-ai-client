// Generic: the cities still standing. `cityRegistry.entries()` keeps destroyed cities (`getByPlayer` and `getByTile`
//  leave them out), so anything that looks over every city reads this instead (civ-clone/web-renderer#1163).
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';

export const liveCities = (dependencies: Dependencies): City[] =>
  dependencies.cityRegistry
    .entries()
    .filter((city: City): boolean => !city.destroyed());

export default liveCities;
