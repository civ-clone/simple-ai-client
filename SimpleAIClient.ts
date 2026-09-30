import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
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
import AIClient from '@civ-clone/core-ai-client/AIClient';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as rngInstance } from '@civ-clone/core-random';
import Dependencies from './lib/Dependencies';
import { Memory, createMemory } from './lib/Memory';
import Knowledge from './lib/Knowledge';
import civ1Knowledge from './lib/Civ1/knowledge';
import reviewCities from './lib/Turn/reviewCities';
import chooseNegotiationStep from './lib/Diplomacy/chooseNegotiationStep';
import { noOrders, skipUnit } from './lib/Unit/orders';
import takeUnitTurn from './lib/Unit/takeUnitTurn';
import waitForCarrier from './lib/Unit/waitForCarrier';
import moveUnit from './lib/Unit/moveUnit';
import scoreUnitMove from './lib/Unit/scoreUnitMove';
import { pickGovernment, startRevolution } from './lib/Civ1/government';
import buildItemInCity from './lib/Civ1/buildItemInCity';
import chooseResearch from './lib/Science/chooseResearch';
import cityLost from './lib/Events/cityLost';
import unitDestroyed from './lib/Events/unitDestroyed';
import surveyTargets from './lib/Turn/surveyTargets';
import wakeCarrierAircraft from './lib/Turn/wakeCarrierAircraft';

export class SimpleAIClient extends AIClient {
  private _dependencies: Dependencies;
  private _knowledge: Knowledge = civ1Knowledge;
  private _memory: Memory = createMemory();

  // The working memory under the names it had as fields, for tests and debugging that reach in for it.
  private get _lastUnitMoves(): Map<Unit, Tile[]> {
    return this._memory.lastUnitMoves;
  }
  private get _unitPathData(): Map<Unit, Path> {
    return this._memory.unitPathData;
  }
  private get _unitTargetData(): Map<Unit, Tile> {
    return this._memory.unitTargetData;
  }
  private get _citiesToLiberate(): Tile[] {
    return this._memory.targets.citiesToLiberate;
  }
  private get _enemyCitiesToAttack(): Tile[] {
    return this._memory.targets.enemyCitiesToAttack;
  }
  private get _enemyUnitsToAttack(): Tile[] {
    return this._memory.targets.enemyUnitsToAttack;
  }
  private get _goodSitesForCities(): Tile[] {
    return this._memory.targets.goodSitesForCities;
  }
  private get _landTilesToExplore(): Tile[] {
    return this._memory.targets.landTilesToExplore;
  }
  private get _seaTilesToExplore(): Tile[] {
    return this._memory.targets.seaTilesToExplore;
  }
  private get _undefendedCities(): Tile[] {
    return this._memory.targets.undefendedCities;
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
    pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
  ) {
    // The generator goes to `core-client`'s `Client`, which holds the one
    // `protected _randomNumberGenerator`. This class declared a second
    // `#randomNumberGenerator` shadowing it, which two `private` fields of the
    // same name cannot express.
    super(player, randomNumberGenerator);

    this._dependencies = {
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      clientRegistry,
      engine,
      goodyHutRegistry,
      interactionRegistry,
      pathFinderRegistry,
      pendingEffectRegistry,
      playerGovernmentRegistry,
      playerResearchRegistry,
      playerTreasuryRegistry,
      playerWorldRegistry,
      randomNumberGenerator,
      ruleRegistry,
      strategyNoteRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
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
      this._memory,
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
      this._memory,
      this._knowledge,
      unit
    );
  }

  preProcessTurn(): void {
    surveyTargets(
      this._dependencies,
      this.player(),
      this._memory,
      this._knowledge
    );
    reviewCities(
      this._dependencies,
      this.player(),
      this._memory.targets,
      this._knowledge
    );
    wakeCarrierAircraft(this._dependencies, this.player(), this._knowledge);
  }

