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
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { instance as playerTradeRatesRegistryInstance } from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import { instance as traitRegistryInstance } from '@civ-clone/core-civilization/TraitRegistry';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import City from '@civ-clone/core-city/City';
import {
  StrategyRegistry,
  instance as strategyRegistryInstance,
} from '@civ-clone/core-strategy/StrategyRegistry';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import MandatoryPlayerAction from '@civ-clone/core-player/MandatoryPlayerAction';
import StrategyAIClient from '@civ-clone/core-strategy-ai-client/StrategyAIClient';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as rngInstance } from '@civ-clone/core-random';
import Dependencies from './lib/Dependencies';
import Knowledge from './lib/Knowledge';
import Memory from './lib/Memory';
import { instance as memoryRegistryInstance } from './lib/MemoryRegistry';
import { noOrders, skipUnit } from './lib/Unit/orders';
import buildItemInCity from './lib/Civ1/buildItemInCity';
import cityLost from './lib/Events/cityLost';
import civ1Knowledge from './lib/Civ1/knowledge';
import moveUnit from './lib/Unit/moveUnit';
import reviewCities from './lib/Turn/reviewCities';
import scoreUnitMove from './lib/Unit/scoreUnitMove';
import surveyTargets from './lib/Turn/surveyTargets';
import unitDestroyed from './lib/Events/unitDestroyed';
import wakeCarrierAircraft from './lib/Turn/wakeCarrierAircraft';
// For its `ChoiceMetaDataMap` entry, which `chooseFromList` and its callers rely on.
import './lib/Diplomacy/negotiate';

// Civ1: the computer player. A `StrategyAIClient`, so each turn is the game's strategies at work: `registerStrategies`
//  registers the Civ1 pack (`Strategies/`), and any other plugin's strategies play alongside. What stays here is what
//  the turn loop can't express as a strategy: Civ1's handling of failed, unhandled and runaway actions, and the hooks
//  that `Rules/` call during other players' turns.
export class SimpleAIClient extends StrategyAIClient {
  private _dependencies: Dependencies;
  private _knowledge: Knowledge = civ1Knowledge;

  // The player's working memory, which the strategies and the `Rules/` hooks share.
  private memory(): Memory {
    return this._dependencies.memoryRegistry.memoryFor(this.player());
  }

  // The working memory under the names it had as fields, for tests and debugging that reach in for it.
  private get _lastUnitMoves(): Map<Unit, Tile[]> {
    return this.memory().lastUnitMoves;
  }
  private get _unitPathData(): Map<Unit, Path> {
    return this.memory().unitPathData;
  }
  private get _unitTargetData(): Map<Unit, Tile> {
    return this.memory().unitTargetData;
  }
  private get _citiesToLiberate(): Tile[] {
    return this.memory().targets.citiesToLiberate;
  }
  private get _enemyCitiesToAttack(): Tile[] {
    return this.memory().targets.enemyCitiesToAttack;
  }
  private get _enemyUnitsToAttack(): Tile[] {
    return this.memory().targets.enemyUnitsToAttack;
  }
  private get _goodSitesForCities(): Tile[] {
    return this.memory().targets.goodSitesForCities;
  }
  private get _landTilesToExplore(): Tile[] {
    return this.memory().targets.landTilesToExplore;
  }
  private get _seaTilesToExplore(): Tile[] {
    return this.memory().targets.seaTilesToExplore;
  }
  private get _undefendedCities(): Tile[] {
    return this.memory().targets.undefendedCities;
  }

  constructor(
    player: Player,
    cityRegistry: CityRegistry = cityRegistryInstance,
    cityBuildRegistry: CityBuildRegistry = cityBuildRegistryInstance,
    cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
    goodyHutRegistry: GoodyHutRegistry = goodyHutRegistryInstance,
    pathFinderRegistry: PathFinderRegistry = pathFinderRegistryInstance,
    playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
    playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
    playerTreasuryRegistry: PlayerTreasuryRegistry = playerTreasuryRegistryInstance,
    playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance,
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
    unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance,
    unitRegistry: UnitRegistry = unitRegistryInstance,
    engine: Engine = engineInstance,
    clientRegistry: ClientRegistry = clientRegistryInstance,
    interactionRegistry: InteractionRegistry = interactionRegistryInstance,
    turn: Turn = turnInstance,
    randomNumberGenerator: () => number = rngInstance,
    strategyNoteRegistry: StrategyNoteRegistry = strategyNoteRegistryInstance,
    workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
    pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance,
    // The game-wide registry, which `registerStrategies` fills with the Civ1 pack. A client given registries of its own
    //  needs a `StrategyRegistry` built over them: `createStrategies(createDependencies({ … }))`.
    strategyRegistry: StrategyRegistry = strategyRegistryInstance
  ) {
    // The generator goes to `core-client`'s `Client`, which holds the one
    // `protected _randomNumberGenerator`. This class declared a second
    // `#randomNumberGenerator` shadowing it, which two `private` fields of the
    // same name cannot express.
    super(player, strategyRegistry, randomNumberGenerator);

    // The specialist, trade rate and trait registries aren't arguments, so that callers passing the others by position
    //  (the arena looks for `strategyRegistry`'s) are unaffected. Only the strategies use them, and those are given the
    //  game's own (`dependenciesFor`).
    this._dependencies = {
      availableSpecialistRegistry: availableSpecialistRegistryInstance,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      clientRegistry,
      engine,
      goodyHutRegistry,
      interactionRegistry,
      memoryRegistry: memoryRegistryInstance,
      pathFinderRegistry,
      pendingEffectRegistry,
      playerGovernmentRegistry,
      playerResearchRegistry,
      playerTradeRatesRegistry: playerTradeRatesRegistryInstance,
      playerTreasuryRegistry,
      playerWorldRegistry,
      randomNumberGenerator,
      ruleRegistry,
      specialistRegistry: specialistRegistryInstance,
      strategyNoteRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
      traitRegistry: traitRegistryInstance,
      turn,
      unitImprovementRegistry,
      unitRegistry,
      workedTileRegistry,
    };
  }

