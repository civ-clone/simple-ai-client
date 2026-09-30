import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import {
  Attack as AttackAction,
  BuildIrrigation,
  BuildMine,
  BuildRoad,
  CaptureCity,
  Disembark,
  Embark,
  Fortify,
  FoundCity,
  Move,
  NoOrders,
  SneakAttack,
  SneakCaptureCity,
  Unload,
} from '@civ-clone/civ1-unit/Actions';
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
  Fortifiable,
  Land,
  Naval,
  NavalTransport,
  Worker,
} from '@civ-clone/civ1-unit/Types';
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
import Action from '@civ-clone/core-unit/Action';
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
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';
import { instance as rngInstance } from '@civ-clone/core-random';
import Dependencies from './lib/Dependencies';
import { Memory, createMemory } from './lib/Memory';
import { aircraftCanReturn, aircraftFuel } from './lib/Civ1/aircraft';
import {
  shouldBuildCity,
  shouldIrrigate,
  shouldMine,
  shouldRoad,
} from './lib/Civ1/terrain';
import Knowledge from './lib/Knowledge';
import civ1Knowledge from './lib/Civ1/knowledge';
import reviewCities from './lib/Turn/reviewCities';
import canNegotiate from './lib/Diplomacy/negotiate';
import chooseNegotiationStep from './lib/Diplomacy/chooseNegotiationStep';
import shouldAttack from './lib/shouldAttack';
import { startRevolution } from './lib/Civ1/government';
import surveyTargets from './lib/Turn/surveyTargets';
import wakeCarrierAircraft from './lib/Turn/wakeCarrierAircraft';

