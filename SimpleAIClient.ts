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
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
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
import { Settlers } from '@civ-clone/civ1-unit/Units';
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
  },
  MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;

export class SimpleAIClient extends AIClient {
  #isACityTile = (tile: Tile) =>
    this.#cityRegistry
      .getByPlayer(this.player())
      .some((city) => city.tiles().includes(tile));
  #shouldBuildCity = (tile: Tile): boolean => {
    const isEarth = this.#engine.option('earth', false),
      hasNoCities = this.#cityRegistry.getByPlayer(this.player()).length === 0;

    if (isEarth && hasNoCities) {
      return true;
    }

    const terrainFeatures = this.#terrainFeatureRegistry.getByTerrain(
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
          (tile: Tile): boolean => this.#cityRegistry.getByTile(tile) !== null
        ).length
    );
  };

  #shouldIrrigate = (tile: Tile): boolean => {
    return (
      [Desert, Plains, Grassland, River].some(
        (TerrainType) => tile.terrain() instanceof TerrainType
      ) &&
      // TODO: doing this a lot already, need to make improvements a value object with a helper method
      !this.#tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean =>
            improvement instanceof Irrigation
        ) &&
      this.#isACityTile(tile) &&
      [...tile.getAdjacent(), tile].some(
        (tile: Tile): boolean =>
          tile.terrain() instanceof River ||
          tile.isCoast() ||
          (this.#tileImprovementRegistry
            .getByTile(tile)
            .some(
              (improvement: TileImprovement): boolean =>
                improvement instanceof Irrigation
            ) &&
            this.#cityRegistry.getByTile(tile) === null)
      )
    );
  };

  #shouldMine = (tile: Tile): boolean => {
    return (
      [Hills, Mountains].some(
        (TerrainType: typeof Terrain): boolean =>
          tile.terrain() instanceof TerrainType
      ) &&
      !this.#tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Mine
        ) &&
      this.#isACityTile(tile)
    );
  };

  #shouldRoad = (tile: Tile): boolean => {
    return (
      !this.#tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Road
        ) && this.#isACityTile(tile)
    );
  };

  #lastUnitMoves: Map<Unit, Tile[]> = new Map();
  #unitPathData: Map<Unit, Path> = new Map();
  #unitTargetData: Map<Unit, Tile> = new Map();

  // TODO: could be `City`/`Unit`s?
  #citiesToLiberate: Tile[] = [];
  #enemyCitiesToAttack: Tile[] = [];
  #enemyUnitsToAttack: Tile[] = [];
  #goodSitesForCities: Tile[] = [];
  #landTilesToExplore: Tile[] = [];
  #seaTilesToExplore: Tile[] = [];
  #undefendedCities: Tile[] = [];

  #cityRegistry: CityRegistry;
  #cityBuildRegistry: CityBuildRegistry;
  #cityGrowthRegistry: CityGrowthRegistry;
  #clientRegistry: ClientRegistry;
  #goodyHutRegistry: GoodyHutRegistry;
  #interactionRegistry: InteractionRegistry;
  #pathFinderRegistry: PathFinderRegistry;
  #playerGovernmentRegistry: PlayerGovernmentRegistry;
  #playerResearchRegistry: PlayerResearchRegistry;
  #playerTreasuryRegistry: PlayerTreasuryRegistry;
  #playerWorldRegistry: PlayerWorldRegistry;
  #ruleRegistry: RuleRegistry;
  #terrainFeatureRegistry: TerrainFeatureRegistry;
  #tileImprovementRegistry: TileImprovementRegistry;
  #turn: Turn;
  #unitImprovementRegistry: UnitImprovementRegistry;
  #unitRegistry: UnitRegistry;
  #engine: Engine;
  #randomNumberGenerator: () => number;

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
    randomNumberGenerator: () => number = () => Math.random()
  ) {
    super(player);

    this.#cityRegistry = cityRegistry;
    this.#cityBuildRegistry = cityBuildRegistry;
    this.#cityGrowthRegistry = cityGrowthRegistry;
    this.#clientRegistry = clientRegistry;
    this.#goodyHutRegistry = goodyHutRegistry;
    this.#interactionRegistry = interactionRegistry;
    this.#pathFinderRegistry = pathFinderRegistry;
    this.#playerGovernmentRegistry = playerGovernmentRegistry;
    this.#playerResearchRegistry = playerResearchRegistry;
    this.#playerTreasuryRegistry = playerTreasuryRegistry;
    this.#playerWorldRegistry = playerWorldRegistry;
    this.#ruleRegistry = ruleRegistry;
    this.#terrainFeatureRegistry = terrainFeatureRegistry;
    this.#turn = turn;
    this.#unitImprovementRegistry = unitImprovementRegistry;
    this.#tileImprovementRegistry = tileImprovementRegistry;
    this.#unitRegistry = unitRegistry;
    this.#engine = engine;
    this.#randomNumberGenerator = randomNumberGenerator;
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

    const goodyHut = this.#goodyHutRegistry.getByTile(tile);

    if (goodyHut !== null) {
      score += 60;
    }

    if (
      (foundCity && this.#shouldBuildCity(tile)) ||
      (buildMine && this.#shouldMine(tile)) ||
      (buildIrrigation && this.#shouldIrrigate(tile)) ||
      (buildRoad && this.#shouldRoad(tile))
    ) {
      score += 24;
    }

    const tileUnits = this.#unitRegistry
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

    const playerWorld = this.#playerWorldRegistry.getByPlayer(this.player());

    const discoverableTiles = tile
      .getNeighbours()
      .filter(
        (neighbouringTile: Tile): boolean =>
          !playerWorld.includes(neighbouringTile)
      ).length;

    if (discoverableTiles > 0) {
      score += discoverableTiles * 3;
    }

    const target = this.#unitTargetData.get(unit);

    if (
      target instanceof Tile &&
      tile.distanceFrom(target) < unit.tile().distanceFrom(target)
    ) {
      score += 14;
    }

    const lastMoves = this.#lastUnitMoves.get(unit) || [];

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

      const path = this.#unitPathData.get(unit);

      if (path) {
        const target = path.shift(),
          [move] = unit
            .actions(target)
            .filter((action) => action instanceof Move);

        if (
          move instanceof SneakCaptureCity &&
          !this.shouldAttack(move.enemy())
        ) {
          this.#unitPathData.delete(unit);

          continue;
        }

        if (move) {
          unit.action(move as Action);

          if (path.length === 0) {
            this.#unitPathData.delete(unit);
          }

          await this.canNegotiate(unit);

          continue;
        }

        if (path.length > 0) {
          // restart the loop
          continue;
        }

        this.#unitPathData.delete(unit);
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
            Math.floor(this.#randomNumberGenerator() * 3) - 1
        )
        .map(([tile]: [Tile, number]): Tile => tile);

      if (!target) {
        // TODO: could do something a bit more intelligent here
        this.noOrders(unit);

        return;
      }

      const actions = unit.actions(target),
        [action] = actions,
        lastMoves = this.#lastUnitMoves.get(unit) || [],
        currentTarget = this.#unitTargetData.get(unit);

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
        this.#unitTargetData.delete(unit);
      }

      lastMoves.push(target);

      this.#lastUnitMoves.set(unit, lastMoves.slice(-50));

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
    this.#citiesToLiberate.splice(0);
    this.#enemyCitiesToAttack.splice(0);
    this.#enemyUnitsToAttack.splice(0);
    this.#goodSitesForCities.splice(0);
    this.#landTilesToExplore.splice(0);
    this.#seaTilesToExplore.splice(0);
    this.#undefendedCities.splice(0);
    const playerWorld = this.#playerWorldRegistry.getByPlayer(this.player());

    playerWorld.entries().forEach((playerTile: PlayerTile): void => {
      const tile = playerTile.tile(),
        tileCity = this.#cityRegistry.getByTile(tile),
        tileUnits = this.#unitRegistry.getBy('tile', tile),
        existingTarget =
          this.#undefendedCities.includes(tile) &&
          ![
            ...this.#unitTargetData.values(),
            ...[...this.#unitPathData.values()].map(
              (path: Path): Tile => path.end()
            ),
          ].includes(tile);

      if (
        tileCity &&
        tileCity.player() === this.player() &&
        !tileUnits.length &&
        !this.#undefendedCities.includes(tile) &&
        !existingTarget
      ) {
        this.#undefendedCities.push(tile);
      }
      // TODO: when diplomacy exists, check diplomatic status with player
      else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        tileCity.originalPlayer() === this.player()
      ) {
        this.#citiesToLiberate.push(tile);
      } else if (
        tileCity &&
        tileCity.player() !== this.player() &&
        !this.#enemyCitiesToAttack.includes(tile)
      ) {
        this.#enemyCitiesToAttack.push(tile);
      } else if (
        tileUnits.length &&
        tileUnits.some(
          (unit: Unit): boolean => unit.player() !== this.player()
        ) &&
        this.#enemyUnitsToAttack.includes(tile)
      ) {
        this.#enemyUnitsToAttack.push(tile);
      } else if (
        tile.isLand() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        !this.#landTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this.#landTilesToExplore.push(tile);
      } else if (
        tile.isWater() &&
        tile
          .getNeighbours()
          .some((tile: Tile): boolean => !playerWorld.includes(tile)) &&
        this.#seaTilesToExplore.includes(tile) &&
        !existingTarget
      ) {
        this.#seaTilesToExplore.push(tile);
      }

      if (
        this.#shouldBuildCity(tile) &&
        this.#goodSitesForCities.includes(tile) &&
        !existingTarget
      ) {
        this.#goodSitesForCities.push(tile);
      }
    });

    this.#cityRegistry
      .getByPlayer(this.player())
      .forEach((city: City): void => {
        const tileUnits = this.#unitRegistry.getByTile(city.tile());

        assignWorkers(
          city,
          this.#playerWorldRegistry,
          this.#cityGrowthRegistry
        );

        if (
          !tileUnits.length &&
          !this.#undefendedCities.includes(city.tile())
        ) {
          this.#undefendedCities.push(city.tile());
        }
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

          const [playerGovernment] = this.#playerGovernmentRegistry.filter(
              (playerGovernment) => playerGovernment.player() === this.player()
            ),
            [playerResearch] = this.#playerResearchRegistry.filter(
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
                console.log(this.#unitImprovementRegistry.getByUnit(item));
              }

              // Do nothing, but shout about it
              this.noOrders(item);

              console.error("SimpleAIClient: Couldn't pick an action to do.");

              break;
            }

            if (item instanceof Unit) {
              const unit = item,
                tile = unit.tile(),
                target = this.#unitTargetData.get(unit),
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
                tileUnits = this.#unitRegistry.getByTile(tile),
                lastUnitMoves = this.#lastUnitMoves.get(unit);

              if (!lastUnitMoves) {
                this.#lastUnitMoves.set(unit, [unit.tile()]);
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
                          (this.#lastUnitMoves.get(unit) || []).includes(tile)
                        )
                  )
              ) {
                unit.action(unload);

                unit.setWaiting();

                // skip out to allow the unloaded units to be moved.
                continue;
              }

              if (unit instanceof Worker) {
                if (foundCity && this.#shouldBuildCity(tile)) {
                  unit.action(foundCity);
                } else if (buildIrrigation && this.#shouldIrrigate(tile)) {
                  unit.action(buildIrrigation);
                } else if (buildMine && this.#shouldMine(tile)) {
                  unit.action(buildMine);
                } else if (buildRoad && this.#shouldRoad(tile)) {
                  unit.action(buildRoad);
                } else if (!target && this.#goodSitesForCities.length) {
                  this.#unitTargetData.set(
                    unit,
                    this.#goodSitesForCities.shift() as Tile
                  );
                }

                await this.moveUnit(unit);

                continue;
              }

              // TODO: check for defense values and activate weaker for disband/upgrade/scouting
              const [cityUnitWithLowerDefence] = tileUnits.filter(
                  (tileUnit: Unit): boolean =>
                    this.#unitImprovementRegistry
                      .getByUnit(tileUnit)
                      .some(
                        (improvement: UnitImprovement): boolean =>
                          improvement instanceof Fortified
                      ) && unit.defence() > tileUnit.defence()
                ),
                city = this.#cityRegistry.getByTile(tile);

              if (
                fortify &&
                city &&
                (cityUnitWithLowerDefence ||
                  tileUnits.length <=
                    Math.ceil(
                      this.#cityGrowthRegistry.getByCity(city).size() / 5
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
                  this.#undefendedCities.length > 0
                ) {
                  const [targetTile] = this.#undefendedCities.sort(
                      (a: Tile, b: Tile): number =>
                        a.distanceFrom(unit.tile()) -
                        b.distanceFrom(unit.tile())
                    ),
                    path = Path.for(
                      unit,
                      unit.tile(),
                      targetTile,
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#undefendedCities.splice(
                      this.#undefendedCities.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit, path);
                  }
                } else if (
                  unit.attack().value() > 0 &&
                  this.#citiesToLiberate.length > 0
                ) {
                  const [targetTile] = this.#citiesToLiberate
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
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#citiesToLiberate.splice(
                      this.#citiesToLiberate.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit as Unit, path);
                  }
                } else if (
                  unit.attack().value() > 0 &&
                  this.#enemyUnitsToAttack.length > 0
                ) {
                  const [targetTile] = this.#enemyUnitsToAttack
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
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#enemyUnitsToAttack.splice(
                      this.#enemyUnitsToAttack.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit as Unit, path);
                  }
                } else if (
                  unit instanceof Land &&
                  unit.attack().value() > 0 &&
                  this.#enemyCitiesToAttack.length > 0
                ) {
                  const [targetTile] = this.#enemyCitiesToAttack.sort(
                      (a: Tile, b: Tile): number =>
                        a.distanceFrom(unit.tile()) -
                        b.distanceFrom(unit.tile())
                    ),
                    path = Path.for(
                      unit,
                      unit.tile(),
                      targetTile,
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#enemyCitiesToAttack.splice(
                      this.#enemyCitiesToAttack.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit, path);
                  }
                } else if (
                  unit instanceof Land &&
                  this.#landTilesToExplore.length > 0
                ) {
                  const [targetTile] = this.#landTilesToExplore.sort(
                      (a: Tile, b: Tile): number =>
                        a.distanceFrom(unit.tile()) -
                        b.distanceFrom(unit.tile())
                    ),
                    path = Path.for(
                      unit,
                      unit.tile(),
                      targetTile,
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#landTilesToExplore.splice(
                      this.#landTilesToExplore.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit, path);
                  }
                } else if (
                  unit instanceof Naval &&
                  this.#seaTilesToExplore.length > 0
                ) {
                  const [targetTile] = this.#seaTilesToExplore.sort(
                      (a: Tile, b: Tile): number =>
                        a.distanceFrom(unit.tile()) -
                        b.distanceFrom(unit.tile())
                    ),
                    path = Path.for(
                      unit as Naval,
                      unit.tile(),
                      targetTile,
                      this.#pathFinderRegistry
                    );

                  if (path) {
                    this.#seaTilesToExplore.splice(
                      this.#seaTilesToExplore.indexOf(targetTile),
                      1
                    );
                    this.#unitPathData.set(unit as Naval, path);
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
                    Math.floor(available.length * this.#randomNumberGenerator())
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
      cityBuild = this.#cityBuildRegistry.getByCity(city),
      tileUnits = this.#unitRegistry.getByTile(tile),
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
          Math.floor(availableFiltered.length * this.#randomNumberGenerator())
        ].item(),
      getUnitByYield = (YieldType: typeof Yield) => {
        const [[UnitType]] = availableUnits
          .map((buildItem: BuildItem): [typeof Unit, Yield] => {
            const UnitType = buildItem.item() as unknown as typeof Unit,
              unitYield = new YieldType();

            this.#ruleRegistry.process(BaseYield, UnitType, unitYield);

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

    if (this.#unitRegistry.getByTile(tile).length < 2 && getDefensiveUnit()) {
      cityBuild.build(getDefensiveUnit() as unknown as typeof Buildable);

      return;
    }

    const cityGrowth = this.#cityGrowthRegistry.getByCity(cityBuild.city());

    // Always Build Cities
    if (
      available.some(
        (buildItem: BuildItem) =>
          buildItem.item() === (Settlers as unknown as typeof Buildable)
      ) &&
      !this.#unitRegistry
        .getByCity(cityBuild.city())
        .some((unit: Unit): boolean => unit instanceof Settlers) &&
      // TODO: use expansionist leader trait
      this.#unitRegistry
        .getByPlayer(this.player())
        .filter((unit: Unit): boolean => unit instanceof Settlers).length < 3 &&
      cityGrowth.size() > 1
    ) {
      cityBuild.build(Settlers as unknown as typeof Buildable);

      return;
    }

    if (
      this.#citiesToLiberate.length > 0 ||
      this.#enemyCitiesToAttack.length > 0 ||
      this.#enemyUnitsToAttack.length > 4
    ) {
      cityBuild.build(getOffensiveUnit() as unknown as typeof Buildable);

      return;
    }

    if (
      tileUnits.filter((unit) =>
        this.#unitImprovementRegistry
          .getByUnit(unit)
          .filter((improvement) => improvement instanceof Fortified)
      ).length < 2 ||
      this.#undefendedCities.length
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
        wonders[Math.floor(this.#randomNumberGenerator() * wonders.length)]
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

    const playerWorld = this.#playerWorldRegistry.getByPlayer(this.player());

    if (destroyed) {
      // REVENGE!
      this.#enemyCitiesToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            hasPlayerCity(playerTile.tile(), this.player(), this.#cityRegistry)
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );
      this.#enemyUnitsToAttack.push(
        ...playerWorld
          .entries()
          .filter((playerTile: PlayerTile) =>
            this.#unitRegistry
              .getByTile(playerTile.tile())
              .some((unit) => unit.player() === player)
          )
          .map((playerTile: PlayerTile) => playerTile.tile())
      );

      return;
    }

    this.#citiesToLiberate.push(city.tile());
  }

  unitDestroyed(unit: Unit, player: Player | null): void {
    const city = this.#cityRegistry.getByTile(unit.tile()),
      tileUnits = this.#unitRegistry.getByTile(unit.tile());

    if (city && city.player() === this.player() && tileUnits.length < 2) {
      this.buildItemInCity(city);

      this.#playerTreasuryRegistry
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
            this.#unitRegistry
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
        this.#interactionRegistry
          .getByPlayer(player)
          .filter(
            (interaction) =>
              interaction instanceof Negotiation &&
              interaction.isBetween(player, this.player())
          )
          .every(
            (interaction) =>
              this.#turn.value() - interaction.when() >
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
      this.#ruleRegistry
    );

    negotiation.proceed(
      new Initiate(this.player(), negotiation, this.#ruleRegistry) as IAction
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
              const client = this.#clientRegistry.getByPlayer(player),
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

    this.#interactionRegistry.register(negotiation as IInteraction);

    return negotiation;
  }

  private noOrders(unit: Unit) {
    unit.action(
      new NoOrders(unit.tile(), unit.tile(), unit, this.#ruleRegistry)
    );
  }

  private shouldAttack(player: Player) {
    // TODO: These scores should be cached, at lest for the duration of the Turn...
    const ourPower = this.#unitRegistry
        .getByPlayer(this.player())
        .reduce(
          (score, unit) =>
            score + unit.attack().value() + unit.defence().value(),
          0
        ),
      enemyPower = this.#unitRegistry
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
