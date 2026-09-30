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
  Desert,
  Grassland,
  Hills,
  Mountains,
  Plains,
  River,
} from '@civ-clone/civ1-world/Terrains';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import { Food, Production, Trade } from '@civ-clone/civ1-world/Yields';
import {
  Fortifiable,
  Land,
  Naval,
  NavalTransport,
  Worker,
} from '@civ-clone/civ1-unit/Types';
import { Game, Oasis } from '@civ-clone/civ1-world/TerrainFeatures';
import {
  GoodyHutRegistry,
  instance as goodyHutRegistryInstance,
} from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import {
  Interaction,
  IInteraction,
} from '@civ-clone/core-diplomacy/Interaction';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import { Irrigation, Mine, Road } from '@civ-clone/civ1-world/TileImprovements';
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
import {
  aircraftRange,
  turnsAloftKey,
} from '@civ-clone/civ1-unit/Rules/Player/turnEnd';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Action from '@civ-clone/core-unit/Action';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import ExchangeKnowledge from '@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import { IAction } from '@civ-clone/core-diplomacy/Negotiation/Action';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import Initiate from '@civ-clone/core-diplomacy/Negotiation/Initiate';
import { Monarchy as MonarchyAdvance } from '@civ-clone/civ1-science/Advances';
import {
  Anarchy as AnarchyGovernment,
  Monarchy as MonarchyGovernment,
} from '@civ-clone/civ1-government/Governments';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  chooseGovernment,
  pendingRevolution,
  revolution,
} from '@civ-clone/civ1-government/lib/revolution';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Negotiation from '@civ-clone/core-diplomacy/Negotiation';
import OfferPeace from '@civ-clone/library-diplomacy/Proposals/OfferPeace';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerTile from '@civ-clone/core-player-world/PlayerTile';
import Resolution from '@civ-clone/core-diplomacy/Proposal/Resolution';
import { Bomber, Settlers } from '@civ-clone/civ1-unit/Units';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';
import assignWorkers from '@civ-clone/civ1-city/lib/assignWorkers';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import { instance as rngInstance } from '@civ-clone/core-random';
import Dependencies from './lib/Dependencies';
import { Memory, createMemory } from './lib/Memory';

declare global {
  interface ChoiceMetaDataMap {
    'negotiation.next-step': IAction;
  }
}

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

const awaitTimeout = (delay: number, reason?: any) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay)
  );

// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, and
//  the map wraps as it does in `Tile#distanceFrom`.
const movesBetween = (from: Tile, to: Tile): number => {
    const map = from.map(),
      onAxis = (delta: number, size: number): number => {
        const direct = Math.abs(delta);

        return Math.min(direct, Math.abs(size - direct));
      };

    return Math.max(
      onAxis(from.x() - to.x(), map.width()),
      onAxis(from.y() - to.y(), map.height())
    );
  },
  hasPlayerCity = (
    tile: Tile,
    player: Player,
    cityRegistry: CityRegistry = cityRegistryInstance
  ): boolean => {
    const city = cityRegistry.getByTile(tile);

    if (city === null) {
      return false;
    }

    return city.player() === player;
  },
  MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;

export class SimpleAIClient extends AIClient {
  private _isACityTile = (tile: Tile) =>
    this._dependencies.cityRegistry
      .getByPlayer(this.player())
      .some((city) => city.tiles().includes(tile));
  private _shouldBuildCity = (tile: Tile): boolean => {
    const isEarth = this._dependencies.engine.option('earth', false),
      hasNoCities =
        this._dependencies.cityRegistry.getByPlayer(this.player()).length === 0;

    if (isEarth && hasNoCities) {
      return true;
    }

    const terrainFeatures =
      this._dependencies.terrainFeatureRegistry.getByTerrain(tile.terrain());

    return (
      (tile.terrain() instanceof Grassland ||
        tile.terrain() instanceof River ||
        tile.terrain() instanceof Plains ||
        terrainFeatures.some(
          (feature: TerrainFeature): boolean => feature instanceof Oasis
        ) ||
        terrainFeatures.some(
          (feature: TerrainFeature): boolean => feature instanceof Game
        )) &&
      tile.getSurroundingArea().score(this.player(), [
        [Food, 4],
        [Production, 2],
        [Trade, 1],
      ]) >= 160 &&
      !tile
        .getSurroundingArea(4)
        .filter(
          (tile: Tile): boolean =>
            this._dependencies.cityRegistry.getByTile(tile) !== null
        ).length
    );
  };

