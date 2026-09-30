// Generic: the registries, engine and random number generator the AI reads and acts through, built once per client.
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { GoodyHutRegistry } from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';

// Everything here is shared by every player: the player a routine acts for is always passed alongside, never kept here.
export interface Dependencies {
  cityBuildRegistry: CityBuildRegistry;
  cityGrowthRegistry: CityGrowthRegistry;
  cityRegistry: CityRegistry;
  clientRegistry: ClientRegistry;
  engine: Engine;
  goodyHutRegistry: GoodyHutRegistry;
  interactionRegistry: InteractionRegistry;
  pathFinderRegistry: PathFinderRegistry;
  pendingEffectRegistry: PendingEffectRegistry;
  playerGovernmentRegistry: PlayerGovernmentRegistry;
  playerResearchRegistry: PlayerResearchRegistry;
  playerTreasuryRegistry: PlayerTreasuryRegistry;
  playerWorldRegistry: PlayerWorldRegistry;
  randomNumberGenerator: () => number;
  ruleRegistry: RuleRegistry;
  strategyNoteRegistry: StrategyNoteRegistry;
  terrainFeatureRegistry: TerrainFeatureRegistry;
  tileImprovementRegistry: TileImprovementRegistry;
  turn: Turn;
  unitImprovementRegistry: UnitImprovementRegistry;
  unitRegistry: UnitRegistry;
  workedTileRegistry: WorkedTileRegistry;
}

export default Dependencies;
