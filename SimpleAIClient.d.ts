import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { GoodyHutRegistry } from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import City from '@civ-clone/core-city/City';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
declare global {
  interface ChoiceMetaDataMap {
    'negotiation.next-step': IAction;
  }
}
export declare class SimpleAIClient extends AIClient {
  private _isACityTile;
  private _shouldBuildCity;
  private _shouldIrrigate;
  private _shouldMine;
  private _shouldRoad;
  private _lastUnitMoves;
  private _unitPathData;
  private _unitTargetData;
  private _citiesToLiberate;
  private _enemyCitiesToAttack;
  private _enemyUnitsToAttack;
  private _goodSitesForCities;
  private _landTilesToExplore;
  private _seaTilesToExplore;
  private _undefendedCities;
  private _cityRegistry;
  private _cityBuildRegistry;
  private _cityGrowthRegistry;
  private _clientRegistry;
  private _goodyHutRegistry;
  private _interactionRegistry;
  private _pathFinderRegistry;
  private _playerGovernmentRegistry;
  private _playerResearchRegistry;
  private _playerTreasuryRegistry;
  private _playerWorldRegistry;
  private _ruleRegistry;
  private _strategyNoteRegistry;
  private _terrainFeatureRegistry;
  private _tileImprovementRegistry;
  private _turn;
  private _unitImprovementRegistry;
  private _unitRegistry;
  private _workedTileRegistry;
  private _engine;
  constructor(
    player: Player,
    cityRegistry?: CityRegistry,
    cityBuildRegistry?: CityBuildRegistry,
    cityGrowthRegistry?: CityGrowthRegistry,
    goodyHutRegistry?: GoodyHutRegistry,
    pathFinderRegistry?: PathFinderRegistry,
    playerGovernmentRegistry?: PlayerGovernmentRegistry,
    playerResearchRegistry?: PlayerResearchRegistry,
    playerTreasuryRegistry?: PlayerTreasuryRegistry,
    playerWorldRegistry?: PlayerWorldRegistry,
    ruleRegistry?: RuleRegistry,
    terrainFeatureRegistry?: TerrainFeatureRegistry,
    tileImprovementRegistry?: TileImprovementRegistry,
    unitImprovementRegistry?: UnitImprovementRegistry,
    unitRegistry?: UnitRegistry,
    engine?: Engine,
    clientRegistry?: ClientRegistry,
    interactionRegistry?: InteractionRegistry,
    turn?: Turn,
    randomNumberGenerator?: () => number,
    strategyNoteRegistry?: StrategyNoteRegistry,
    workedTileRegistry?: WorkedTileRegistry
  );
  private aircraftFuel;
  private aircraftCanReturn;
  private carriersFor;
  scoreUnitMove(unit: Unit, tile: Tile): number;
  moveUnit(unit: Unit): Promise<void>;
  preProcessTurn(): void;
  chooseFromList<Name extends keyof ChoiceMetaDataMap>(
    meta: ChoiceMeta<Name>
  ): Promise<DataForChoiceMeta<ChoiceMeta<Name>>>;
  takeTurn(): Promise<void>;
  private buildItemInCity;
  cityLost(city: City, player: Player | null, destroyed: boolean): void;
  unitDestroyed(unit: Unit, player: Player | null): void;
  private canNegotiate;
  private handleNegotiation;
  private skipUnit;
  private noOrders;
  private shouldAttack;
}
export default SimpleAIClient;
