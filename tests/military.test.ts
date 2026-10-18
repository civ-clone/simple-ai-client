import { Spearman, Warrior } from '@civ-clone/civ1-unit/Units';
import { defendersKept, defendersWanted, isCapital } from '../lib/Civ1/defence';
import { BronzeWorking } from '@civ-clone/civ1-science/Advances';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import City from '@civ-clone/core-city/City';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import releaseDefenders from '../lib/Turn/releaseDefenders';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

// One continent of Grassland, 9 × 5, with the player's city at (4, 2).
const setUp = async ({ size = 1 }: { size?: number } = {}) => {
  const game = new Game();

  game.availableGovernments.register(Despotism);
  game.availableCityBuildItems.register(
    ...([Warrior, Spearman] as unknown as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '9G'.repeat(5),
      5,
      9
    ),
    player = new Player(game.rules),
    rival = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(BronzeWorking);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerGovernments.getByPlayer(player).set(new Despotism());

  // The player's first city has the Palace; others don't.
  const addCity = (x: number, y: number, citySize: number): City => {
      const city = new City(
          player,
          world.get(x, y),
          '',
          game.rules,
          game.workedTiles
        ),
        cityGrowth = game.cityGrowth.getByCity(city);

      while (cityGrowth.size() < citySize) {
        cityGrowth.grow();
      }

      city.yields = () => [new Production(10)];

      return city;
    },
    city = addCity(4, 2, size);

  const dependencies = createDependencies(dependenciesFor(game));

  return { addCity, city, dependencies, game, player, rival, world };
};

describe('garrisons (civ-clone/web-renderer#423)', (): void => {
  describe('defenders', (): void => {
    it('wants a quarter of its size, at least one, and keeps its size over 4, plus one', async (): Promise<void> => {
      const { addCity, city, dependencies } = await setUp({ size: 8 }),
        small = addCity(0, 0, 3),
        large = addCity(8, 4, 8);

      // The capital keeps no more than any other city (see `Civ1/defence`).
      expect(isCapital(dependencies, city)).true;
      expect(defendersKept(dependencies, city)).equal(3);
      expect(defendersWanted(dependencies, small)).equal(1);
      expect(defendersKept(dependencies, small)).equal(1);
      expect(defendersWanted(dependencies, large)).equal(2);
      expect(defendersKept(dependencies, large)).equal(3);
    });

    it("wants and keeps more with an enemy unit next to it, but not a treaty partner's", async (): Promise<void> => {
      const { addCity, dependencies, game, player, rival, world } = await setUp(
          { size: 8 }
        ),
        other = addCity(0, 2, 8);

      new Warrior(null, rival, world.get(1, 2), game.rules);

      // 8 / 4 + 1 to build, 8 / 3 + 1 to keep.
      expect(defendersWanted(dependencies, other)).equal(3);
      expect(defendersKept(dependencies, other)).equal(3);

      game.interactions.register(
        new Peace(player, rival, new Never(), game.rules)
      );

      expect(defendersWanted(dependencies, other)).equal(2);
      expect(defendersKept(dependencies, other)).equal(3);
    });

    it('wants as many defenders as enemy attackers close by, up to three', async (): Promise<void> => {
      const { addCity, dependencies, game, rival, world } = await setUp(),
        small = addCity(0, 0, 1);

      [2, 3].forEach(
        (x) => new Warrior(null, rival, world.get(x, 0), game.rules)
      );

      expect(defendersWanted(dependencies, small)).equal(2);

      [2, 3].forEach(
        (x) => new Warrior(null, rival, world.get(x, 1), game.rules)
      );

      expect(defendersWanted(dependencies, small)).equal(3);
    });

    it('lets a spare defender go, one turn in eight, the weakest first', async (): Promise<void> => {
      const { city, dependencies, game, player } = await setUp({ size: 1 }),
        weak = new Warrior(city, player, city.tile(), game.rules),
        strong = new Spearman(city, player, city.tile(), game.rules);

      [weak, strong].forEach((unit) =>
        game.unitImprovements.register(new Fortified(unit))
      );

      const fortified = (unit: Warrior) =>
        game.unitImprovements
          .getByUnit(unit)
          .some((improvement) => improvement instanceof Fortified);

      for (let turn = 0; turn < 8 && fortified(weak); turn++) {
        game.turn.increment();
        releaseDefenders(dependencies, player, civ1Knowledge);
      }

      expect(fortified(weak)).false;
      expect(fortified(strong)).true;
    });
  });
});
