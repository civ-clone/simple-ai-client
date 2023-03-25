import {
  AdvancedFlight,
  Alphabet,
  Astronomy,
  AtomicTheory,
  Automobile,
  Banking,
  BridgeBuilding,
  BronzeWorking,
  CeremonialBurial,
  Chemistry,
  Chivalry,
  CodeOfLaws,
  Combustion,
  Communism,
  Computers,
  Conscription,
  Construction,
  Corporation,
  Currency,
  Democracy,
  Electricity,
  Electronics,
  Engineering,
  Explosives,
  Feudalism,
  Flight,
  FusionPower,
  GeneticEngineering,
  Gunpowder,
  HorsebackRiding,
  Industrialization,
  Invention,
  IronWorking,
  LaborUnion,
  Literacy,
  Magnetism,
  MapMaking,
  Masonry,
  MassProduction,
  Mathematics,
  Medicine,
  Metallurgy,
  Monarchy,
  Mysticism,
  Navigation,
  NuclearFission,
  NuclearPower,
  Philosophy,
  Physics,
  Plastics,
  Pottery,
  Railroad,
  Recycling,
  Refining,
  Religion,
  Robotics,
  Rocketry,
  SpaceFlight,
  SteamEngine,
  Steel,
  Superconductor,
  TheoryOfGravity,
  TheRepublic,
  TheWheel,
  Trade,
  University as UniversityAdvance,
  Writing,
} from '@civ-clone/civ1-science/Advances';
import {
  Aqueduct,
  Bank,
  Barracks,
  Cathedral,
  CityWalls,
  Colosseum,
  Courthouse,
  Factory,
  Granary,
  HydroPlant,
  Library,
  ManufacturingPlant,
  Marketplace,
  MassTransit,
  NuclearPlant,
  Palace,
  PowerPlant,
  RecyclingCenter,
  SdiDefence,
  Temple,
  University,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import {
  Artillery,
  Battleship,
  Bomber,
  Cannon,
  Caravan,
  Carrier,
  Catapult,
  Chariot,
  Cruiser,
  Diplomat,
  Fighter,
  Frigate,
  Horseman,
  Ironclad,
  Knight,
  MechanizedInfantry,
  Musketman,
  Nuclear,
  Rifleman,
  Sail,
  Settlers,
  Spearman,
  Submarine,
  Swordman,
  Tank,
  Transport,
  Trireme,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import AvailableCityBuildItemsRegistry from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import ChoiceMeta from '@civ-clone/core-client/ChoiceMeta';
import City from '@civ-clone/core-city/City';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityNameRegistry from '@civ-clone/core-civilization/CityNameRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilizationRegistry from '@civ-clone/core-civilization/CivilizationRegistry';
import Client from '@civ-clone/core-client/Client';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import GoodyHutRegistry from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import PathFinderRegistry from '@civ-clone/core-world-path/PathFinderRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerTreasuryRegistry from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SimpleAIClient from '../SimpleAIClient';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import WorkedTileRegistry from '@civ-clone/core-city/WorkedTileRegistry';
import World from '@civ-clone/core-world/World';
import cityBuild from '@civ-clone/civ1-city-improvement/Rules/City/build';
import cityBuildCost from '@civ-clone/civ1-city-improvement/Rules/City/build-cost';
import cityBuildUnit from '@civ-clone/civ1-unit/Rules/City/build';
import cityBuildCostUnit from '@civ-clone/civ1-unit/Rules/City/buildCost';
import cityCaptured from '@civ-clone/civ1-city/Rules/City/captured';
import cityCost from '@civ-clone/civ1-city/Rules/City/cost';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import cityFoodStorage from '@civ-clone/civ1-city/Rules/City/food-storage';
import cityGrow from '@civ-clone/civ1-city/Rules/City/grow';
import cityGrowthCost from '@civ-clone/civ1-city/Rules/City/growth-cost';
import cityProcessYield from '@civ-clone/civ1-city/Rules/City/process-yield';
import cityTiles from '@civ-clone/civ1-city/Rules/City/tiles';
import cityYield from '@civ-clone/civ1-city/Rules/City/yield';
import { expect } from 'chai';
import playerAction from '@civ-clone/civ1-unit/Rules/Player/action';
import playerActionCity from '@civ-clone/civ1-city/Rules/Player/action';
import playerActionResearch from '@civ-clone/civ1-science/Rules/Player/action';
import playerTurnStart from '@civ-clone/civ1-player/Rules/Player/turn-start';
import registerCivilizations from '@civ-clone/civ1-civilization/registerCivilizations';
import researchComplete from '@civ-clone/civ1-science/Rules/Research/complete';
import researchCost from '@civ-clone/civ1-science/Rules/Research/cost';
import researchRequirements from '@civ-clone/civ1-science/Rules/Research/requirements';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import tileCanBeWorked from '@civ-clone/civ1-city/Rules/City/can-be-worked';
import tileYield from '@civ-clone/civ1-world/Rules/Tile/yield';
import turnYear from '@civ-clone/civ1-game-year/Rules/Turn/year';
import unitAction from '@civ-clone/civ1-unit/Rules/Unit/action';
import unitActivate from '@civ-clone/civ1-unit/Rules/Unit/activate';
import unitCreated from '@civ-clone/civ1-unit/Rules/Unit/created';
import unitDestroyed from '@civ-clone/civ1-unit/Rules/Unit/destroyed';
import unitMoved from '@civ-clone/civ1-unit/Rules/Unit/moved';
import unitMovementCost from '@civ-clone/civ1-unit/Rules/Unit/movementCost';
import unitValidateMove from '@civ-clone/civ1-unit/Rules/Unit/validateMove';
import unitVisibility from '@civ-clone/civ1-player/Rules/Unit/visibility';
import unitYield from '@civ-clone/civ1-unit/Rules/Unit/yield';

describe('SimpleAIClient', (): void => {
  const advanceRegistry = new AdvanceRegistry(),
    availableBuildItemsRegistry = new AvailableCityBuildItemsRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    cityNameRegistry = new CityNameRegistry(),
    cityRegistry = new CityRegistry(),
    civilizationRegistry = new CivilizationRegistry(),
    goodyHutRegistry = new GoodyHutRegistry(),
    pathFinderRegistry = new PathFinderRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerRegistry = new PlayerRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerTreasuryRegistry = new PlayerTreasuryRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    ruleRegistry = new RuleRegistry(),
    terrainFeatureRegistry = new TerrainFeatureRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    transportRegistry = new TransportRegistry(),
    turn = new Turn(),
    unitImprovementRegistry = new UnitImprovementRegistry(),
    unitRegistry = new UnitRegistry(),
    workedTileRegistry = new WorkedTileRegistry(ruleRegistry),
    simpleWorldLoader = simpleRLELoader(ruleRegistry, terrainFeatureRegistry),
    takeTurns = async (
      client: Client,
      n: number = 1,
      callable: () => void = () => {}
    ): Promise<void> => {
      while (n--) {
        const player = client.player();

        ruleRegistry.process(TurnStart, player);

        await client.takeTurn();

        ruleRegistry.process(TurnEnd, player);

        callable();

        turn.increment();
      }
    },
    createClients = async (world: World, n: number = 1): Promise<Client[]> =>
      Promise.all(
        new Array(n).fill(0).map(async (): Promise<Client> => {
          const player = new Player(ruleRegistry),
            client = new SimpleAIClient(
              player,
              cityRegistry,
              cityBuildRegistry,
              cityGrowthRegistry,
              goodyHutRegistry,
              pathFinderRegistry,
              playerGovernmentRegistry,
              playerResearchRegistry,
              playerTreasuryRegistry,
              playerWorldRegistry,
              ruleRegistry,
              terrainFeatureRegistry,
              tileImprovementRegistry,
              unitImprovementRegistry,
              unitRegistry
            ),
            availableCivilizations = civilizationRegistry.entries();

          const ChosenCivilization = await client.chooseFromList(
            new ChoiceMeta(availableCivilizations, 'choose-civilization')
          );

          player.setCivilization(new ChosenCivilization());

          playerRegistry.register(player);

          playerWorldRegistry.register(new PlayerWorld(player, world));

          playerGovernmentRegistry.register(
            new PlayerGovernment(
              player,
              availableGovernmentRegistry,
              ruleRegistry
            )
          );

          playerResearchRegistry.register(
            new PlayerResearch(player, advanceRegistry, ruleRegistry)
          );

          return client;
        })
      );

  ruleRegistry.register(
    ...cityBuild(cityImprovementRegistry, playerResearchRegistry),
    ...cityBuildCost(),
    ...cityBuildUnit(playerResearchRegistry),
    ...cityBuildCostUnit(),
    ...cityCaptured(
      cityRegistry,
      unitRegistry,
      cityGrowthRegistry,
      cityBuildRegistry,
      undefined,
      playerWorldRegistry,
      workedTileRegistry
    ),
    ...cityCost(cityGrowthRegistry, playerGovernmentRegistry, unitRegistry),
    ...cityCreated(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry,
      availableBuildItemsRegistry,
      undefined,
      workedTileRegistry
    ),
    ...cityFoodStorage(ruleRegistry),
    ...cityGrow(cityGrowthRegistry, playerWorldRegistry, workedTileRegistry),
    ...cityGrowthCost(),
    ...cityProcessYield(
      cityBuildRegistry,
      cityGrowthRegistry,
      unitRegistry,
      ruleRegistry
    ),
    ...cityTiles(),
    ...cityYield(cityImprovementRegistry, playerGovernmentRegistry),
    ...playerAction(unitRegistry),
    ...playerActionCity(cityBuildRegistry, cityRegistry),
    ...playerActionResearch(playerResearchRegistry),
    ...playerTurnStart(ruleRegistry, cityRegistry, unitRegistry),
    ...researchComplete(),
    ...researchCost(),
    ...researchRequirements(),
    ...tileCanBeWorked(cityRegistry, unitRegistry, workedTileRegistry),
    ...tileYield(
      tileImprovementRegistry,
      terrainFeatureRegistry,
      playerGovernmentRegistry
    ),
    ...turnYear(),
    ...unitAction(
      cityNameRegistry,
      cityRegistry,
      ruleRegistry,
      tileImprovementRegistry,
      unitImprovementRegistry,
      unitRegistry,
      terrainFeatureRegistry,
      transportRegistry,
      turn,
      undefined,
      workedTileRegistry
    ),
    ...unitActivate(unitImprovementRegistry),
    ...unitCreated(unitRegistry),
    ...unitDestroyed(unitRegistry, unitImprovementRegistry),
    ...unitMoved(
      transportRegistry,
      ruleRegistry,
      undefined,
      undefined,
      cityRegistry
    ),
    ...unitMovementCost(tileImprovementRegistry, transportRegistry),
    ...unitValidateMove(),
    ...unitVisibility(playerWorldRegistry),
    ...unitYield(unitImprovementRegistry, ruleRegistry)
  );

  advanceRegistry.register(
    AdvancedFlight,
    Alphabet,
    Astronomy,
    AtomicTheory,
    Automobile,
    Banking,
    BridgeBuilding,
    BronzeWorking,
    CeremonialBurial,
    Chemistry,
    Chivalry,
    CodeOfLaws,
    Combustion,
    Communism,
    Computers,
    Conscription,
    Construction,
    Corporation,
    Currency,
    Democracy,
    Electricity,
    Electronics,
    Engineering,
    Explosives,
    Feudalism,
    Flight,
    FusionPower,
    GeneticEngineering,
    Gunpowder,
    HorsebackRiding,
    Industrialization,
    Invention,
    IronWorking,
    LaborUnion,
    Literacy,
    Magnetism,
    MapMaking,
    Masonry,
    MassProduction,
    Mathematics,
    Medicine,
    Metallurgy,
    Monarchy,
    Mysticism,
    Navigation,
    NuclearFission,
    NuclearPower,
    Philosophy,
    Physics,
    Plastics,
    Pottery,
    Railroad,
    Recycling,
    Refining,
    Religion,
    Robotics,
    Rocketry,
    SpaceFlight,
    SteamEngine,
    Steel,
    Superconductor,
    TheRepublic,
    TheWheel,
    TheoryOfGravity,
    Trade,
    UniversityAdvance,
    Writing
  );

  availableBuildItemsRegistry.register(
    ...([
      Artillery,
      Battleship,
      Bomber,
      Cannon,
      Caravan,
      Carrier,
      Catapult,
      Chariot,
      Cruiser,
      Diplomat,
      Fighter,
      Frigate,
      Horseman,
      Ironclad,
      Knight,
      MechanizedInfantry,
      Musketman,
      Nuclear,
      Rifleman,
      Sail,
      Settlers,
      Spearman,
      Submarine,
      Swordman,
      Tank,
      Transport,
      Trireme,
      Warrior,
    ] as IBuildable[]),
    ...([
      Aqueduct,
      Bank,
      Barracks,
      Cathedral,
      CityWalls,
      Colosseum,
      Courthouse,
      Factory,
      Granary,
      HydroPlant,
      Library,
      ManufacturingPlant,
      Marketplace,
      MassTransit,
      NuclearPlant,
      Palace,
      PowerPlant,
      RecyclingCenter,
      SdiDefence,
      Temple,
      University,
    ] as IBuildable[])
  );

  registerCivilizations(civilizationRegistry);

  pathFinderRegistry.register(BasePathFinder);

  it('should move land units around to explore the available map', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~###
    // 2 ~###
    // 3 ~###
    const world = await simpleWorldLoader('5O3GO3GO3G', 4, 4),
      [client] = await createClients(world),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    expect(world.entries().length).to.equal(16);
    expect(playerWorld.entries().length).to.equal(0);

    const unit = new Warrior(null, player, world.get(1, 1), ruleRegistry);

    expect(playerWorld.entries().length).to.equal(9);

    expect(unit.visibility().value()).to.equal(1);

    await takeTurns(client, 3);

    expect(playerWorld.entries().length).to.equal(16);
  });

  it('should move naval units around to explore the available map', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~~~~
    // 2 ~~~~
    // 3 ~~~~
    const world = await simpleWorldLoader('16O', 4, 4),
      [client] = await createClients(world),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    new Sail(null, player, world.get(1, 1), ruleRegistry, transportRegistry);

    expect(playerWorld.entries().length).to.equal(9);

    await takeTurns(client);

    expect(playerWorld.entries().length).to.equal(16);
  });

  it('should embark land units onto naval transport units', async (): Promise<void> => {
    //   01234
    // 0 ~~~~~
    // 1 ~#~~~
    // 2 ~~~~~
    // 3 ~~~~~
    // 4 ~~~~~
    const world = await simpleWorldLoader('6OG18O', 5, 5),
      [client] = await createClients(world),
      player = client.player(),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      transport = new Sail(
        null,
        player,
        world.get(2, 2),
        ruleRegistry,
        transportRegistry
      );

    await takeTurns(client);

    expect(unit.tile()).to.not.equal(world.get(1, 1));
    expect(transport.tile()).to.not.equal(world.get(2, 2));
  });

  it('should disembark land units from naval transport units', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~#~~
    // 2 ~~~~
    // 3 ~~~~
    const world = await simpleWorldLoader('5OG10O', 4, 4),
      [client] = await createClients(world),
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

    await takeTurns(client);

    expect(unit.tile()).to.equal(world.get(1, 1));
  });

  it('should set a path to a capturable enemy city', async (): Promise<void> => {
    //   012345
    // 0 ~~~~~~
    // 1 ~####~
    // 2 ~~~~~#
    // 3 ~~###~
    // 4 ~#~~~~
    // 5 ~~####
    const world = await simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      [client] = await createClients(world),
      player = client.player(),
      enemy = new Player(ruleRegistry),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    playerWorldRegistry.register(new PlayerWorld(enemy, world));

    const city = await setUpCity({
      cityGrowthRegistry,
      improveTerrain: false,
      player: enemy,
      playerWorldRegistry,
      ruleRegistry,
      size: 2,
      tile: world.get(5, 5),
      tileImprovementRegistry,
      workedTileRegistry,
      world,
    });

    playerWorld.register(...world.entries());

    cityRegistry.register(city);

    await takeTurns(client, 12);

    expect(unit.tile()).to.equal(city.tile());
    expect(city.player()).to.equal(player);
  });

  it('should path to and fortify a fortifiable unit in an undefended friendly city', async (): Promise<void> => {
    //   012345
    // 0 ~~~~~~
    // 1 ~####~
    // 2 ~~~~~#
    // 3 ~~###~
    // 4 ~#~~~~
    // 5 ~~####
    const world = await simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      [client] = await createClients(world),
      player = client.player(),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    playerWorld.register(...world.entries());

    const city = await setUpCity({
      cityGrowthRegistry,
      improveTerrain: false,
      player,
      playerWorldRegistry,
      ruleRegistry,
      size: 2,
      tile: world.get(5, 5),
      tileImprovementRegistry,
      workedTileRegistry,
      world,
    });

    cityRegistry.register(city);

    await takeTurns(client, 14);

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

  it('should build a city and defend it', async (): Promise<void> => {
    //   01234
    // 0 #####
    // 1 #####
    // 2 #####
    // 3 #####
    // 4 #####
    const world = await simpleWorldLoader('25Gd', 5, 5),
      [client] = await createClients(world),
      player = client.player(),
      unit = new Settlers(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    expect(playerWorld.entries()).length(9);

    await takeTurns(client);

    const [city] = cityRegistry.getByPlayer(player);

    expect(city).instanceof(City);
    expect(city.tilesWorked().entries()).length(2);
    expect(unit.destroyed()).true;

    const cityBuild = cityBuildRegistry.getByCity(city);

    expect(cityBuild.building()).instanceof(BuildItem);
    expect(cityBuild.building()!.item()).equal(Warrior);

    await takeTurns(client, 5);

    expect(cityBuild.progress().value()).equal(0);

    const [producedUnit] = unitRegistry.getByTile(city.tile());

    expect(producedUnit).instanceof(Warrior);
    expect(producedUnit.busy()).not.null;
  });
});
