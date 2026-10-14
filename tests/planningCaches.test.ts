// What the computer players work out once rather than every time they ask: the tiles around a tile and what each scores
//  as part of a city site's surroundings (civ-clone/web-renderer#317), and each continent, once a turn
//  (civ-clone/web-renderer#316). Each is the same answer as working it out afresh.
import { continentOf, reachableLandToExplore } from '../lib/City/explorers';
import { shouldBuildCity, surroundingArea } from '../lib/Civ1/terrain';
import { Food, Production, Trade } from '@civ-clone/civ1-world/Yields';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import { Grassland } from '@civ-clone/civ1-world/Terrains';
import Tile from '@civ-clone/core-world/Tile';
import * as spies from 'chai-spies';
import { expect, spy, use } from 'chai';
import unitGame from './lib/unitGame';

use(spies);

const at = (tiles: Iterable<Tile>): string[] =>
  [...tiles].map((tile: Tile): string => `${tile.x()},${tile.y()}`).sort();

describe('planning caches', (): void => {
  describe('surroundingArea', (): void => {
    it('should list the tiles a Tileset of the surrounding area holds, in the same order', async (): Promise<void> => {
      const { world } = await unitGame('144G', 12, 12, Despotism),
        tile = world.get(5, 6);

      [2, 4].forEach((radius: number): void => {
        expect(surroundingArea(tile, radius)).to.deep.equal(
          tile.getSurroundingArea(radius).entries()
        );
      });
    });

    it('should list each tile once on a map small enough for the area to wrap round onto itself', async (): Promise<void> => {
      const { world } = await unitGame('25G', 5, 5, Despotism),
        tile = world.get(0, 0),
        area = surroundingArea(tile, 4);

      expect(area).to.deep.equal(tile.getSurroundingArea(4).entries());
      expect(area).length(25);
      expect(new Set(area).size).to.equal(25);
    });

    it('should build the Tileset for a tile and radius once, however often it is asked for', async (): Promise<void> => {
      const { world } = await unitGame('144G', 12, 12, Despotism),
        tile = world.get(5, 6);

      spy.on(tile, ['getSurroundingArea']);

      const first = surroundingArea(tile, 2);

      expect(surroundingArea(tile, 2)).to.equal(first);
      expect(tile.getSurroundingArea).to.have.been.called.once;

      surroundingArea(tile, 4);
      surroundingArea(tile, 4);

      expect(tile.getSurroundingArea).to.have.been.called.twice;
    });
  });

  describe('shouldBuildCity', (): void => {
    it('should build no Tileset for a site it has been asked about before', async (): Promise<void> => {
      const { dependencies, player, world } = await unitGame(
          '144G',
          12,
          12,
          Despotism
        ),
        site = world.get(5, 6);

      spy.on(site, ['getSurroundingArea']);

      expect(shouldBuildCity(dependencies, player, site)).true;
      expect(shouldBuildCity(dependencies, player, site)).true;
      // Once for the tiles around it that it would work, once for the tiles any other city would have to be outside.
      expect(site.getSurroundingArea).to.have.been.called.twice;
    });

    it("should score each tile around the sites it's asked about once while the tile's yields stay the same", async (): Promise<void> => {
      const { dependencies, player, world } = await unitGame(
          '144G',
          12,
          12,
          Despotism
        ),
        // Within two tiles of each of the sites.
        tile = world.get(6, 6);

      spy.on(tile, ['score']);

      expect(shouldBuildCity(dependencies, player, world.get(5, 6))).true;
      expect(shouldBuildCity(dependencies, player, world.get(7, 6))).true;
      expect(shouldBuildCity(dependencies, player, world.get(6, 5))).true;
      expect(tile.score).to.have.been.called.once;

      // As improving it, or anything else that changes its yields, does.
      tile.clearYieldCache(player);

      expect(shouldBuildCity(dependencies, player, world.get(6, 7))).true;
      expect(tile.score).to.have.been.called.twice;
    });

    it('should judge each site as it did with a Tileset of the surrounding area', async (): Promise<void> => {
      // Grassland between columns of Desert: only sites with enough Grassland around them score well enough.
      //   0123456789AB
      // 0 DDDDDDDDDDDD
      // 1 DDDGGGGGGDDD
      //   ...
      // A DDDGGGGGGDDD
      // B DDDDDDDDDDDD
      const { dependencies, player, world } = await unitGame(
          '12D' + '3D6G3D'.repeat(10) + '12D',
          12,
          12,
          Despotism
        ),
        grassland = world
          .entries()
          .filter((tile: Tile): boolean => tile.terrain() instanceof Grassland),
        scoresEnough = grassland.filter(
          (tile: Tile): boolean =>
            tile.getSurroundingArea().score(player, [
              [Food, 4],
              [Production, 2],
              [Trade, 1],
            ]) >= 160
        );

      expect(scoresEnough.length).greaterThan(0);
      expect(scoresEnough.length).lessThan(grassland.length);
      expect(
        at(
          grassland.filter((tile: Tile): boolean =>
            shouldBuildCity(dependencies, player, tile)
          )
        )
      ).to.deep.equal(at(scoresEnough));
    });
  });

  describe('continentOf', (): void => {
    // Two continents of Grassland, with ocean between them, both ways round the map.
    //   012345
    // 0 GGOGGO
    // 1 GGOGGO
    // 2 GGOGGO
    const continents = () =>
      unitGame('2G1O2G1O2G1O2G1O2G1O2G1O', 3, 6, Despotism);

    it('should be the land reachable by land, the same set for every tile on the continent in a turn', async (): Promise<void> => {
      const { world } = await continents(),
        west = continentOf(1, world.get(0, 0));

      expect(at(west)).to.deep.equal([
        '0,0',
        '0,1',
        '0,2',
        '1,0',
        '1,1',
        '1,2',
      ]);
      expect(continentOf(1, world.get(1, 2))).to.equal(west);

      const east = continentOf(1, world.get(3, 1));

      expect(east).not.to.equal(west);
      expect(at(east)).to.deep.equal([
        '3,0',
        '3,1',
        '3,2',
        '4,0',
        '4,1',
        '4,2',
      ]);
    });

    it('should cross each continent once a turn', async (): Promise<void> => {
      const { world } = await continents(),
        tile = world.get(1, 1);

      spy.on(tile, ['getNeighbours']);

      continentOf(1, world.get(0, 0));
      continentOf(1, world.get(1, 2));
      continentOf(1, tile);

      expect(tile.getNeighbours).to.have.been.called.once;

      continentOf(2, world.get(0, 0));

      expect(tile.getNeighbours).to.have.been.called.twice;
    });

    it('should find the land around a sea tile afresh each time, as it is no one continent', async (): Promise<void> => {
      const { world } = await continents(),
        sea = world.get(2, 1),
        around = continentOf(1, sea);

      expect(at(around)).to.include.members(['1,1', '3,1', '2,1']);
      expect(continentOf(1, sea)).not.to.equal(around);
      expect(continentOf(1, world.get(1, 1))).not.to.equal(around);
    });

    it('should count the same land to explore from a city as finding its continent afresh does', async (): Promise<void> => {
      const { addCity, world } = await continents(),
        city = addCity(0, 1),
        toExplore = [world.get(1, 1), world.get(3, 1), world.get(1, 0)];

      expect(
        reachableLandToExplore(city, toExplore, continentOf(1, city.tile()))
      ).to.equal(reachableLandToExplore(city, toExplore));
      expect(reachableLandToExplore(city, toExplore)).to.equal(2);
    });
  });
});
