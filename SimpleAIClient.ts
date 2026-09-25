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
import { Monarchy as MonarchyGovernment } from '@civ-clone/civ1-government/Governments';
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
    this._cityRegistry
      .getByPlayer(this.player())
      .some((city) => city.tiles().includes(tile));
  private _shouldBuildCity = (tile: Tile): boolean => {
    const isEarth = this._engine.option('earth', false),
      hasNoCities = this._cityRegistry.getByPlayer(this.player()).length === 0;

    if (isEarth && hasNoCities) {
      return true;
    }

    const terrainFeatures = this._terrainFeatureRegistry.getByTerrain(
      tile.terrain()
    );

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
          (tile: Tile): boolean => this._cityRegistry.getByTile(tile) !== null
        ).length
    );
  };

  private _shouldIrrigate = (tile: Tile): boolean => {
    return (
      [Desert, Plains, Grassland, River].some(
        (TerrainType) => tile.terrain() instanceof TerrainType
      ) &&
      // TODO: doing this a lot already, need to make improvements a value object with a helper method
      !this._tileImprovementRegistry
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
          (this._tileImprovementRegistry
            .getByTile(tile)
            .some(
              (improvement: TileImprovement): boolean =>
                improvement instanceof Irrigation
            ) &&
            this._cityRegistry.getByTile(tile) === null)
      )
    );
  };

  private _shouldMine = (tile: Tile): boolean => {
    return (
      [Hills, Mountains].some(
        (TerrainType: typeof Terrain): boolean =>
          tile.terrain() instanceof TerrainType
      ) &&
      !this._tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Mine
        ) &&
      this._isACityTile(tile)
    );
  };

  private _shouldRoad = (tile: Tile): boolean => {
    return (
      !this._tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Road
        ) && this._isACityTile(tile)
    );
  };

  private _lastUnitMoves: Map<Unit, Tile[]> = new Map();
  private _unitPathData: Map<Unit, Path> = new Map();
  private _unitTargetData: Map<Unit, Tile> = new Map();

  // TODO: could be `City`/`Unit`s?
  private _citiesToLiberate: Tile[] = [];
  private _enemyCitiesToAttack: Tile[] = [];
  private _enemyUnitsToAttack: Tile[] = [];
  private _goodSitesForCities: Tile[] = [];
  private _landTilesToExplore: Tile[] = [];
  private _seaTilesToExplore: Tile[] = [];
  private _undefendedCities: Tile[] = [];

  private _cityRegistry: CityRegistry;
  private _cityBuildRegistry: CityBuildRegistry;
  private _cityGrowthRegistry: CityGrowthRegistry;
  private _clientRegistry: ClientRegistry;
  private _goodyHutRegistry: GoodyHutRegistry;
  private _interactionRegistry: InteractionRegistry;
  private _pathFinderRegistry: PathFinderRegistry;
  private _playerGovernmentRegistry: PlayerGovernmentRegistry;
  private _playerResearchRegistry: PlayerResearchRegistry;
  private _playerTreasuryRegistry: PlayerTreasuryRegistry;
  private _playerWorldRegistry: PlayerWorldRegistry;
  private _ruleRegistry: RuleRegistry;
  private _strategyNoteRegistry: StrategyNoteRegistry;
  private _terrainFeatureRegistry: TerrainFeatureRegistry;
  private _tileImprovementRegistry: TileImprovementRegistry;
  private _turn: Turn;
  private _unitImprovementRegistry: UnitImprovementRegistry;
  private _unitRegistry: UnitRegistry;
  private _workedTileRegistry: WorkedTileRegistry;
  private _engine: Engine;

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
    workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance
  ) {
    // The generator goes to `core-client`'s `Client`, which holds the one
    // `protected _randomNumberGenerator`. This class declared a second
    // `#randomNumberGenerator` shadowing it, which two `private` fields of the
    // same name cannot express.
    super(player, randomNumberGenerator);

    this._cityRegistry = cityRegistry;
    this._cityBuildRegistry = cityBuildRegistry;
    this._cityGrowthRegistry = cityGrowthRegistry;
    this._clientRegistry = clientRegistry;
    this._goodyHutRegistry = goodyHutRegistry;
    this._interactionRegistry = interactionRegistry;
    this._pathFinderRegistry = pathFinderRegistry;
    this._playerGovernmentRegistry = playerGovernmentRegistry;
    this._playerResearchRegistry = playerResearchRegistry;
    this._playerTreasuryRegistry = playerTreasuryRegistry;
    this._playerWorldRegistry = playerWorldRegistry;
    this._ruleRegistry = ruleRegistry;
    this._strategyNoteRegistry = strategyNoteRegistry;
    this._terrainFeatureRegistry = terrainFeatureRegistry;
    this._turn = turn;
    this._unitImprovementRegistry = unitImprovementRegistry;
    this._tileImprovementRegistry = tileImprovementRegistry;
    this._unitRegistry = unitRegistry;
    this._workedTileRegistry = workedTileRegistry;
    this._engine = engine;
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
      this._strategyNoteRegistry
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
      ...this._cityRegistry
        .getByPlayer(this.player())
        .map((city: City): Tile => city.tile()),
      ...this.carriersFor(unit).map((carrier: Unit): Tile => carrier.tile()),
    ].some((tile: Tile): boolean => movesBetween(from, tile) <= remaining);
  }

  // Our `Carrier`s that `unit` could land on. One it's already aboard counts even when full: taking off frees its slot.
  private carriersFor(unit: Unit): Unit[] {
    return this._unitRegistry
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

    const goodyHut = this._goodyHutRegistry.getByTile(tile);

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

    const tileUnits = this._unitRegistry
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

    const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());

    const discoverableTiles = tile
      .getNeighbours()
      .filter(
        (neighbouringTile: Tile): boolean =>
          !playerWorld.includes(neighbouringTile)
      ).length;

    if (discoverableTiles > 0) {
      score += discoverableTiles * 3;
    }

    const target = this._unitTargetData.get(unit);

    if (
      target instanceof Tile &&
      tile.distanceFrom(target) < unit.tile().distanceFrom(target)
    ) {
      score += 14;
    }

    const lastMoves = this._lastUnitMoves.get(unit) || [];

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

      const path = this._unitPathData.get(unit);

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
          this._unitPathData.delete(unit);

          continue;
        }

        if (move) {
          unit.action(move as Action);

          if (path.length === 0) {
            this._unitPathData.delete(unit);
          }

          await this.canNegotiate(unit);

          continue;
        }

        if (path.length > 0) {
          // restart the loop
          continue;
        }

        this._unitPathData.delete(unit);
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
            Math.floor(this._randomNumberGenerator() * 3) - 1
        )
        .map(([tile]: [Tile, number]): Tile => tile);

      if (!target) {
        // TODO: could do something a bit more intelligent here
        this.noOrders(unit);

        return;
      }

      const actions = unit.actions(target),
        [action] = actions,
        lastMoves = this._lastUnitMoves.get(unit) || [],
        currentTarget = this._unitTargetData.get(unit);

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
        this._unitTargetData.delete(unit);
      }

      lastMoves.push(target);

      this._lastUnitMoves.set(unit, lastMoves.slice(-50));

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
    this._citiesToLiberate.splice(0);
    this._enemyCitiesToAttack.splice(0);
    this._enemyUnitsToAttack.splice(0);
    this._goodSitesForCities.splice(0);
    this._landTilesToExplore.splice(0);
    this._seaTilesToExplore.splice(0);
    this._undefendedCities.splice(0);
    const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());

    playerWorld.entries().forEach((playerTile: PlayerTile): void => {
      const tile = playerTile.tile(),
        tileCity = this._cityRegistry.getByTile(tile),
        tileUnits = this._unitRegistry.getBy('tile', tile),
        existingTarget =
          this._undefendedCities.includes(tile) &&
          ![
            ...this._unitTargetData.values(),
            ...[...this._unitPathData.values()].map(
              (path: Path): Tile => path.end()
            ),
          ].includes(tile);

      if (
        tileCity &&
        tileCity.player() === this.player() &&
        !tileUnits.length &&
        !this._undefendedCities.includes(tile) &&
        !existingTarget
      ) {
        this._undefendedCities.push(tile);
      }
      // TODO: when diplomacy exists, check diplomatic status with player
      else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        tileCity.originalPlayer() === this.player()
      ) {
        this._citiesToLiberate.push(tile);
      } else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        !this._enemyCitiesToAttack.includes(tile)
      ) {
        this._enemyCitiesToAttack.push(tile);
      } else if (
        tileUnits.length &&
        tileUnits.some(
          (unit: Unit): boolean => unit.player() !== this.player()
        ) &&
        this._enemyUnitsToAttack.includes(tile)
      ) {
        this._enemyUnitsToAttack.push(tile);
      } else if (
        tile.isLand() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        !this._landTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this._landTilesToExplore.push(tile);
      } else if (
        tile.isWater() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        this._seaTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this._seaTilesToExplore.push(tile);
      }

      if (
        this._shouldBuildCity(tile) &&
        this._goodSitesForCities.includes(tile) &&
        !existingTarget
      ) {
        this._goodSitesForCities.push(tile);
      }
    });

    this._cityRegistry
      .getByPlayer(this.player())
      .forEach((city: City): void => {
        const tileUnits = this._unitRegistry.getByTile(city.tile());

        assignWorkers(
          city,
          this._playerWorldRegistry,
          this._cityGrowthRegistry,
          this._workedTileRegistry
        );

        if (
          !tileUnits.length &&
          !this._undefendedCities.includes(city.tile())
        ) {
          this._undefendedCities.push(city.tile());
        }
      });

    // An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
    this._unitRegistry
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

          const [playerGovernment] = this._playerGovernmentRegistry.filter(
              (playerGovernment) => playerGovernment.player() === this.player()
            ),
            [playerResearch] = this._playerResearchRegistry.filter(
              (playerScience) => playerScience.player() === this.player()
            );
          if (
            playerResearch.completed(MonarchyAdvance) &&
            !playerGovernment.is(MonarchyGovernment)
          ) {
            playerGovernment.set(new MonarchyGovernment());
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
                  console.log(this._unitImprovementRegistry.getByUnit(item));
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
                this._unitRegistry
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
                  target = this._unitTargetData.get(unit),
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
                  tileUnits = this._unitRegistry.getByTile(tile),
                  lastUnitMoves = this._lastUnitMoves.get(unit);

                if (!lastUnitMoves) {
                  this._lastUnitMoves.set(unit, [unit.tile()]);
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
                            (this._lastUnitMoves.get(unit) || []).includes(tile)
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
                  } else if (!target && this._goodSitesForCities.length) {
                    this._unitTargetData.set(
                      unit,
                      this._goodSitesForCities.shift() as Tile
                    );
                  }

                  await this.moveUnit(unit);

                  continue;
                }

                // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                const [cityUnitWithLowerDefence] = tileUnits.filter(
                    (tileUnit: Unit): boolean =>
                      this._unitImprovementRegistry
                        .getByUnit(tileUnit)
                        .some(
                          (improvement: UnitImprovement): boolean =>
                            improvement instanceof Fortified
                        ) && unit.defence() > tileUnit.defence()
                  ),
                  city = this._cityRegistry.getByTile(tile);

                if (
                  fortify &&
                  city &&
                  (cityUnitWithLowerDefence ||
                    tileUnits.length <=
                      Math.ceil(
                        this._cityGrowthRegistry.getByCity(city).size() / 5
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
                    this._undefendedCities.length > 0
                  ) {
                    const [targetTile] = this._undefendedCities.sort(
                        (a: Tile, b: Tile): number =>
                          a.distanceFrom(unit.tile()) -
                          b.distanceFrom(unit.tile())
                      ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._undefendedCities.splice(
                        this._undefendedCities.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit, path);
                    }
                  } else if (
                    unit.attack().value() > 0 &&
                    this._citiesToLiberate.length > 0
                  ) {
                    const [targetTile] = this._citiesToLiberate
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
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._citiesToLiberate.splice(
                        this._citiesToLiberate.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit as Unit, path);
                    }
                  } else if (
                    unit.attack().value() > 0 &&
                    this._enemyUnitsToAttack.length > 0
                  ) {
                    const [targetTile] = this._enemyUnitsToAttack
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
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._enemyUnitsToAttack.splice(
                        this._enemyUnitsToAttack.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit as Unit, path);
                    }
                  } else if (
                    unit instanceof Land &&
                    unit.attack().value() > 0 &&
                    this._enemyCitiesToAttack.length > 0
                  ) {
                    const [targetTile] = this._enemyCitiesToAttack.sort(
                        (a: Tile, b: Tile): number =>
                          a.distanceFrom(unit.tile()) -
                          b.distanceFrom(unit.tile())
                      ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._enemyCitiesToAttack.splice(
                        this._enemyCitiesToAttack.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit, path);
                    }
                  } else if (
                    unit instanceof Land &&
                    this._landTilesToExplore.length > 0
                  ) {
                    const [targetTile] = this._landTilesToExplore.sort(
                        (a: Tile, b: Tile): number =>
                          a.distanceFrom(unit.tile()) -
                          b.distanceFrom(unit.tile())
                      ),
                      path = Path.for(
                        unit,
                        unit.tile(),
                        targetTile,
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._landTilesToExplore.splice(
                        this._landTilesToExplore.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit, path);
                    }
                  } else if (
                    unit instanceof Naval &&
                    this._seaTilesToExplore.length > 0
                  ) {
                    const [targetTile] = this._seaTilesToExplore.sort(
                        (a: Tile, b: Tile): number =>
                          a.distanceFrom(unit.tile()) -
                          b.distanceFrom(unit.tile())
                      ),
                      path = Path.for(
                        unit as Naval,
                        unit.tile(),
                        targetTile,
                        this._pathFinderRegistry
                      );

                    if (path) {
                      this._seaTilesToExplore.splice(
                        this._seaTilesToExplore.indexOf(targetTile),
                        1
                      );
                      this._unitPathData.set(unit as Naval, path);
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
                        available.length * this._randomNumberGenerator()
                      )
                    ]
                  );
                }

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
      cityBuild = this._cityBuildRegistry.getByCity(city),
      tileUnits = this._unitRegistry.getByTile(tile),
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
          Math.floor(availableFiltered.length * this._randomNumberGenerator())
        ].item(),
      getUnitByYield = (YieldType: typeof Yield) => {
        const [[UnitType]] = availableUnits
          .map((buildItem: BuildItem): [typeof Unit, Yield] => {
            const UnitType = buildItem.item() as unknown as typeof Unit,
              unitYield = new YieldType();

            this._ruleRegistry.process(BaseYield, UnitType, unitYield);

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

    if (this._unitRegistry.getByTile(tile).length < 2 && getDefensiveUnit()) {
      cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

      return;
    }

    const cityGrowth = this._cityGrowthRegistry.getByCity(cityBuild.city());

    // Always Build Cities
    if (
      available.some(
        (buildItem: BuildItem) =>
          buildItem.item() === (Settlers as unknown as typeof Buildable)
      ) &&
      !this._unitRegistry
        .getByCity(cityBuild.city())
        .some((unit: Unit): boolean => unit instanceof Settlers) &&
      // TODO: use expansionist leader trait
      this._unitRegistry
        .getByPlayer(this.player())
        .filter((unit: Unit): boolean => unit instanceof Settlers).length < 3 &&
      cityGrowth.size() > 1
    ) {
      cityBuild.build(Settlers as unknown as typeof Buildable);

      return;
    }

    if (
      this._citiesToLiberate.length > 0 ||
      this._enemyCitiesToAttack.length > 0 ||
      this._enemyUnitsToAttack.length > 4
    ) {
      cityBuild.build(getOffensiveUnit() as unknown as typeof Buildable);

      return;
    }

    if (
      tileUnits.filter((unit) =>
        this._unitImprovementRegistry
          .getByUnit(unit)
          .filter((improvement) => improvement instanceof Fortified)
      ).length < 2 ||
      this._undefendedCities.length
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
        wonders[Math.floor(this._randomNumberGenerator() * wonders.length)]
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

    const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());

    if (destroyed) {
      // REVENGE!
      this._enemyCitiesToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            hasPlayerCity(playerTile.tile(), this.player(), this._cityRegistry)
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );
      this._enemyUnitsToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            this._unitRegistry
              .getByTile(playerTile.tile())
              .some((unit) => unit.player() === player)
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );

      return;
    }

    this._citiesToLiberate.push(city.tile());
  }

  unitDestroyed(unit: Unit, player: Player | null): void {
    const city = this._cityRegistry.getByTile(unit.tile()),
      tileUnits = this._unitRegistry.getByTile(unit.tile());

    if (city && city.player() === this.player() && tileUnits.length < 2) {
      this.buildItemInCity(city);

      this._playerTreasuryRegistry
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
            this._unitRegistry
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
        this._interactionRegistry
          .getByPlayer(player)
          .filter(
            (interaction) =>
              interaction instanceof Negotiation &&
              interaction.isBetween(player, this.player())
          )
          .every(
            (interaction) =>
              this._turn.value() - interaction.when() >
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
      this._ruleRegistry
    );

    negotiation.proceed(
      new Initiate(this.player(), negotiation, this._ruleRegistry) as IAction
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
              const client = this._clientRegistry.getByPlayer(player),
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

    this._interactionRegistry.register(negotiation as IInteraction);

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
      new NoOrders(unit.tile(), unit.tile(), unit, this._ruleRegistry)
    );
  }

  private shouldAttack(player: Player) {
    // TODO: These scores should be cached, at lest for the duration of the Turn...
    const ourPower = this._unitRegistry
        .getByPlayer(this.player())
        .reduce(
          (score, unit) =>
            score + unit.attack().value() + unit.defence().value(),
          0
        ),
      enemyPower = this._unitRegistry
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
