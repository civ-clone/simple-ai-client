import AttackConfidence from '@civ-clone/base-leader-personality/Rules/Player/AttackConfidence';
import City from '@civ-clone/core-city/City';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import MilitaryStrength from '@civ-clone/core-power/Rules/MilitaryStrength';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import Unit from '@civ-clone/core-unit/Unit';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import rivalOf from '../lib/Player/rivals';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

// Two continents, x 0-3 and x 5-8. The player has a city at (1, 2) and two Warriors; the other player a city at (3, 2),
//  on the same continent, or at (6, 2), on the other, and as many Warriors as it's given.
const setUp = async ({
  otherAt = 3,
  otherWarriors = 1,
}: { otherAt?: number; otherWarriors?: number } = {}) => {
  const game = new Game();

  game.availableGovernments.register(Despotism);

  cityRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);

  game.rules.register(
    new MilitaryStrength(
      new Effect((unit: Unit) => ({
        attack: unit.attack().value(),
        defence: unit.defence().value(),
      }))
    )
  );

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '4GO4GO'.repeat(5),
      5,
      10
    ),
    [player, other] = [new Player(game.rules), new Player(game.rules)];

  [player, other].forEach((each: Player): void => {
    game.playerResearch.register(
      new PlayerResearch(each, game.advances, game.rules)
    );
    game.playerWorlds.register(new PlayerWorld(each, world));
    game.playerWorlds.getByPlayer(each).register(...world.entries());
    game.playerGovernments.getByPlayer(each).set(new Despotism());
  });

  const city = new City(
      player,
      world.get(1, 2),
      '',
      game.rules,
      game.workedTiles
    ),
    otherCity = new City(
      other,
      world.get(otherAt, 2),
      '',
      game.rules,
      game.workedTiles
    );

  new Warrior(city, player, city.tile(), game.rules);
  new Warrior(city, player, city.tile(), game.rules);

  for (let i = 0; i < otherWarriors; i++) {
    new Warrior(otherCity, other, otherCity.tile(), game.rules);
  }

  return {
    dependencies: createDependencies(dependenciesFor(game)),
    game,
    other,
    player,
  };
};

describe('rivalOf (civ-clone/web-renderer#424)', (): void => {
  it('is a weaker enemy with a city on one of its landmasses', async (): Promise<void> => {
    const { dependencies, other, player } = await setUp();

    expect(rivalOf(dependencies, player) === other).true;
  });

  it('is no one at peace, as strong, or out of reach', async (): Promise<void> => {
    const atPeace = await setUp();

    atPeace.game.interactions.register(
      new Peace(atPeace.player, atPeace.other, new Never(), atPeace.game.rules)
    );

    expect(rivalOf(atPeace.dependencies, atPeace.player)).null;

    const asStrong = await setUp({ otherWarriors: 2 });

    expect(rivalOf(asStrong.dependencies, asStrong.player)).null;

    // On the other continent, with no port to ferry units from.
    const overseas = await setUp({ otherAt: 6 });

    expect(rivalOf(overseas.dependencies, overseas.player)).null;
  });

  it("takes on one as strong with a bold leader's confidence", async (): Promise<void> => {
    const { dependencies, game, other, player } = await setUp({
      otherWarriors: 2,
    });

    game.rules.register(new AttackConfidence(new Effect(() => 1.25)));

    expect(rivalOf(dependencies, player) === other).true;
  });
});
