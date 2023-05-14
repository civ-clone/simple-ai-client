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
import {
  Luxuries as LuxuriesTradeRate,
  Research as ResearchTradeRate,
  Tax as TaxTradeRate,
} from '@civ-clone/civ1-trade-rate/TradeRates';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import AvailableCityBuildItemsRegistry from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import AvailableTradeRateRegistry from '@civ-clone/core-trade-rate/AvailableTradeRateRegistry';
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
import ClientRegistry from '@civ-clone/core-client/ClientRegistry';
import CurrentPlayerRegistry from '@civ-clone/core-player/CurrentPlayerRegistry';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import GoodyHutRegistry from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import LayoutRegistry from '@civ-clone/core-spaceship/LayoutRegistry';
import LeaderRegistry from '@civ-clone/core-civilization/LeaderRegistry';
import PathFinderRegistry from '@civ-clone/core-world-path/PathFinderRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerTradeRatesRegistry from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import PlayerTreasuryRegistry from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SimpleAIClient from '../SimpleAIClient';
import SpaceshipRegistry from '@civ-clone/core-spaceship/SpaceshipRegistry';
import StrategyNoteRegistry from '@civ-clone/core-strategy/StrategyNoteRegistry';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TraitRegistry from '@civ-clone/core-civilization/TraitRegistry';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import WonderRegistry from '@civ-clone/core-wonder/WonderRegistry';
import WorkedTileRegistry from '@civ-clone/core-city/WorkedTileRegistry';
import World from '@civ-clone/core-world/World';
import Year from '@civ-clone/core-game-year/Year';
import cityBuildingComplete from '@civ-clone/civ1-city/Rules/City/building-complete';
import cityCanBeWorked from '@civ-clone/civ1-city/Rules/City/can-be-worked';
import cityCaptured from '@civ-clone/civ1-city/Rules/City/captured';
import cityCost from '@civ-clone/civ1-city/Rules/City/cost';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import cityDestroyed from '@civ-clone/civ1-city/Rules/City/destroyed';
import cityFoodExhausted from '@civ-clone/civ1-city/Rules/City/food-exhausted';
import cityFoodStorage from '@civ-clone/civ1-city/Rules/City/food-storage';
import cityGrow from '@civ-clone/civ1-city/Rules/City/grow';
import cityGrowthCost from '@civ-clone/civ1-city/Rules/City/growth-cost';
import cityHappinessCityCelebrateLeader from '@civ-clone/civ1-city-happiness/Rules/City/celebrate-leader';
import cityHappinessCityCivilDisorder from '@civ-clone/civ1-city-happiness/Rules/City/civil-disorder';
import cityHappinessCityCost from '@civ-clone/civ1-city-happiness/Rules/City/cost';
import cityHappinessCityYield from '@civ-clone/civ1-city-happiness/Rules/City/yield';
import cityHappinessPlayerAction from '@civ-clone/civ1-city-happiness/Rules/Player/action';
import cityHappinessPlayerTurnStart from '@civ-clone/civ1-city-happiness/Rules/Player/turn-start';
import cityImprovementCityBuild from '@civ-clone/civ1-city-improvement/Rules/City/build';
import cityImprovementCityBuildCost from '@civ-clone/civ1-city-improvement/Rules/City/build-cost';
import cityImprovementCityCaptured from '@civ-clone/civ1-city-improvement/Rules/City/captured';
import cityImprovementCityCost from '@civ-clone/civ1-city-improvement/Rules/City/cost';
import cityImprovementCityCreated from '@civ-clone/civ1-city-improvement/Rules/City/created';
import cityImprovementCityDestroyed from '@civ-clone/civ1-city-improvement/Rules/City/destroyed';
import cityImprovementCityGrow from '@civ-clone/civ1-city-improvement/Rules/City/grow';
import cityImprovementCityYieldModifier from '@civ-clone/civ1-city-improvement/Rules/City/yield-modifier';
import cityImprovementCreated from '@civ-clone/civ1-city-improvement/Rules/CityImprovement/created';
import cityImprovementUnitCreated from '@civ-clone/civ1-city-improvement/Rules/Unit/created';
import cityPlayerAction from '@civ-clone/civ1-city/Rules/Player/action';
import cityProcessYield from '@civ-clone/civ1-city/Rules/City/process-yield';
import cityShrink from '@civ-clone/civ1-city/Rules/City/shrink';
import cityTileReassigned from '@civ-clone/civ1-city/Rules/City/tile-reassigned';
import cityTiles from '@civ-clone/civ1-city/Rules/City/tiles';
import cityUnitDefeated from '@civ-clone/civ1-city/Rules/Unit/defeated';
import cityUnitMoved from '@civ-clone/civ1-city/Rules/Unit/moved';
import cityUnitUnsupported from '@civ-clone/civ1-city/Rules/Unit/unsupported';
import cityYield from '@civ-clone/civ1-city/Rules/City/yield';
import diplomacyDeclarationExpired from '@civ-clone/civ1-diplomacy/Rules/Declaration/expired';
import diplomacyNegotiationInteraction from '@civ-clone/civ1-diplomacy/Rules/Negotiation/interaction';
import diplomacyNegotiationStep from '@civ-clone/civ1-diplomacy/Rules/Negotiation/step';
import diplomacyProposalResolved from '@civ-clone/civ1-diplomacy/Rules/Proposal/resolved';
import diplomacyUnitMoved from '@civ-clone/civ1-diplomacy/Rules/Unit/moved';
import { expect } from 'chai';
import gameYearTurnYear from '@civ-clone/civ1-game-year/Rules/Turn/year';
import goodyHutAction from '@civ-clone/civ1-goody-hut/Rules/GoodyHut/action';
import goodyHutActionPerformed from '@civ-clone/civ1-goody-hut/Rules/GoodyHut/action-performed';
import goodyHutDiscovered from '@civ-clone/civ1-goody-hut/Rules/GoodyHut/discovered';
import goodyHutDistribution from '@civ-clone/civ1-goody-hut/Rules/GoodyHut/distribution';
import goodyHutUnit from '@civ-clone/civ1-goody-hut/Rules/GoodyHut/unit';
import goodyHutUnitMoved from '@civ-clone/civ1-goody-hut/Rules/Unit/moved';
import goodyHutWorldBuilt from '@civ-clone/civ1-goody-hut/Rules/World/built';
import governmentAvailability from '@civ-clone/civ1-government/Rules/Governments/availability';
import governmentPlayerAction from '@civ-clone/civ1-government/Rules/Player/action';
import governmentPlayerAdded from '@civ-clone/civ1-government/Rules/Player/added';
import governmentPlayerGovernmentChanged from '@civ-clone/civ1-government/Rules/Player/government-changed';
import playerAction from '@civ-clone/civ1-player/Rules/Player/action';
import playerAdded from '@civ-clone/civ1-player/Rules/Player/added';
import playerCityCaptured from '@civ-clone/civ1-player/Rules/City/captured';
import playerCityDestroyed from '@civ-clone/civ1-player/Rules/City/destroyed';
import playerDefeated from '@civ-clone/civ1-player/Rules/Player/defeated';
import playerSpawn from '@civ-clone/civ1-player/Rules/Player/spawn';
import playerTileImprovementBuilt from '@civ-clone/civ1-player/Rules/TileImprovement/built';
import playerTurnStart from '@civ-clone/civ1-player/Rules/Player/turn-start';
import playerUnitDestroyed from '@civ-clone/civ1-player/Rules/Unit/destroyed';
import playerUnitVisibility from '@civ-clone/civ1-player/Rules/Unit/visibility';
import playerVisibilityChanged from '@civ-clone/civ1-player/Rules/Player/visibility-changed';
import playerWorldBuilt from '@civ-clone/civ1-player/Rules/World/built';
import registerCityNames from '@civ-clone/civ1-civilization/registerCityNames';
import registerCivilizations from '@civ-clone/civ1-civilization/registerCivilizations';
import registerLeaders from '@civ-clone/civ1-civilization/registerLeaders';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import scienceCityCaptured from '@civ-clone/civ1-science/Rules/City/captured';
import scienceCityProcessYield from '@civ-clone/civ1-science/Rules/City/process-yield';
import sciencePlayerAction from '@civ-clone/civ1-science/Rules/Player/action';
import sciencePlayerAdded from '@civ-clone/civ1-science/Rules/Player/added';
import scienceResearchComplete from '@civ-clone/civ1-science/Rules/Research/complete';
import scienceResearchCost from '@civ-clone/civ1-science/Rules/Research/cost';
import scienceResearchRequirements from '@civ-clone/civ1-science/Rules/Research/requirements';
import scienceResearchStarted from '@civ-clone/civ1-science/Rules/Research/started';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import spaceshipActive from '@civ-clone/civ1-spaceship/Rules/Spaceship/active';
import spaceshipBuilt from '@civ-clone/civ1-spaceship/Rules/Spaceship/built';
import spaceshipChanceOfSuccess from '@civ-clone/civ1-spaceship/Rules/Spaceship/chance-of-success';
import spaceshipChooseSlot from '@civ-clone/civ1-spaceship/Rules/Spaceship/choose-slot';
import spaceshipCityBuild from '@civ-clone/civ1-spaceship/Rules/City/build';
import spaceshipCityBuildCost from '@civ-clone/civ1-spaceship/Rules/City/build-cost';
import spaceshipCityBuildingComplete from '@civ-clone/civ1-spaceship/Rules/City/building-complete';
import spaceshipCitySpend from '@civ-clone/civ1-spaceship/Rules/City/spend';
import spaceshipFlightTime from '@civ-clone/civ1-spaceship/Rules/Spaceship/flight-time';
import spaceshipLanded from '@civ-clone/civ1-spaceship/Rules/Spaceship/landed';
import spaceshipLost from '@civ-clone/civ1-spaceship/Rules/Spaceship/lost';
import spaceshipPlayerAction from '@civ-clone/civ1-spaceship/Rules/Player/action';
import spaceshipTurnStart from '@civ-clone/civ1-spaceship/Rules/Turn/start';
import spaceshipYield from '@civ-clone/civ1-spaceship/Rules/Spaceship/yield';
import tradeRateCityYield from '@civ-clone/civ1-trade-rate/Rules/City/yield';
import tradeRatePlayerAction from '@civ-clone/civ1-trade-rate/Rules/Player/action';
import tradeRatePlayerAdded from '@civ-clone/civ1-trade-rate/Rules/Player/added';
import tradeRatePlayerTurnStart from '@civ-clone/civ1-trade-rate/Rules/Player/turn-start';
import treasuryCityProcessYield from '@civ-clone/civ1-treasury/Rules/City/process-yield';
import treasuryCitySpend from '@civ-clone/civ1-treasury/Rules/City/spend';
import treasuryPlayerAction from '@civ-clone/civ1-treasury/Rules/Player/action';
import treasuryPlayerAdded from '@civ-clone/civ1-treasury/Rules/Player/added';
import treasuryPlayerTreasuryUpdated from '@civ-clone/civ1-treasury/Rules/Player/treasury-updated';
import unitAction from '@civ-clone/civ1-unit/Rules/Unit/action';
import unitActivate from '@civ-clone/civ1-unit/Rules/Unit/activate';
import unitCanStow from '@civ-clone/civ1-unit/Rules/Unit/canStow';
import unitCityBuild from '@civ-clone/civ1-unit/Rules/City/build';
import unitCityBuildCost from '@civ-clone/civ1-unit/Rules/City/buildCost';
import unitCityBuildingComplete from '@civ-clone/civ1-unit/Rules/City/buildingComplete';
import unitCreated from '@civ-clone/civ1-unit/Rules/Unit/created';
import unitDefeated from '@civ-clone/civ1-unit/Rules/Unit/defeated';
import unitDestroyed from '@civ-clone/civ1-unit/Rules/Unit/destroyed';
import unitLostAtSea from '@civ-clone/civ1-unit/Rules/Unit/lostAtSea';
import unitMoved from '@civ-clone/civ1-unit/Rules/Unit/moved';
import unitMovementCost from '@civ-clone/civ1-unit/Rules/Unit/movementCost';
import unitPlayerAction from '@civ-clone/civ1-unit/Rules/Player/action';
import unitStowed from '@civ-clone/civ1-unit/Rules/Unit/stowed';
import unitUnsupported from '@civ-clone/civ1-unit/Rules/Unit/unsupported';
import unitValidateMove from '@civ-clone/civ1-unit/Rules/Unit/validateMove';
import unitYield from '@civ-clone/civ1-unit/Rules/Unit/yield';
import wonderCityBuild from '@civ-clone/civ1-wonder/Rules/City/build';
import wonderCityBuildCost from '@civ-clone/civ1-wonder/Rules/City/build-cost';
import wonderCityBuildingComplete from '@civ-clone/civ1-wonder/Rules/City/building-complete';
import wonderCityCost from '@civ-clone/civ1-wonder/Rules/City/cost';
import wonderCityDestroyed from '@civ-clone/civ1-wonder/Rules/City/destroyed';
import wonderCityYield from '@civ-clone/civ1-wonder/Rules/City/yield';
import wonderCityYieldModifier from '@civ-clone/civ1-wonder/Rules/City/yield-modifier';
import wonderObsolete from '@civ-clone/civ1-wonder/Rules/Wonder/obsolete';
import wonderPlayerResearchComplete from '@civ-clone/civ1-wonder/Rules/Player/research-complete';
import wonderUnitYield from '@civ-clone/civ1-wonder/Rules/Unit/yield';
import worldEngineStart from '@civ-clone/civ1-world/Rules/Engine/start';
import worldGeneratorPickGenerator from '@civ-clone/civ1-world/Rules/WorldGenerator/pick-generator';
import worldPlayerPickStartTile from '@civ-clone/civ1-world/Rules/Player/pick-start-tile';
import worldTerrainCreated from '@civ-clone/civ1-world/Rules/Terrain/created';
import worldTerrainDistribution from '@civ-clone/civ1-world/Rules/Terrain/distribution';
import worldTerrainDistributionGroups from '@civ-clone/civ1-world/Rules/Terrain/distribution-groups';
import worldTerrainFeature from '@civ-clone/civ1-world/Rules/Terrain/feature';
import worldTileImprovementAvailable from '@civ-clone/civ1-world/Rules/TileImprovement/available';
import worldTileImprovementBuilt from '@civ-clone/civ1-world/Rules/TileImprovement/built';
import worldTileImprovementPillaged from '@civ-clone/civ1-world/Rules/TileImprovement/pillaged';
import worldTileYield from '@civ-clone/civ1-world/Rules/Tile/yield';
import worldTileYieldModifier from '@civ-clone/civ1-world/Rules/Tile/yield-modifier';
import Built from '@civ-clone/core-world/Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';

