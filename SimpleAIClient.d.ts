import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { GoodyHutRegistry } from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import { LeaderRegistry } from '@civ-clone/core-civilization/LeaderRegistry';
import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare class SimpleAIClient extends AIClient {
  #private;
  constructor(
    player: Player,
    cityRegistry?: CityRegistry,
    cityGrowthRegistry?: CityGrowthRegistry,
    goodyHutRegistry?: GoodyHutRegistry,
    leaderRegistry?: LeaderRegistry,
    pathFinderRegistry?: PathFinderRegistry,
    playerGovernmentRegistry?: PlayerGovernmentRegistry,
    playerResearchRegistry?: PlayerResearchRegistry,
    playerWorldRegistry?: PlayerWorldRegistry,
    ruleRegistry?: RuleRegistry,
    terrainFeatureRegistry?: TerrainFeatureRegistry,
    tileImprovementRegistry?: TileImprovementRegistry,
    unitImprovementRegistry?: UnitImprovementRegistry,
    unitRegistry?: UnitRegistry
  );
  scoreUnitMove(unit: Unit, tile: Tile): number;
  moveUnit(unit: Unit): void;
  preProcessTurn(): void;
  takeTurn(): Promise<void>;
}
export default SimpleAIClient;