  scoreUnitMove(unit: Unit, tile: Tile): number {
    return scoreUnitMove(
      this._dependencies,
      this.player(),
      this.memory(),
      this._knowledge,
      unit,
      tile
    );
  }

  // Not `async`: the promise is handed back as it is, so awaiting this takes the same ticks as awaiting `moveUnit`.
  moveUnit(unit: Unit): Promise<void> {
    return moveUnit(
      this._dependencies,
      this.player(),
      this.memory(),
      this._knowledge,
      unit
    );
  }

  // What the `BeforeTurn` strategies `SurveyTargets`, `ReviewCities` and `WakeCarrierAircraft` do, for a caller that
  //  wants it outside a turn.
  preProcessTurn(): void {
    surveyTargets(
      this._dependencies,
      this.player(),
      this.memory(),
      this._knowledge
    );
    reviewCities(
      this._dependencies,
      this.player(),
      this.memory(),
      this._knowledge
    );
    wakeCarrierAircraft(this._dependencies, this.player(), this._knowledge);
  }

  // One unit's failed move shouldn't cost the player the rest of their turn, so log it, stop that unit for this turn
  //  and carry on with the others (civ-clone/web-renderer#79). Anything else fails the turn.
  protected actionFailed(
    action: MandatoryPlayerAction,
    error: unknown
  ): boolean {
    const item = action.value();

    if (!(item instanceof Unit)) {
      throw error;
    }

    console.error(
      `SimpleAIClient: ${
        item.constructor.name
      } ${item.id()} couldn't act and was skipped this turn:`,
      error
    );

    skipUnit(this._dependencies, item);

    return true;
  }

  // TODO: Remove this when it's working as expected
  protected actionLimitReached(action: MandatoryPlayerAction): void {
    const item = action.value();

    // Anything thrown here is dealt with here, not left to the base loop, which ends the turn after this hook either
    //  way: a unit that can't even be logged or take `NoOrders` is skipped, as `actionFailed` does, and anything else
    //  fails the turn.
    try {
      // TODO: raise warning - notification?
      console.log('');
      console.log('');
      console.log(item);

      if (item instanceof Unit) {
        console.log(item.actions());
        item
          .tile()
          .getNeighbours()
          .forEach((tile: Tile): void => console.log(item.actions(tile)));
        console.log(item.active());
        console.log(item.busy());
        console.log(item.moves().value());
        console.log(this._dependencies.unitImprovementRegistry.getByUnit(item));
      }

      // Do nothing, but shout about it
      noOrders(this._dependencies, item);
    } catch (error) {
      this.actionFailed(action, error);

      return;
    }

    console.error("SimpleAIClient: Couldn't pick an action to do.");
  }

  // The turn ends at the first action no strategy handles, which should be `EndTurn`.
  protected unhandledAction(action: MandatoryPlayerAction): void {
    if (action instanceof EndTurn) {
      return;
    }

    console.log(`Can't process: '${action.value().constructor.name}'`);
  }

  private buildItemInCity(city: City): void {
    buildItemInCity(
      this._dependencies,
      this.player(),
      this.memory().targets,
      city
    );
  }

  cityLost(city: City, player: Player | null, destroyed: boolean): void {
    cityLost(
      this._dependencies,
      this.player(),
      this.memory().targets,
      city,
      player,
      destroyed
    );
  }

  // `player` is whoever destroyed the unit, or `null`.
  unitDestroyed(unit: Unit, player: Player | null): void {
    unitDestroyed(
      this._dependencies,
      this.player(),
      this.memory(),
      unit,
      player,
      (city: City) => this.buildItemInCity(city)
    );
  }
}

export default SimpleAIClient;