  async chooseFromList<Name extends keyof ChoiceMetaDataMap>(
    meta: ChoiceMeta<Name>
  ): Promise<DataForChoiceMeta<ChoiceMeta<Name>>> {
    if (meta.key() !== 'negotiation.next-step') {
      return super.chooseFromList(meta);
    }

    return chooseNegotiationStep(this._dependencies, this.player(), meta);
  }

  takeTurn(): Promise<void> {
    return new Promise(
      async (
        resolve: () => void,
        reject: (error: Error) => any
      ): Promise<void> => {
        try {
          let loopCheck = 0;

          this.preProcessTurn();

          startRevolution(this._dependencies, this.player());

          while (this.player().hasMandatoryActions()) {
            const action = this.player().mandatoryAction(),
              item = action.value();

            try {
              // TODO: Remove this when it's working as expected
              if (loopCheck++ > 1e3) {
                // TODO: raise warning - notification?
                console.log('');
                console.log('');
                console.log(item);

                if (item instanceof Unit) {
                  console.log(item.actions());
                  item
                    .tile()
                    .getNeighbours()
                    .forEach((tile: Tile): void =>
                      console.log(item.actions(tile))
                    );
                  console.log(item.active());
                  console.log(item.busy());
                  console.log(item.moves().value());
                  console.log(
                    this._dependencies.unitImprovementRegistry.getByUnit(item)
                  );
                }

                // Do nothing, but shout about it
                noOrders(this._dependencies, item);

                console.error("SimpleAIClient: Couldn't pick an action to do.");

                break;
              }

              if (
                item instanceof Unit &&
                waitForCarrier(
                  this._dependencies,
                  this.player(),
                  this._knowledge,
                  item
                )
              ) {
                continue;
              }

              if (item instanceof Unit) {
                const moving = takeUnitTurn(
                  this._dependencies,
                  this.player(),
                  this._memory,
                  this._knowledge,
                  item
                );

                if (moving !== null) {
                  await moving;
                }

                continue;
              }

              if (item instanceof CityBuild) {
                this.buildItemInCity(item.city());

                continue;
              }

              if (item instanceof PlayerResearch) {
                chooseResearch(this._dependencies, item);

                continue;
              }

              if (item instanceof PlayerGovernment) {
                pickGovernment(this._dependencies, item);

                continue;
              }

              if (action instanceof EndTurn) {
                break;
              }

              console.log(`Can't process: '${item.constructor.name}'`);

              break;
            } catch (e) {
              if (!(item instanceof Unit)) {
                throw e;
              }

              // One unit's failed move shouldn't cost the player the rest of their turn, so log it, stop that unit for
              //  this turn and carry on with the others (civ-clone/web-renderer#79).
              console.error(
                `SimpleAIClient: ${
                  item.constructor.name
                } ${item.id()} couldn't act and was skipped this turn:`,
                e
              );

              skipUnit(this._dependencies, item);
            }
          }

          resolve();
        } catch (e) {
          if (typeof e === 'string') {
            reject(new Error(e));

            return;
          }

          if (e instanceof Error) {
            reject(e);

            return;
          }

          reject(new Error(`An unknown error occurred: ${e}`));
        }
      }
    );
  }

  private buildItemInCity(city: City): void {
    buildItemInCity(
      this._dependencies,
      this.player(),
      this._memory.targets,
      city
    );
  }

  cityLost(city: City, player: Player | null, destroyed: boolean): void {
    cityLost(
      this._dependencies,
      this.player(),
      this._memory.targets,
      city,
      player,
      destroyed
    );
  }

  // TODO: `player`, who destroyed the unit, is never used. Kept: #153 changes no play.
  unitDestroyed(unit: Unit, player: Player | null): void {
    unitDestroyed(this._dependencies, this.player(), unit, (city: City) =>
      this.buildItemInCity(city)
    );
  }
}

export default SimpleAIClient;