  private _shouldIrrigate = (tile: Tile): boolean => {
    return (
      [Desert, Plains, Grassland, River].some(
        (TerrainType) => tile.terrain() instanceof TerrainType
      ) &&
      // TODO: doing this a lot already, need to make improvements a value object with a helper method
      !this._dependencies.tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean =>
            improvement instanceof Irrigation
        ) &&
      this._isACityTile(tile) &&
      [...tile.getAdjacent(), tile].some(
        (tile: Tile): boolean =>
          tile.terrain() instanceof River ||
          tile.isCoast() ||
          (this._dependencies.tileImprovementRegistry
            .getByTile(tile)
            .some(
              (improvement: TileImprovement): boolean =>
                improvement instanceof Irrigation
            ) &&
            this._dependencies.cityRegistry.getByTile(tile) === null)
      )
    );
  };

  private _shouldMine = (tile: Tile): boolean => {
    return (
      [Hills, Mountains].some(
        (TerrainType: typeof Terrain): boolean =>
          tile.terrain() instanceof TerrainType
      ) &&
      !this._dependencies.tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Mine
        ) &&
      this._isACityTile(tile)
    );
  };

  private _shouldRoad = (tile: Tile): boolean => {
    return (
      !this._dependencies.tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Road
        ) && this._isACityTile(tile)
    );
  };

  private _dependencies: Dependencies;
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

  // How many more moves an aircraft can make before it must be back in one of our `City`s or `Carrier`s, or `null` for
  //  any other `Unit`.
  private aircraftFuel(unit: Unit): number | null {
    const [, range] =
      aircraftRange.find(([UnitType]) => unit instanceof UnitType) ?? [];

    if (range === undefined) {
      return null;
    }

    const turnsAloft =
      this._dependencies.strategyNoteRegistry
        .getByKey<number>(turnsAloftKey(unit))
        ?.value() ?? 0;

    return (
      unit.moves().value() +
      Math.max(0, range - turnsAloft - 1) * unit.movement().value()
    );
  }

  // Whether an aircraft can still get home after taking `action`: moving costs 1 and a `Fighter` pays 1 to attack from
  //  where it is, but a `Bomber`'s attack ends its turn wherever it is.
  private aircraftCanReturn(unit: Unit, action: Action): boolean {
    const fuel = this.aircraftFuel(unit);

    if (fuel === null) {
      return true;
    }

    const moving = action instanceof Move,
      from = moving ? action.to() : unit.tile(),
      remaining =
        !moving && unit instanceof Bomber
          ? fuel - unit.moves().value()
          : fuel - 1;

    return [
      ...this._dependencies.cityRegistry
        .getByPlayer(this.player())
        .map((city: City): Tile => city.tile()),
      ...this.carriersFor(unit).map((carrier: Unit): Tile => carrier.tile()),
    ].some((tile: Tile): boolean => movesBetween(from, tile) <= remaining);
  }

  // Our `Carrier`s that `unit` could land on. One it's already aboard counts even when full: taking off frees its slot.
  private carriersFor(unit: Unit): Unit[] {
    return this._dependencies.unitRegistry
      .getByPlayer(this.player())
      .filter(
        (tileUnit: Unit): boolean =>
          tileUnit instanceof NavalTransport &&
          !tileUnit.destroyed() &&
          (tileUnit.hasCapacity() || tileUnit.cargo().includes(unit)) &&
          tileUnit.canStow(unit)
      );
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

    if (sneakAttack && !this.shouldAttack(sneakAttack.enemy())) {
      return -10;
    }

    const [firstAction] = actions;

    if (firstAction && !this.aircraftCanReturn(unit, firstAction)) {
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
      (foundCity && this._shouldBuildCity(tile)) ||
      (buildMine && this._shouldMine(tile)) ||
      (buildIrrigation && this._shouldIrrigate(tile)) ||
      (buildRoad && this._shouldRoad(tile))
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
            !this.shouldAttack(move.enemy())) ||
          (move && !this.aircraftCanReturn(unit, move as Action))
        ) {
          this._memory.unitPathData.delete(unit);

          continue;
        }

        if (move) {
          unit.action(move as Action);

          if (path.length === 0) {
            this._memory.unitPathData.delete(unit);
          }

          await this.canNegotiate(unit);

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
          !this.shouldAttack(action.enemy()))
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

    await this.canNegotiate(unit);

    // If we're here, we still have some moves left, lets clear them up.
    // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
    if (unit.moves().value() > 0) {
      this.noOrders(unit);
    }
  }

  preProcessTurn(): void {
    this._memory.targets.citiesToLiberate.splice(0);
    this._memory.targets.enemyCitiesToAttack.splice(0);
    this._memory.targets.enemyUnitsToAttack.splice(0);
    this._memory.targets.goodSitesForCities.splice(0);
    this._memory.targets.landTilesToExplore.splice(0);
    this._memory.targets.seaTilesToExplore.splice(0);
    this._memory.targets.undefendedCities.splice(0);
    const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(
      this.player()
    );

    playerWorld.entries().forEach((playerTile: PlayerTile): void => {
      const tile = playerTile.tile(),
        tileCity = this._dependencies.cityRegistry.getByTile(tile),
        tileUnits = this._dependencies.unitRegistry.getBy('tile', tile),
        existingTarget =
          this._memory.targets.undefendedCities.includes(tile) &&
          ![
            ...this._memory.unitTargetData.values(),
            ...[...this._memory.unitPathData.values()].map(
              (path: Path): Tile => path.end()
            ),
          ].includes(tile);

      if (
        tileCity &&
        tileCity.player() === this.player() &&
        !tileUnits.length &&
        !this._memory.targets.undefendedCities.includes(tile) &&
        !existingTarget
      ) {
        this._memory.targets.undefendedCities.push(tile);
      }
      // TODO: when diplomacy exists, check diplomatic status with player
      else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        tileCity.originalPlayer() === this.player()
      ) {
        this._memory.targets.citiesToLiberate.push(tile);
      } else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        !this._memory.targets.enemyCitiesToAttack.includes(tile)
      ) {
        this._memory.targets.enemyCitiesToAttack.push(tile);
      } else if (
        tileUnits.length &&
        tileUnits.some(
          (unit: Unit): boolean => unit.player() !== this.player()
        ) &&
        this._memory.targets.enemyUnitsToAttack.includes(tile)
      ) {
        this._memory.targets.enemyUnitsToAttack.push(tile);
      } else if (
        tile.isLand() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        !this._memory.targets.landTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this._memory.targets.landTilesToExplore.push(tile);
      } else if (
        tile.isWater() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        this._memory.targets.seaTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this._memory.targets.seaTilesToExplore.push(tile);
      }

      if (
        this._shouldBuildCity(tile) &&
        this._memory.targets.goodSitesForCities.includes(tile) &&
        !existingTarget
      ) {
        this._memory.targets.goodSitesForCities.push(tile);
      }
    });

    this._dependencies.cityRegistry
      .getByPlayer(this.player())
      .forEach((city: City): void => {
        const tileUnits = this._dependencies.unitRegistry.getByTile(
          city.tile()
        );

        assignWorkers(
          city,
          this._dependencies.playerWorldRegistry,
          this._dependencies.cityGrowthRegistry,
          this._dependencies.workedTileRegistry
        );

        if (
          !tileUnits.length &&
          !this._memory.targets.undefendedCities.includes(city.tile())
        ) {
          this._memory.targets.undefendedCities.push(city.tile());
        }
      });

    // An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
    this._dependencies.unitRegistry
      .getByPlayer(this.player())
      .flatMap((unit: Unit): Unit[] =>
        unit instanceof NavalTransport && !unit.destroyed() ? unit.cargo() : []
      )
      .filter(
        (unit: Unit): boolean =>
          this.aircraftFuel(unit) !== null && !unit.active()
      )
      .forEach((aircraft: Unit): void => {
        aircraft.setBusy();
        aircraft.setActive();
      });
  }

  async chooseFromList<Name extends keyof ChoiceMetaDataMap>(
    meta: ChoiceMeta<Name>
  ): Promise<DataForChoiceMeta<ChoiceMeta<Name>>> {
    if (meta.key() !== 'negotiation.next-step') {
      return super.chooseFromList(meta);
    }

    const score = (item: Interaction) => {
      const aggressive = this.shouldAttack(
        item.players().filter((player) => player !== this.player())[0]
      );

      if (aggressive) {
        return item instanceof Decline ? 10 : -1;
      }

      return item instanceof ExchangeKnowledge
        ? 30
        : item instanceof OfferPeace
        ? 20
        : item instanceof Accept
        ? 10
        : 0;
    };

    const [topChoice] = meta.choices().sort((actionA, actionB) => {
      return (
        // TODO: This isn't `unknown`...
        score(actionB.value() as unknown as Interaction) -
        score(actionA.value() as unknown as Interaction)
      );
    });

    return topChoice.value();
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

          const [playerGovernment] =
              this._dependencies.playerGovernmentRegistry.filter(
                (playerGovernment) =>
                  playerGovernment.player() === this.player()
              ),
            [playerResearch] = this._dependencies.playerResearchRegistry.filter(
              (playerScience) => playerScience.player() === this.player()
            );
          // Through a revolution, like a human player: Anarchy first, then
          // `ChooseGovernment` below once it's over.
          if (
            playerResearch.completed(MonarchyAdvance) &&
            !playerGovernment.is(MonarchyGovernment, AnarchyGovernment) &&
            pendingRevolution(
              playerGovernment,
              this._dependencies.pendingEffectRegistry
            ) === null
          ) {
            revolution(
              playerGovernment,
              this._dependencies.pendingEffectRegistry,
              this._dependencies.ruleRegistry,
              this._dependencies.turn
            );
          }

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
                this.aircraftFuel(item) !== null &&
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
                  if (foundCity && this._shouldBuildCity(tile)) {
                    unit.action(foundCity);
                  } else if (buildIrrigation && this._shouldIrrigate(tile)) {
                    unit.action(buildIrrigation);
                  } else if (buildMine && this._shouldMine(tile)) {
                    unit.action(buildMine);
                  } else if (buildRoad && this._shouldRoad(tile)) {
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

  private async canNegotiate(unit: Unit): Promise<void> {
    const surroundingPlayers = Array.from(
      new Set(
        unit
          .tile()
          .getNeighbours()
          .flatMap((tile) =>
            this._dependencies.unitRegistry
              .getByTile(tile)
              .map((tileUnit) => tileUnit.player())
              .filter((player) => player !== this.player())
          )
      )
    );

    if (surroundingPlayers.length === 0) {
      return;
    }

    await surroundingPlayers
      .filter((player) =>
        this._dependencies.interactionRegistry
          .getByPlayer(player)
          .filter(
            (interaction) =>
              interaction instanceof Negotiation &&
              interaction.isBetween(player, this.player())
          )
          .every(
            (interaction) =>
              this._dependencies.turn.value() - interaction.when() >
              MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION
          )
      )
      .reduce(
        (promise, player): Promise<any> =>
          promise.then(() => this.handleNegotiation(player)),
        Promise.resolve()
      );
  }

  private async handleNegotiation(player: Player): Promise<Negotiation> {
    const negotiation = new Negotiation(
      this.player(),
      player,
      this._dependencies.ruleRegistry
    );

    negotiation.proceed(
      new Initiate(
        this.player(),
        negotiation,
        this._dependencies.ruleRegistry
      ) as IAction
    );

    while (!negotiation.terminated()) {
      const lastInteraction = negotiation.lastInteraction(),
        players =
          lastInteraction !== null
            ? lastInteraction.for()
            : negotiation.players().slice(1);

      await players.reduce(
        async (promise, player) =>
          promise
            .then(async () => {
              const client =
                  this._dependencies.clientRegistry.getByPlayer(player),
                nextSteps = negotiation.nextSteps(),
                resultPromise = Promise.race([
                  client.chooseFromList(
                    new ChoiceMeta(
                      nextSteps,
                      'negotiation.next-step',
                      negotiation
                    )
                  ),
                  client instanceof AIClient
                    ? awaitTimeout(
                        500,
                        new Error(
                          `Timeout waiting for ${client.player().id()} (${
                            client.player().civilization().sourceClass().name
                          }) - sent ${nextSteps.length} options`
                        )
                      )
                    : new Promise<void>(() => {}),
                ]);

              const interaction = await resultPromise;

              if (!interaction) {
                return;
              }

              negotiation.proceed(interaction);

              if (interaction instanceof Resolution) {
                await interaction.proposal().resolve(interaction);
              }

              // Sleep for a bit to ensure any other async actions have taken place
              await awaitTimeout(20);
            })
            .catch((reason) => console.error(reason)),
        Promise.resolve()
      );

      if (negotiation.terminated()) {
        break;
      }
    }

    this._dependencies.interactionRegistry.register(
      negotiation as IInteraction
    );

    return negotiation;
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

  private shouldAttack(player: Player) {
    // TODO: These scores should be cached, at lest for the duration of the Turn...
    const ourPower = this._dependencies.unitRegistry
        .getByPlayer(this.player())
        .reduce(
          (score, unit) =>
            score + unit.attack().value() + unit.defence().value(),
          0
        ),
      enemyPower = this._dependencies.unitRegistry
        .getByPlayer(player)
        .reduce(
          (score, unit) =>
            score + unit.attack().value() + unit.defence().value(),
          0
        ),
      // TODO: use Traits
      // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
      confidence = 1;

    return ourPower * confidence >= enemyPower;
  }
}

export default SimpleAIClient;
