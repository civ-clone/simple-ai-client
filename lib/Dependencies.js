"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDependencies = void 0;
// Generic: the registries, engine, random number generator and player memory the AI reads and acts through.
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const MemoryRegistry_1 = require("./MemoryRegistry");
const core_random_1 = require("@civ-clone/core-random");
// The module-level singletons, the same defaults `SimpleAIClient`'s constructor has, with any of them replaced.
const createDependencies = (dependencies = {}) => ({
    cityBuildRegistry: CityBuildRegistry_1.instance,
    cityGrowthRegistry: CityGrowthRegistry_1.instance,
    cityRegistry: CityRegistry_1.instance,
    clientRegistry: ClientRegistry_1.instance,
    engine: Engine_1.instance,
    goodyHutRegistry: GoodyHutRegistry_1.instance,
    interactionRegistry: InteractionRegistry_1.instance,
    memoryRegistry: MemoryRegistry_1.instance,
    pathFinderRegistry: PathFinderRegistry_1.instance,
    pendingEffectRegistry: core_pending_effect_1.instance,
    playerGovernmentRegistry: PlayerGovernmentRegistry_1.instance,
    playerResearchRegistry: PlayerResearchRegistry_1.instance,
    playerTreasuryRegistry: PlayerTreasuryRegistry_1.instance,
    playerWorldRegistry: PlayerWorldRegistry_1.instance,
    randomNumberGenerator: core_random_1.instance,
    ruleRegistry: RuleRegistry_1.instance,
    strategyNoteRegistry: StrategyNoteRegistry_1.instance,
    terrainFeatureRegistry: TerrainFeatureRegistry_1.instance,
    tileImprovementRegistry: TileImprovementRegistry_1.instance,
    turn: Turn_1.instance,
    unitImprovementRegistry: UnitImprovementRegistry_1.instance,
    unitRegistry: UnitRegistry_1.instance,
    workedTileRegistry: WorkedTileRegistry_1.instance,
    ...dependencies,
});
exports.createDependencies = createDependencies;
//# sourceMappingURL=Dependencies.js.map