type ActionLookup = {
  attack?: AttackAction;
  buildIrrigation?: BuildIrrigation;
  buildMine?: BuildMine;
  buildRoad?: BuildRoad;
  captureCity?: CaptureCity;
  disembark?: Disembark;
  embark?: Embark;
  fortify?: Fortify;
  foundCity?: FoundCity;
  noOrders?: NoOrders;
  sneakAttack?: SneakAttack;
  unload?: Unload;
};

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
    const actions = unit.actions(tile),
      {
        attack,
        buildIrrigation,
        buildMine,
        buildRoad,
        captureCity,
        disembark,
        embark,
        fortify,
        foundCity,
        noOrders,
        sneakAttack,
      } = actions.reduce(
        (object: ActionLookup, entity: Action): ActionLookup => ({
          ...object,
          [entity.constructor.name.replace(/^./, (char: string): string =>
            char.toLowerCase()
          )]: entity,
        }),
        {}
      );

    if (
      sneakAttack &&
      !shouldAttack(this._dependencies, this.player(), sneakAttack.enemy())
    ) {
      return -10;
    }

    const [firstAction] = actions;

    if (
      firstAction &&
      !aircraftCanReturn(this._dependencies, this.player(), unit, firstAction)
    ) {
      return -1;
    }

    if (
      !actions.length ||
      (actions.length === 1 && noOrders) ||
      (unit instanceof Fortifiable &&
        actions.length === 2 &&
        fortify &&
        noOrders)
    ) {
      return -1;
    }

    let score = 0;

    const goodyHut = this._dependencies.goodyHutRegistry.getByTile(tile);

    if (goodyHut !== null) {
      score += 60;
    }

    if (
      (foundCity && shouldBuildCity(this._dependencies, this.player(), tile)) ||
      (buildMine && shouldMine(this._dependencies, this.player(), tile)) ||
      (buildIrrigation &&
        shouldIrrigate(this._dependencies, this.player(), tile)) ||
      (buildRoad && shouldRoad(this._dependencies, this.player(), tile))
    ) {
      score += 24;
    }

    const tileUnits = this._dependencies.unitRegistry
        .getByTile(tile)
        .sort(
          (a: Unit, b: Unit): number =>
            b.defence().value() - a.defence().value()
        ),
      [defender] = tileUnits,
      ourUnitsOnTile = tileUnits.some(
        (unit: Unit) => unit.player() === this.player()
      );

    if (
      unit instanceof NavalTransport &&
      unit.hasCapacity() &&
      tileUnits.length &&
      ourUnitsOnTile
    ) {
      score += 10;
    }

    if (
      unit instanceof NavalTransport &&
      unit.hasCargo() &&
      tile.isCoast() &&
      tile.isWater()
    ) {
      score += 16;
    }

    if (embark) {
      score += 16;
    }

    // TODO: move to far off continents
    if (disembark /* && tile.continentId !== unit.departureContinentId*/) {
      score += 16;
    }

    if (captureCity) {
      score += 100;
    }

    // TODO: weight attacking dependent on leader's personality
    if (attack && unit.attack() > defender.defence()) {
      score += 24 * (unit.attack().value() - defender.defence().value());
    }

    if (attack && unit.attack().value() >= defender.defence().value()) {
      score += 16;
    }

    // add some jeopardy
    if (
      attack &&
      unit.attack().value() >= defender.defence().value() * (2 / 3)
    ) {
      score += 8;
    }

    const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(
      this.player()
    );

    const discoverableTiles = tile
      .getNeighbours()
      .filter(
        (neighbouringTile: Tile): boolean =>
          !playerWorld.includes(neighbouringTile)
      ).length;

    if (discoverableTiles > 0) {
      score += discoverableTiles * 3;
    }

    const target = this._memory.unitTargetData.get(unit);

    if (
      target instanceof Tile &&
      tile.distanceFrom(target) < unit.tile().distanceFrom(target)
    ) {
      score += 14;
    }

    const lastMoves = this._memory.lastUnitMoves.get(unit) || [];

    if (!lastMoves.includes(tile)) {
      score *= 4;
    }

    return score;
  }

  async moveUnit(unit: Unit): Promise<void> {
    let loopCheck = 0;

    while (unit.active() && unit.moves().value() >= 0.1) {
      if (loopCheck++ > 1e3) {
        console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
        console.log(
          `${unit.player().civilization().name()} ${unit.constructor.name}`
        );
        console.log(unit.actions());
        console.log(unit.actionsForNeighbours());
        this.noOrders(unit);

        return;
      }

      const path = this._memory.unitPathData.get(unit);

      if (path) {
        const target = path.shift(),
          moves = unit
            .actions(target)
            .filter((action) => action instanceof Move),
          // Passing through, fly over a `City` or `Carrier` rather than landing on it, which would end the turn.
          [move] =
            path.length > 0 && unit.moves().value() > 1
              ? [
                  ...moves.filter((action) => action.constructor === Move),
                  ...moves,
                ]
              : moves;

        if (
          (move instanceof SneakCaptureCity &&
            !shouldAttack(this._dependencies, this.player(), move.enemy())) ||
          (move &&
            !aircraftCanReturn(
              this._dependencies,
              this.player(),
              unit,
              move as Action
            ))
        ) {
          this._memory.unitPathData.delete(unit);

          continue;
        }

        if (move) {
          unit.action(move as Action);

          if (path.length === 0) {
            this._memory.unitPathData.delete(unit);
          }

          await canNegotiate(this._dependencies, this.player(), unit);

          continue;
        }

        if (path.length > 0) {
          // restart the loop
          continue;
        }

        this._memory.unitPathData.delete(unit);
      }

      const [target] = unit
        .tile()
        .getNeighbours()
        .map((tile: Tile): [Tile, number] => [
          tile,
          this.scoreUnitMove(unit, tile),
        ])
        .filter(([, score]: [Tile, number]): boolean => score > -1)
        .sort(
          ([, a]: [Tile, number], [, b]: [Tile, number]): number =>
            b - a ||
            // if there's no difference, sort randomly
            Math.floor(this._dependencies.randomNumberGenerator() * 3) - 1
        )
        .map(([tile]: [Tile, number]): Tile => tile);

      if (!target) {
        // TODO: could do something a bit more intelligent here
        this.noOrders(unit);

        return;
      }

      const actions = unit.actions(target),
        [action] = actions,
        lastMoves = this._memory.lastUnitMoves.get(unit) || [],
        currentTarget = this._memory.unitTargetData.get(unit);

      if (
        !action ||
        ((action instanceof SneakAttack ||
          action instanceof SneakCaptureCity) &&
          !shouldAttack(this._dependencies, this.player(), action.enemy()))
      ) {
        // TODO: could do something a bit more intelligent here
        this.noOrders(unit);

        return;
      }

      if (currentTarget === target) {
        this._memory.unitTargetData.delete(unit);
      }

      lastMoves.push(target);

      this._memory.lastUnitMoves.set(unit, lastMoves.slice(-50));

      unit.action(action as Action);
    }

    await canNegotiate(this._dependencies, this.player(), unit);

    // If we're here, we still have some moves left, lets clear them up.
    // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
    if (unit.moves().value() > 0) {
      this.noOrders(unit);
    }
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
                this.noOrders(item);

                console.error("SimpleAIClient: Couldn't pick an action to do.");

                break;
              }

              // Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn.
              if (
                item instanceof Unit &&
                !item.waiting() &&
                aircraftFuel(this._dependencies, item) !== null &&
                this._dependencies.unitRegistry
                  .getByPlayer(this.player())
                  .some(
                    (carrier: Unit): boolean =>
                      carrier instanceof NavalTransport &&
                      carrier.canStow(item) &&
                      carrier.active() &&
                      carrier.moves().value() > 0
                  )
              ) {
                item.setWaiting();

                continue;
              }

              if (item instanceof Unit) {
                const unit = item,
                  tile = unit.tile(),
                  target = this._memory.unitTargetData.get(unit),
                  actions = unit.actions(),
                  {
                    buildIrrigation,
                    buildMine,
                    buildRoad,
                    fortify,
                    foundCity,
                    unload,
                  } = actions.reduce(
                    (object: ActionLookup, entity: Action): ActionLookup => ({
                      ...object,
                      [entity.constructor.name.replace(/^./, (char) =>
                        char.toLowerCase()
                      )]: entity,
                    }),
                    {}
                  ),
                  tileUnits = this._dependencies.unitRegistry.getByTile(tile),
                  lastUnitMoves = this._memory.lastUnitMoves.get(unit);

                if (!lastUnitMoves) {
                  this._memory.lastUnitMoves.set(unit, [unit.tile()]);
                }

                if (
                  unit instanceof NavalTransport &&
                  unload &&
                  tile.isCoast() &&
                  unit
                    .cargo()
                    .some(
                      (unit: Unit): boolean =>
                        !tile
                          .getNeighbours()
                          .some((tile: Tile): boolean =>
                            (
                              this._memory.lastUnitMoves.get(unit) || []
                            ).includes(tile)
                          )
                    )
                ) {
                  unit.action(unload);

                  unit.setWaiting();

                  // skip out to allow the unloaded units to be moved.
                  continue;
                }

                if (unit instanceof Worker) {
                  if (
                    foundCity &&
                    shouldBuildCity(this._dependencies, this.player(), tile)
                  ) {
                    unit.action(foundCity);
                  } else if (
                    buildIrrigation &&
                    shouldIrrigate(this._dependencies, this.player(), tile)
                  ) {
                    unit.action(buildIrrigation);
                  } else if (
                    buildMine &&
                    shouldMine(this._dependencies, this.player(), tile)
                  ) {
                    unit.action(buildMine);
                  } else if (
                    buildRoad &&
                    shouldRoad(this._dependencies, this.player(), tile)
                  ) {
                    unit.action(buildRoad);
                  } else if (
                    !target &&
                    this._memory.targets.goodSitesForCities.length
                  ) {
                    this._memory.unitTargetData.set(
                      unit,
                      this._memory.targets.goodSitesForCities.shift() as Tile
                    );
                  }

                  await this.moveUnit(unit);

                  continue;
                }

                // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                const [cityUnitWithLowerDefence] = tileUnits.filter(
                    (tileUnit: Unit): boolean =>
                      this._dependencies.unitImprovementRegistry
                        .getByUnit(tileUnit)
                        .some(
                          (improvement: UnitImprovement): boolean =>
                            improvement instanceof Fortified
                        ) && unit.defence() > tileUnit.defence()
                  ),
                  city = this._dependencies.cityRegistry.getByTile(tile);

                if (
                  fortify &&
                  city &&
                  (cityUnitWithLowerDefence ||
                    tileUnits.length <=
                      Math.ceil(
                        this._dependencies.cityGrowthRegistry
                          .getByCity(city)
                          .size() / 5
                      ))
                ) {
                  unit.action(fortify);

                  if (cityUnitWithLowerDefence) {
                    cityUnitWithLowerDefence.activate();
                  }

                  continue;
                }

                if (!target) {
                  // TODO: all the repetition - sort this.
                  if (
                    unit instanceof Fortifiable &&
                    unit.defence().value() > 0 &&
                    this._memory.targets.undefendedCities.length > 0
                  ) {
                    const [targetTile] =
                        this._memory.targets.undefendedCities.sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.undefendedCities.splice(
                        this._memory.targets.undefendedCities.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit, path);
                    }
                  } else if (
                    unit.attack().value() > 0 &&
                    this._memory.targets.citiesToLiberate.length > 0
                  ) {
                    const [targetTile] = this._memory.targets.citiesToLiberate
                        .filter(
                          (tile: Tile): boolean =>
                            unit instanceof Land && tile.isLand()
                        )
                        .sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit as Unit,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.citiesToLiberate.splice(
                        this._memory.targets.citiesToLiberate.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit as Unit, path);
                    }
                  } else if (
                    unit.attack().value() > 0 &&
                    this._memory.targets.enemyUnitsToAttack.length > 0
                  ) {
                    const [targetTile] = this._memory.targets.enemyUnitsToAttack
                        .filter(
                          (tile: Tile): boolean =>
                            (unit instanceof Land && tile.isLand()) ||
                            (unit instanceof Naval && tile.isWater())
                        )
                        .sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit as Unit,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.enemyUnitsToAttack.splice(
                        this._memory.targets.enemyUnitsToAttack.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit as Unit, path);
                    }
                  } else if (
                    unit instanceof Land &&
                    unit.attack().value() > 0 &&
                    this._memory.targets.enemyCitiesToAttack.length > 0
                  ) {
                    const [targetTile] =
                        this._memory.targets.enemyCitiesToAttack.sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.enemyCitiesToAttack.splice(
                        this._memory.targets.enemyCitiesToAttack.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit, path);
                    }
                  } else if (
                    unit instanceof Land &&
                    this._memory.targets.landTilesToExplore.length > 0
                  ) {
                    const [targetTile] =
                        this._memory.targets.landTilesToExplore.sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.landTilesToExplore.splice(
                        this._memory.targets.landTilesToExplore.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit, path);
                    }
                  } else if (
                    unit instanceof Naval &&
                    this._memory.targets.seaTilesToExplore.length > 0
                  ) {
                    const [targetTile] =
                        this._memory.targets.seaTilesToExplore.sort(
                          (a: Tile, b: Tile): number =>
                            a.distanceFrom(unit.tile()) -
                            b.distanceFrom(unit.tile())
                        ),
                      path = Path.for(
                        unit as Naval,
                        unit.tile(),
                        targetTile,
                        this._dependencies.pathFinderRegistry
                      );

                    if (path) {
                      this._memory.targets.seaTilesToExplore.splice(
                        this._memory.targets.seaTilesToExplore.indexOf(
                          targetTile
                        ),
                        1
                      );
                      this._memory.unitPathData.set(unit as Naval, path);
                    }
                  }
                }

                await this.moveUnit(unit as Unit);

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

              this.skipUnit(item);
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

  private skipUnit(unit: Unit): void {
    try {
      this.noOrders(unit);
    } catch (e) {
      // `NoOrders` is only a fallback here, so if it fails too, make sure the unit stops being a mandatory action.
      unit.moves().set(0);
      unit.setActive(false);
    }
  }

  private noOrders(unit: Unit) {
    unit.action(
      new NoOrders(
        unit.tile(),
        unit.tile(),
        unit,
        this._dependencies.ruleRegistry
      )
    );
  }
}

export default SimpleAIClient;
