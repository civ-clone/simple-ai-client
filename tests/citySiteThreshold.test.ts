// What a city site's surroundings have to score, on each grid (civ-clone/web-renderer#95): 160 on the square grid's 25
//  tiles within two, as it always was, and the same 6.4 a tile on a grid whose area of two is smaller.
import { ITopology } from '@civ-clone/core-world/Topology';
import Tile from '@civ-clone/core-world/Tile';
import { citySiteThreshold } from '../lib/Civ1/terrain';
import createTopology from '@civ-clone/core-world/topologies';
import { expect } from 'chai';

// The threshold asks the tile only for its map's topology.
const tileOn = (topology: ITopology, x: number, y: number): Tile =>
  ({
    map: () => ({ topology: () => topology }),
    x: () => x,
    y: () => y,
  } as unknown as Tile);

describe('citySiteThreshold', (): void => {
  (
    [
      ['square', 160],
      ['staggered-iso', 160],
      ['hex-odd-r', 121.6],
    ] as [string, number][]
  ).forEach(([id, threshold]): void =>
    it(`is ${threshold} on the ${id} grid, 6.4 for each tile of a whole area of two there`, (): void => {
      const topology = createTopology(id, 40, 26),
        // Well away from any edge, so the area is whole.
        wholeArea = topology.area(20, 13, 2).length;

      expect(citySiteThreshold(tileOn(topology, 20, 13))).equal(threshold);
      expect(threshold / wholeArea).closeTo(6.4, 1e-9);
    })
  );

  it("is the whole area's, wherever the site is", (): void => {
    const square = createTopology('square', 40, 26),
      hex = createTopology('hex-odd-r', 40, 26);

    [
      [0, 0],
      [39, 25],
      [20, 1],
    ].forEach(([x, y]): void => {
      expect(citySiteThreshold(tileOn(square, x, y))).equal(160);
      expect(citySiteThreshold(tileOn(hex, x, y))).equal(121.6);
    });
  });
});