describe('SimpleAIClient', (): void => {
  const advanceRegistry = new AdvanceRegistry(),
    availableBuildItemsRegistry = new AvailableCityBuildItemsRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    availableTradeRateRegistry = new AvailableTradeRateRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    cityNameRegistry = new CityNameRegistry(),
    cityRegistry = new CityRegistry(),
    clientRegistry = new ClientRegistry(),
    civilizationRegistry = new CivilizationRegistry(),
    currentPlayerRegistry = new CurrentPlayerRegistry(),
    goodyHutRegistry = new GoodyHutRegistry(),
    interactionRegistry = new InteractionRegistry(),
    layoutRegistry = new LayoutRegistry(),
    leaderRegistry = new LeaderRegistry(),
    pathFinderRegistry = new PathFinderRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerRegistry = new PlayerRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerTradeRatesRegistry = new PlayerTradeRatesRegistry(),
    playerTreasuryRegistry = new PlayerTreasuryRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    ruleRegistry = new RuleRegistry(),
    spaceshipRegistry = new SpaceshipRegistry(),
    strategyNoteRegistry = new StrategyNoteRegistry(),
    terrainFeatureRegistry = new TerrainFeatureRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    traitRegistry = new TraitRegistry(),
    transportRegistry = new TransportRegistry(),
    turn = new Turn(),
    wonderRegistry = new WonderRegistry(),
    year = new Year(),
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
    createClients = async (n: number = 1): Promise<Client[]> =>
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
              unitRegistry,
              undefined,
              clientRegistry,
              interactionRegistry,
              turn
            ),
            availableCivilizations = civilizationRegistry.entries();

          const ChosenCivilization = await client.chooseFromList(
            new ChoiceMeta(availableCivilizations, 'choose-civilization')
          );

          player.setCivilization(new ChosenCivilization());

          const availableLeaders =
            leaderRegistry.getByCivilization(ChosenCivilization);

          const ChosenLeader = await client.chooseFromList(
            new ChoiceMeta(availableLeaders, 'choose-leader')
          );

          player.civilization().setLeader(new ChosenLeader());

          playerRegistry.register(player);
          clientRegistry.register(client);

          return client;
        })
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

  availableTradeRateRegistry.register(
    LuxuriesTradeRate,
    ResearchTradeRate,
    TaxTradeRate
  );

  registerCivilizations(civilizationRegistry);
  registerLeaders(leaderRegistry);
  registerTraits(traitRegistry);

  ruleRegistry.register(
    ...cityBuildingComplete(),
    ...cityCanBeWorked(cityRegistry, unitRegistry, workedTileRegistry),
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
    ...cityDestroyed(
      tileImprovementRegistry,
      cityRegistry,
      undefined,
      unitRegistry,
      workedTileRegistry
    ),
    ...cityFoodExhausted(),
    ...cityFoodStorage(ruleRegistry),
    ...cityGrow(cityGrowthRegistry, playerWorldRegistry, workedTileRegistry),
    ...cityGrowthCost(),
    ...cityHappinessCityCelebrateLeader(cityGrowthRegistry),
    ...cityHappinessCityCivilDisorder(cityGrowthRegistry),
    ...cityHappinessCityCost(
      ruleRegistry,
      cityGrowthRegistry,
      cityImprovementRegistry,
      playerGovernmentRegistry,
      playerResearchRegistry,
      unitRegistry
    ),
    ...cityHappinessCityYield(
      cityGrowthRegistry,
      playerGovernmentRegistry,
      unitRegistry
    ),
    ...cityHappinessPlayerAction(cityRegistry),
    ...cityHappinessPlayerTurnStart(
      cityRegistry,
      ruleRegistry,
      undefined,
      cityGrowthRegistry
    ),
    ...cityImprovementCityBuild(
      cityImprovementRegistry,
      playerResearchRegistry
    ),
    ...cityImprovementCityBuildCost(),
    ...cityImprovementCityCaptured(cityImprovementRegistry),
    ...cityImprovementCityCost(cityImprovementRegistry, playerResearchRegistry),
    ...cityImprovementCityCreated(cityRegistry, cityImprovementRegistry),
    ...cityImprovementCityDestroyed(cityImprovementRegistry),
    ...cityImprovementCityGrow(cityImprovementRegistry),
    ...cityImprovementCityYieldModifier(cityImprovementRegistry),
    ...cityImprovementCreated(cityImprovementRegistry),
    ...cityImprovementUnitCreated(
      cityImprovementRegistry,
      unitImprovementRegistry
    ),
    ...cityPlayerAction(cityBuildRegistry, cityRegistry),
    ...cityProcessYield(
      cityBuildRegistry,
      cityGrowthRegistry,
      unitRegistry,
      ruleRegistry
    ),
    ...cityShrink(cityGrowthRegistry, playerWorldRegistry, workedTileRegistry),
    ...cityTileReassigned(
      playerWorldRegistry,
      cityGrowthRegistry,
      workedTileRegistry
    ),
    ...cityTiles(),
    ...cityUnitDefeated(cityRegistry, cityGrowthRegistry),
    ...cityUnitMoved(ruleRegistry, workedTileRegistry),
    ...cityUnitUnsupported(),
    ...cityYield(cityImprovementRegistry, playerGovernmentRegistry),
    ...diplomacyDeclarationExpired(),
    ...diplomacyNegotiationInteraction(interactionRegistry),
    ...diplomacyNegotiationStep(
      ruleRegistry,
      interactionRegistry,
      playerResearchRegistry
    ),
    ...diplomacyProposalResolved(
      ruleRegistry,
      interactionRegistry,
      playerResearchRegistry,
      clientRegistry
    ),
    ...diplomacyUnitMoved(interactionRegistry, unitRegistry),
    ...gameYearTurnYear(),
    ...goodyHutAction(playerResearchRegistry, cityRegistry),
    ...goodyHutActionPerformed(),
    ...goodyHutDiscovered(goodyHutRegistry),
    ...goodyHutDistribution(goodyHutRegistry),
    ...goodyHutUnit(goodyHutRegistry, undefined, ruleRegistry),
    ...goodyHutUnitMoved(goodyHutRegistry),
    // ...goodyHutWorldBuilt(goodyHutRegistry, ruleRegistry), // To add in as needed when testing `Player`s proclivity for `GoodyHut`s.
    ...governmentAvailability(playerResearchRegistry),
    ...governmentPlayerAction(playerGovernmentRegistry),
    ...governmentPlayerAdded(
      availableGovernmentRegistry,
      playerGovernmentRegistry,
      ruleRegistry
    ),
    ...governmentPlayerGovernmentChanged(undefined, playerWorldRegistry),
    ...playerAction(),
    ...playerAdded(),
    ...playerCityCaptured(cityRegistry, ruleRegistry),
    ...playerCityDestroyed(cityRegistry, ruleRegistry),
    ...playerDefeated(currentPlayerRegistry, playerRegistry),
    ...playerSpawn(ruleRegistry),
    ...playerTileImprovementBuilt(playerRegistry, playerWorldRegistry),
    ...playerTurnStart(ruleRegistry, cityRegistry, unitRegistry),
    ...playerUnitDestroyed(cityRegistry, ruleRegistry),
    ...playerUnitVisibility(playerWorldRegistry),
    ...playerVisibilityChanged(),
    ...playerWorldBuilt(
      civilizationRegistry,
      clientRegistry,
      undefined,
      playerRegistry,
      playerWorldRegistry,
      ruleRegistry,
      leaderRegistry,
      undefined,
      cityNameRegistry,
      traitRegistry
    ),
    ...scienceCityCaptured(playerResearchRegistry, undefined, clientRegistry),
    ...scienceCityProcessYield(playerResearchRegistry, ruleRegistry),
    ...sciencePlayerAction(playerResearchRegistry),
    // Filter out the `Rule` that adds random `Advance`s for the `Player`.
    ...sciencePlayerAdded(
      advanceRegistry,
      playerResearchRegistry,
      ruleRegistry
    ).filter((_, i) => i !== 1),
    ...scienceResearchComplete(),
    ...scienceResearchCost(),
    ...scienceResearchRequirements(),
    ...scienceResearchStarted(),
    ...spaceshipActive(),
    ...spaceshipBuilt(),
    ...spaceshipChanceOfSuccess(),
    ...spaceshipChooseSlot(),
    ...spaceshipCityBuild(
      wonderRegistry,
      playerResearchRegistry,
      spaceshipRegistry
    ),
    ...spaceshipCityBuildCost(),
    ...spaceshipCityBuildingComplete(
      currentPlayerRegistry,
      spaceshipRegistry,
      layoutRegistry,
      ruleRegistry,
      turn,
      year
    ),
    ...spaceshipCitySpend(),
    ...spaceshipFlightTime(),
    ...spaceshipLanded(),
    ...spaceshipLost(
      spaceshipRegistry,
      layoutRegistry,
      ruleRegistry,
      turn,
      year
    ),
    ...spaceshipPlayerAction(spaceshipRegistry),
    ...spaceshipTurnStart(spaceshipRegistry),
    ...spaceshipYield(),
    ...tradeRateCityYield(availableTradeRateRegistry, playerTradeRatesRegistry),
    ...tradeRatePlayerAction(playerTradeRatesRegistry),
    ...tradeRatePlayerAdded(
      availableTradeRateRegistry,
      playerTradeRatesRegistry
    ),
    ...tradeRatePlayerTurnStart(
      ruleRegistry,
      cityRegistry,
      availableTradeRateRegistry
    ),
    ...treasuryCityProcessYield(
      playerTreasuryRegistry,
      ruleRegistry,
      cityImprovementRegistry
    ),
    ...treasuryCitySpend(),
    ...treasuryPlayerAction(cityRegistry, cityBuildRegistry),
    ...treasuryPlayerAdded(
      playerTreasuryRegistry,
      cityBuildRegistry,
      ruleRegistry
    ),
    ...treasuryPlayerTreasuryUpdated(),
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
      interactionRegistry,
      workedTileRegistry,
      pathFinderRegistry,
      strategyNoteRegistry
    ),
    ...unitActivate(unitImprovementRegistry),
    ...unitCanStow(),
    ...unitCityBuild(playerResearchRegistry),
    ...unitCityBuildCost(),
    ...unitCityBuildingComplete(cityGrowthRegistry),
    ...unitCreated(unitRegistry),
    ...unitDefeated(
      cityRegistry,
      ruleRegistry,
      tileImprovementRegistry,
      unitRegistry
    ),
    ...unitDestroyed(unitRegistry, unitImprovementRegistry),
    ...unitLostAtSea(),
    ...unitMoved(
      transportRegistry,
      ruleRegistry,
      undefined,
      undefined,
      cityRegistry,
      turn,
      interactionRegistry
    ),
    ...unitMovementCost(tileImprovementRegistry, transportRegistry),
    ...unitPlayerAction(unitRegistry),
    ...unitStowed(),
    ...unitUnsupported(),
    ...unitValidateMove(),
    ...unitYield(unitImprovementRegistry, ruleRegistry, transportRegistry),
    ...wonderCityBuild(playerResearchRegistry, wonderRegistry),
    ...wonderCityBuildCost(),
    ...wonderCityBuildingComplete(
      cityBuildRegistry,
      playerResearchRegistry,
      ruleRegistry,
      wonderRegistry
    ),
    ...wonderCityCost(
      cityImprovementRegistry,
      playerGovernmentRegistry,
      playerResearchRegistry,
      unitRegistry,
      wonderRegistry
    ),
    ...wonderCityDestroyed(wonderRegistry),
    ...wonderCityYield(playerResearchRegistry, wonderRegistry),
    ...wonderCityYieldModifier(playerResearchRegistry, wonderRegistry),
    ...wonderObsolete(),
    ...wonderPlayerResearchComplete(
      playerResearchRegistry,
      ruleRegistry,
      wonderRegistry
    ),
    ...wonderUnitYield(wonderRegistry, playerResearchRegistry),
    ...worldEngineStart(ruleRegistry),
    ...worldGeneratorPickGenerator(),
    ...worldPlayerPickStartTile(),
    ...worldTerrainCreated(ruleRegistry),
    ...worldTerrainDistribution(),
    ...worldTerrainDistributionGroups(),
    ...worldTerrainFeature(terrainFeatureRegistry),
    ...worldTileImprovementAvailable(
      playerResearchRegistry,
      tileImprovementRegistry
    ),
    ...worldTileImprovementBuilt(tileImprovementRegistry),
    ...worldTileImprovementPillaged(tileImprovementRegistry),
    ...worldTileYield(
      tileImprovementRegistry,
      terrainFeatureRegistry,
      playerGovernmentRegistry
    ),
    ...worldTileYieldModifier(tileImprovementRegistry)
  );

  registerCityNames(cityNameRegistry);

  pathFinderRegistry.register(BasePathFinder);

  it('should move land units around to explore the available map', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~###
    // 2 ~###
    // 3 ~###
    const [client] = await createClients(),
      world = await simpleWorldLoader('5O3GO3GO3G', 4, 4),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    expect(world.entries().length).to.equal(16);
    expect(playerWorld.entries().length).to.equal(0);

    const unit = new Warrior(null, player, world.get(1, 1), ruleRegistry);

    expect(playerWorld.entries().length).to.equal(9);

    expect(unit.visibility().value()).to.equal(1);

    await takeTurns(client, 3);

    expect(playerWorld.entries().length).to.equal(16);

    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(unit);
  });

  it('should move naval units around to explore the available map', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~~~~
    // 2 ~~~~
    // 3 ~~~~
    const [client] = await createClients(),
      world = await simpleWorldLoader('16O', 4, 4),
      player = client.player(),
      playerWorld = playerWorldRegistry.getByPlayer(player),
      unit = new Sail(
        null,
        player,
        world.get(1, 1),
        ruleRegistry,
        transportRegistry
      );

    expect(playerWorld.entries().length).to.equal(9);

    await takeTurns(client);

    expect(playerWorld.entries().length).to.equal(16);

    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(unit as Unit);
  });

  it('should embark land units onto naval transport units', async (): Promise<void> => {
    //   01234
    // 0 ~~~~~
    // 1 ~#~~~
    // 2 ~~~~~
    // 3 ~~~~~
    // 4 ~~~~~
    const [client] = await createClients(),
      world = await simpleWorldLoader('6OG18O', 5, 5),
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

    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(unit, transport as Unit);
  });

  it('should disembark land units from naval transport units', async (): Promise<void> => {
    //   0123
    // 0 ~~~~
    // 1 ~#~~
    // 2 ~~~~
    // 3 ~~~~
    const [client] = await createClients(),
      world = await simpleWorldLoader('5OG10O', 4, 4),
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

    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(unit, transport as Unit);
  });

  it('should set a path to a capturable enemy city', async (): Promise<void> => {
    //   012345
    // 0 ~~~~~~
    // 1 ~####~
    // 2 ~~~~~#
    // 3 ~~###~
    // 4 ~#~~~~
    // 5 ~~####
    const [client] = await createClients(),
      world = await simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      player = client.player(),
      enemy = new Player(ruleRegistry),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    playerWorldRegistry.register(new PlayerWorld(enemy, world));

    const city = new City(
      enemy,
      world.get(5, 5),
      '',
      ruleRegistry,
      workedTileRegistry
    );

    playerWorld.register(...world.entries());

    await takeTurns(client, 12);

    expect(unit.tile()).to.equal(city.tile());
    expect(city.player()).to.equal(player);

    cityRegistry.unregister(city);
    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player, enemy);
    playerRegistry.unregister(player, enemy);
    unitRegistry.unregister(unit);
  });

  it('should path to and fortify a fortifiable unit in an undefended friendly city', async (): Promise<void> => {
    //   012345
    // 0 ~~~~~~
    // 1 ~####~
    // 2 ~~~~~#
    // 3 ~~###~
    // 4 ~#~~~~
    // 5 ~~####
    const [client] = await createClients(),
      world = await simpleWorldLoader('7O4G6OG2O3G2OG6O4G', 6, 6),
      player = client.player(),
      unit = new Warrior(null, player, world.get(1, 1), ruleRegistry),
      playerWorld = playerWorldRegistry.getByPlayer(player);

    playerWorld.register(...world.entries());

    const city = new City(
      player,
      world.get(5, 5),
      '',
      ruleRegistry,
      workedTileRegistry
    );

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

    cityRegistry.unregister(city);
    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(unit);
  });

  it('should build a city and defend it', async (): Promise<void> => {
    //   01234
    // 0 #####
    // 1 #####
    // 2 #####
    // 3 #####
    // 4 #####
    const [client] = await createClients(),
      world = await simpleWorldLoader('25Gd', 5, 5),
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

    cityRegistry.unregister(city);
    clientRegistry.unregister(client);
    currentPlayerRegistry.unregister(player);
    playerRegistry.unregister(player);
    unitRegistry.unregister(...unitRegistry.getByPlayer(player));
  });
});
