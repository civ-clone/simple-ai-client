// Generic: the registries, engine, random number generator and player memory the AI reads and acts through.
import {
  AvailableSpecialistRegistry,
  instance as availableSpecialistRegistryInstance,
} from '@civ-clone/core-city/AvailableSpecialistRegistry';
import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  GoodyHutRegistry,
  instance as goodyHutRegistryInstance,
} from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  PathFinderRegistry,
  instance as pathFinderRegistryInstance,
} from '@civ-clone/core-world-path/PathFinderRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTradeRatesRegistry,
  instance as playerTradeRatesRegistryInstance,
} from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  TraitRegistry,
  instance as traitRegistryInstance,
} from '@civ-clone/core-civilization/TraitRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import {
  MemoryRegistry,
  instance as memoryRegistryInstance,
} from './MemoryRegistry';
import { instance as rngInstance } from '@civ-clone/core-random';

// Everything here is shared by every player: the player a routine acts for is always passed alongside, never kept here.
export interface Dependencies {
  availableSpecialistRegistry: AvailableSpecialistRegistry;
  cityBuildRegistry: CityBuildRegistry;
  cityGrowthRegistry: CityGrowthRegistry;
  cityRegistry: CityRegistry;
  clientRegistry: ClientRegistry;
  engine: Engine;
  goodyHutRegistry: GoodyHutRegistry;
  interactionRegistry: InteractionRegistry;
  memoryRegistry: MemoryRegistry;
  pathFinderRegistry: PathFinderRegistry;
  pendingEffectRegistry: PendingEffectRegistry;
  playerGovernmentRegistry: PlayerGovernmentRegistry;
  playerResearchRegistry: PlayerResearchRegistry;
  playerTradeRatesRegistry: PlayerTradeRatesRegistry;
  playerTreasuryRegistry: PlayerTreasuryRegistry;
  playerWorldRegistry: PlayerWorldRegistry;
  randomNumberGenerator: () => number;
  ruleRegistry: RuleRegistry;
  specialistRegistry: SpecialistRegistry;
  strategyNoteRegistry: StrategyNoteRegistry;
  terrainFeatureRegistry: TerrainFeatureRegistry;
  tileImprovementRegistry: TileImprovementRegistry;
  traitRegistry: TraitRegistry;
  turn: Turn;
  unitImprovementRegistry: UnitImprovementRegistry;
  unitRegistry: UnitRegistry;
  workedTileRegistry: WorkedTileRegistry;
}

// The module-level singletons, the same defaults `SimpleAIClient`'s constructor has, with any of them replaced.
export const createDependencies = (
  dependencies: Partial<Dependencies> = {}
): Dependencies => ({
  availableSpecialistRegistry: availableSpecialistRegistryInstance,
  cityBuildRegistry: cityBuildRegistryInstance,
  cityGrowthRegistry: cityGrowthRegistryInstance,
  cityRegistry: cityRegistryInstance,
  clientRegistry: clientRegistryInstance,
  engine: engineInstance,
  goodyHutRegistry: goodyHutRegistryInstance,
  interactionRegistry: interactionRegistryInstance,
  memoryRegistry: memoryRegistryInstance,
  pathFinderRegistry: pathFinderRegistryInstance,
  pendingEffectRegistry: pendingEffectRegistryInstance,
  playerGovernmentRegistry: playerGovernmentRegistryInstance,
  playerResearchRegistry: playerResearchRegistryInstance,
  playerTradeRatesRegistry: playerTradeRatesRegistryInstance,
  playerTreasuryRegistry: playerTreasuryRegistryInstance,
  playerWorldRegistry: playerWorldRegistryInstance,
  randomNumberGenerator: rngInstance,
  ruleRegistry: ruleRegistryInstance,
  specialistRegistry: specialistRegistryInstance,
  strategyNoteRegistry: strategyNoteRegistryInstance,
  terrainFeatureRegistry: terrainFeatureRegistryInstance,
  tileImprovementRegistry: tileImprovementRegistryInstance,
  traitRegistry: traitRegistryInstance,
  turn: turnInstance,
  unitImprovementRegistry: unitImprovementRegistryInstance,
  unitRegistry: unitRegistryInstance,
  workedTileRegistry: workedTileRegistryInstance,
  ...dependencies,
});

export default Dependencies;
