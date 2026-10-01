import City from '@civ-clone/core-city/City';
import Tile from '@civ-clone/core-world/Tile';
export declare const landReachableFrom: (start: Tile) => Set<Tile>;
export declare const reachableLandToExplore: (
  city: City,
  landTilesToExplore: Tile[]
) => number;
export default reachableLandToExplore;
