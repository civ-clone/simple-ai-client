import City from '@civ-clone/core-city/City';
import ClientRegistry from '@civ-clone/core-client/ClientRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SimpleAIClient from '../SimpleAIClient';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import Tile from '@civ-clone/core-world/Tile';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import WorkedTileRegistry from '@civ-clone/core-city/WorkedTileRegistry';
import captured from '../Rules/City/captured';
import { expect } from 'chai';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';

describe('City:captured', (): void => {
  it('should tell the AI that lost the city, not the AI that captured it', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      clientRegistry = new ClientRegistry(),
      playerWorldRegistry = new PlayerWorldRegistry(),
      unitRegistry = new UnitRegistry(),
      workedTileRegistry = new WorkedTileRegistry(ruleRegistry),
      world = await simpleRLELoader(ruleRegistry, new TerrainFeatureRegistry())(
        '4G',
        2,
        2
      ),
      createClient = (): SimpleAIClient => {
        const player = new Player(ruleRegistry),
          client = new SimpleAIClient(
            player,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            playerWorldRegistry,
            ruleRegistry,
            undefined,
            undefined,
            undefined,
            unitRegistry,
            undefined,
            clientRegistry
          );

        clientRegistry.register(client);
        playerWorldRegistry.register(new PlayerWorld(player, world));

        return client;
      },
      capturer = createClient(),
      loser = createClient(),
      citiesToLiberate = (client: SimpleAIClient): Tile[] =>
        (client as unknown as { _citiesToLiberate: Tile[] })._citiesToLiberate;

    ruleRegistry.register(...captured(unitRegistry, clientRegistry));

    const city = new City(
      loser.player(),
      world.get(0, 0),
      '',
      ruleRegistry,
      workedTileRegistry
    );

    city.capture(capturer.player());

    expect(city.player()).to.equal(capturer.player());
    expect(citiesToLiberate(loser)).to.deep.equal([city.tile()]);
    expect(citiesToLiberate(capturer)).to.deep.equal([]);
  });
});
