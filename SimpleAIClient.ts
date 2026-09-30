import { Attack, Defence } from '@civ-clone/core-unit/Yields';
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
import { Production } from '@civ-clone/civ1-world/Yields';
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
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import { Monarchy as MonarchyGovernment } from '@civ-clone/civ1-government/Governments';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import { chooseGovernment } from '@civ-clone/civ1-government/lib/revolution';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerTile from '@civ-clone/core-player-world/PlayerTile';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';
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
import { startRevolution } from './lib/Civ1/government';
import surveyTargets from './lib/Turn/surveyTargets';
import wakeCarrierAircraft from './lib/Turn/wakeCarrierAircraft';

const hasPlayerCity = (
  tile: Tile,
  player: Player,
  cityRegistry: CityRegistry = cityRegistryInstance
): boolean => {
  const city = cityRegistry.getByTile(tile);

  if (city === null) {
    return false;
  }

  return city.player() === player;
};

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
                const available = item.available();

                if (available.length) {
                  item.research(
                    available[
                      Math.floor(
                        available.length *
                          this._dependencies.randomNumberGenerator()
                      )
                    ]
                  );
                }

                continue;
              }

              if (item instanceof PlayerGovernment) {
                const available = item.available();

                chooseGovernment(
                  item,
                  available.includes(MonarchyGovernment)
                    ? MonarchyGovernment
                    : available[0],
                  this._dependencies.pendingEffectRegistry,
                  this._dependencies.turn
                );

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
    const tile = city.tile(),
      cityBuild = this._dependencies.cityBuildRegistry.getByCity(city),
      tileUnits = this._dependencies.unitRegistry.getByTile(tile),
      available = cityBuild.available(),
      restrictions: IConstructor[] = [Palace, Settlers],
      availableFiltered = available.filter(
        (buildItem: BuildItem): boolean =>
          !restrictions.includes(buildItem.item()) &&
          // TODO: Add auto-wonders or have more logic around this
          !Object.prototype.isPrototypeOf.call(Wonder, buildItem.item())
      ),
      availableWonders = available.filter((buildItem: BuildItem): boolean =>
        Object.prototype.isPrototypeOf.call(Wonder, buildItem.item())
      ),
      availableUnits = availableFiltered.filter(
        (buildItem: BuildItem): boolean =>
          Object.prototype.isPrototypeOf.call(Unit, buildItem.item())
      ),
      randomSelection =
        availableFiltered[
          Math.floor(
            availableFiltered.length *
              this._dependencies.randomNumberGenerator()
          )
        ].item(),
      getUnitByYield = (YieldType: typeof Yield) => {
        const [[UnitType]] = availableUnits
          .map((buildItem: BuildItem): [typeof Unit, Yield] => {
            const UnitType = buildItem.item() as unknown as typeof Unit,
              unitYield = new YieldType();

            this._dependencies.ruleRegistry.process(
              BaseYield,
              UnitType,
              unitYield
            );

            return [UnitType as typeof Unit, unitYield];
          })
          .sort(
            (
              [, unitYieldA]: [typeof Unit, Yield],
              [, unitYieldB]: [typeof Unit, Yield]
            ): number => unitYieldB.value() - unitYieldA.value()
          );

        return UnitType;
      },
      getDefensiveUnit = (
        (UnitType?: typeof Unit): (() => typeof Unit) =>
        (): typeof Unit =>
          UnitType || (UnitType = getUnitByYield(Defence))
      )(),
      getOffensiveUnit = (
        (UnitType?: typeof Unit): (() => typeof Unit) =>
        (): typeof Unit =>
          UnitType || (UnitType = getUnitByYield(Attack))
      )();

    if (
      this._dependencies.unitRegistry.getByTile(tile).length < 2 &&
      getDefensiveUnit()
    ) {
      cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

      return;
    }

    const cityGrowth = this._dependencies.cityGrowthRegistry.getByCity(
      cityBuild.city()
    );

    // Always Build Cities
    if (
      available.some(
        (buildItem: BuildItem) =>
          buildItem.item() === (Settlers as unknown as typeof Buildable)
      ) &&
      !this._dependencies.unitRegistry
        .getByCity(cityBuild.city())
        .some((unit: Unit): boolean => unit instanceof Settlers) &&
      // TODO: use expansionist leader trait
      this._dependencies.unitRegistry
        .getByPlayer(this.player())
        .filter((unit: Unit): boolean => unit instanceof Settlers).length < 3 &&
      cityGrowth.size() > 1
    ) {
      cityBuild.build(Settlers as unknown as typeof Buildable);

      return;
    }

    if (
      this._memory.targets.citiesToLiberate.length > 0 ||
      this._memory.targets.enemyCitiesToAttack.length > 0 ||
      this._memory.targets.enemyUnitsToAttack.length > 4
    ) {
      cityBuild.build(getOffensiveUnit() as unknown as typeof Buildable);

      return;
    }

    if (
      tileUnits.filter((unit) =>
        this._dependencies.unitImprovementRegistry
          .getByUnit(unit)
          .filter((improvement) => improvement instanceof Fortified)
      ).length < 2 ||
      this._memory.targets.undefendedCities.length
    ) {
      cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

      return;
    }

    // If we have resources to burn, build a wonder
    if (
      cityBuild
        .city()
        .yields()
        .filter((cityYield) => cityYield instanceof Production)
        .some((cityYield) => cityYield.value() > 4)
    ) {
      const wonders = availableWonders.map((cityBuild) => cityBuild.item());

      cityBuild.build(
        wonders[
          Math.floor(
            this._dependencies.randomNumberGenerator() * wonders.length
          )
        ]
      );
    }

    if (randomSelection) {
      cityBuild.build(randomSelection);
    }
  }

  cityLost(city: City, player: Player | null, destroyed: boolean): void {
    // Can't retaliate against ourselves, we deserved it...
    if (!player) {
      return;
    }

    const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(
      this.player()
    );

    if (destroyed) {
      // REVENGE!
      this._memory.targets.enemyCitiesToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            hasPlayerCity(
              playerTile.tile(),
              this.player(),
              this._dependencies.cityRegistry
            )
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );
      this._memory.targets.enemyUnitsToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            this._dependencies.unitRegistry
              .getByTile(playerTile.tile())
              .some((unit) => unit.player() === player)
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );

      return;
    }

    this._memory.targets.citiesToLiberate.push(city.tile());
  }

  unitDestroyed(unit: Unit, player: Player | null): void {
    const city = this._dependencies.cityRegistry.getByTile(unit.tile()),
      tileUnits = this._dependencies.unitRegistry.getByTile(unit.tile());

    if (city && city.player() === this.player() && tileUnits.length < 2) {
      this.buildItemInCity(city);

      this._dependencies.playerTreasuryRegistry
        .getByPlayerAndType(this.player(), Gold)
        .buy(city);
    }
  }
}

export default SimpleAIClient;
