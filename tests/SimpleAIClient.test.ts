import { Sail, Warrior } from '@civ-clone/civ1-unit/Units';
import {
  TurnStart,
  ITurnStartRegistry,
} from '@civ-clone/core-player/Rules/TurnStart';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Civilization from '@civ-clone/core-civilization/Civilization';
import CivilizationRegistry from '@civ-clone/core-civilization/CivilizationRegistry';
import Client from '@civ-clone/core-client/Client';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import GoodyHutRegistry from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import LeaderRegistry from '@civ-clone/core-civilization/LeaderRegistry';
import PathFinderRegistry from '@civ-clone/core-world-path/PathFinderRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SimpleAIClient from '../SimpleAIClient';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import World from '@civ-clone/core-world/World';
import action from '@civ-clone/civ1-unit/Rules/Unit/action';
import activate from '@civ-clone/civ1-unit/Rules/Unit/activate';
import created from '@civ-clone/civ1-unit/Rules/Unit/created';
import { expect } from 'chai';
import moved from '@civ-clone/civ1-unit/Rules/Unit/moved';
import movementCost from '@civ-clone/civ1-unit/Rules/Unit/movementCost';
import registerCivilizations from '@civ-clone/civ1-civilization/registerCivilizations';
import registerLeaders from '@civ-clone/civ1-civilization/registerLeaders';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import start from '@civ-clone/civ1-player/Rules/Turn/start';
import turnYear from '@civ-clone/civ1-game-year/Rules/Turn/year';
import unitCreated from '@civ-clone/civ1-player/Rules/Unit/created';
import unitsToMove from '@civ-clone/civ1-unit/Rules/Player/action';
import unitYield from '@civ-clone/civ1-unit/Rules/Unit/yield';
import validateMove from '@civ-clone/civ1-unit/Rules/Unit/validateMove';
import visibility from '@civ-clone/civ1-player/Rules/Unit/visibility';
import CityNameRegistry from '@civ-clone/core-civilization/CityNameRegistry';

describe('SimpleAIClient', (): void => {
  const advanceRegistry = new AdvanceRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityNameRegistry = new CityNameRegistry(),
    cityRegistry = new CityRegistry(),
    civilizationRegistry = new CivilizationRegistry(),
    goodyHutRegistry = new GoodyHutRegistry(),
    leaderRegistry = new LeaderRegistry(),
    pathFinderRegistry = new PathFinderRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerRegistry = new PlayerRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    ruleRegistry = new RuleRegistry(),
    terrainFeatureRegistry = new TerrainFeatureRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    transportRegistry = new TransportRegistry(),
    turn = new Turn(),
    unitImprovementRegistry = new UnitImprovementRegistry(),
    unitRegistry = new UnitRegistry(),
    simpleWorldLoader = simpleRLELoader(ruleRegistry),
    takeTurns = (
      client: Client,
      n: number = 1,
      callable: () => void = () => {}
    ): void => {
      while (n--) {
        const player = client.player();

        ruleRegistry.process(Start);

        (ruleRegistry as ITurnStartRegistry).process(TurnStart, player);

        client.takeTurn();

        callable();

        turn.increment();
      }
    },
    createClients = (world: World, n: number = 1): Client[] =>
      new Array(n).fill(0).map(
        (): Client => {
          const player = new Player(ruleRegistry),
            client = new SimpleAIClient(
              player,
              cityRegistry,
              cityGrowthRegistry,
              goodyHutRegistry,
              leaderRegistry,
              pathFinderRegistry,
              playerGovernmentRegistry,
              playerResearchRegistry,
              playerWorldRegistry,
              ruleRegistry,
              terrainFeatureRegistry,
              tileImprovementRegistry,
              unitImprovementRegistry,
              unitRegistry
            ),
            availableCivilizations = civilizationRegistry.entries();

          client.chooseCivilization(availableCivilizations);

          civilizationRegistry.unregister(
            player.civilization().constructor as typeof Civilization
          );

          playerRegistry.register(player);

          playerWorldRegistry.register(new PlayerWorld(player, world));

          playerGovernmentRegistry.register(
            new PlayerGovernment(player, ruleRegistry)
          );

          playerResearchRegistry.register(
            new PlayerResearch(player, advanceRegistry, ruleRegistry)
          );

          return client;
        }
      );

  ruleRegistry.register(
    ...action(
      cityNameRegistry,
      cityRegistry,
      ruleRegistry,
      tileImprovementRegistry,
      unitImprovementRegistry,
      unitRegistry,
      transportRegistry,
      turn
    ),
    ...activate(unitImprovementRegistry),
    ...movementCost(tileImprovementRegistry, transportRegistry),
    ...validateMove(),
    ...created(unitRegistry),
    ...moved(),
    ...start(ruleRegistry, cityRegistry, playerRegistry, unitRegistry),
    ...turnYear(),
    ...unitCreated(),
    ...unitsToMove(unitRegistry),
    ...unitYield(unitImprovementRegistry, ruleRegistry),
    ...visibility(playerWorldRegistry)
  );

  registerCivilizations(civilizationRegistry);
  registerLeaders(leaderRegistry);

  pathFinderRegistry.register(BasePathFinder);

  it('should move land units around to explore the available map', (): void => {
    const world = simpleWorldLoader('5O3GO3GO3G', 4, 4),
      [client] = createClients(world),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    expect(playerWorld.length).to.equal(0);

    const unit = new Warrior(null, player, world.get(1, 1), ruleRegistry);

    expect(unit.visibility().value()).to.equal(1);
    expect(playerWorld.length).to.equal(9);

    takeTurns(client, 3);

    expect(playerWorld.length).to.equal(16);
  });

  it('should move naval units around to explore the available map', (): void => {
    const world = simpleWorldLoader('16O', 4, 4),
      [client] = createClients(world),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    new Sail(null, player, world.get(1, 1), ruleRegistry, transportRegistry);

    expect(playerWorld.length).to.equal(9);

    takeTurns(client);

    expect(playerWorld.length).to.equal(16);
  });

  it('should embark land units onto naval transport units', (): void => {
    const world = simpleWorldLoader('6OG18O', 5, 5),
      [client] = createClients(world),
      player = client.player(),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      transport = new Sail(
        null,
        player,
        world.get(2, 2),
        ruleRegistry,
        transportRegistry
      );

    takeTurns(client);

    expect(unit.tile()).to.not.equal(world.get(1, 1));
    expect(transport.tile()).to.not.equal(world.get(2, 2));
  });

  it('should disembark land units from naval transport units', (): void => {
    const world = simpleWorldLoader('5OG10O', 4, 4),
      [client] = createClients(world),
      player = client.player(),
      unit = new Warrior(null, player, world.get(2, 2), ruleRegistry),
      transport = new Sail(
        null,
        player,
        world.get(2, 2),
        ruleRegistry,
        transportRegistry
      );

    transport.stow(unit);

    takeTurns(client);

    expect(unit.tile()).to.equal(world.get(1, 1));
  });

  it('should set a path to a capturable enemy city', (): void => {
    const world = simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      [client] = createClients(world),
      player = client.player(),
      enemy = new Player(ruleRegistry),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    playerWorldRegistry.register(new PlayerWorld(enemy, world));

    const city = setUpCity({
      cityGrowthRegistry,
      player: enemy,
      playerWorldRegistry,
      ruleRegistry: ruleRegistry,
      size: 2,
      tile: world.get(5, 5),
      tileImprovementRegistry,
      world,
    });

    playerWorld.register(...world.entries());

    cityRegistry.register(city);

    takeTurns(client, 13);

    expect(unit.tile()).to.equal(city.tile());
    expect(city.player()).to.equal(player);
  });

  it('should path to and fortify a fortifiable unit in an undefended friendly city', (): void => {
    const world = simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      [client] = createClients(world),
      player = client.player(),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    const city = setUpCity({
      cityGrowthRegistry,
      player,
      playerWorldRegistry,
      ruleRegistry: ruleRegistry,
      size: 2,
      tile: world.get(5, 5),
      tileImprovementRegistry,
      world,
    });

    playerWorld.register(...world.entries());

    cityRegistry.register(city);

    takeTurns(client, 13);

    expect(unit.tile()).to.equal(city.tile());
    expect(
      unitImprovementRegistry
        .getByUnit(unit)
        .some(
          (unitImprovement: UnitImprovement) =>
            unitImprovement instanceof Fortified
        )
    ).to.true;
  });
});
