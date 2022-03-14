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
  Unload,
} from '@civ-clone/civ1-unit/Actions';
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
  Desert,
  Grassland,
  Hills,
  Mountains,
  Plains,
  River,
} from '@civ-clone/civ1-world/Terrains';
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
import { Irrigation, Mine, Road } from '@civ-clone/civ1-world/TileImprovements';
import {
  LeaderRegistry,
  instance as leaderRegistryInstance,
} from '@civ-clone/core-civilization/LeaderRegistry';
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
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import { Monarchy as MonarchyAdvance } from '@civ-clone/civ1-science/Advances';
import { Monarchy as MonarchyGovernment } from '@civ-clone/civ1-government/Governments';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
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
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';

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
  unload?: Unload;
};

export class SimpleAIClient extends AIClient {
  #shouldBuildCity = (tile: Tile): boolean => {
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
      ]) >= 180 &&
      !tile
        .getSurroundingArea(4)
        .filter(
          (tile: Tile): boolean => this.#cityRegistry.getByTile(tile).length > 0
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
      tile
        .getSurroundingArea()
        .some((tile: Tile): boolean =>
          this.#cityRegistry
            .getByTile(tile)
            .some((city: City): boolean => city.player() === this.player())
        ) &&
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
            !this.#cityRegistry.getByTile(tile).length)
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
      tile
        .getSurroundingArea()
        .some((tile: Tile): boolean =>
          this.#cityRegistry
            .getByTile(tile)
            .some((city: City): boolean => city.player() === this.player())
        )
    );
  };

  #shouldRoad = (tile: Tile): boolean => {
    return (
      !this.#tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean => improvement instanceof Road
        ) &&
      tile
        .getSurroundingArea()
        .some((tile: Tile): boolean =>
          this.#cityRegistry
            .getByTile(tile)
            .some((city: City): boolean => city.player() === this.player())
        )
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
  #goodyHutRegistry: GoodyHutRegistry;
  #pathFinderRegistry: PathFinderRegistry;
  #playerGovernmentRegistry: PlayerGovernmentRegistry;
  #playerResearchRegistry: PlayerResearchRegistry;
  #playerTreasuryRegistry: PlayerTreasuryRegistry;
  #playerWorldRegistry: PlayerWorldRegistry;
  #ruleRegistry: RuleRegistry;
  #terrainFeatureRegistry: TerrainFeatureRegistry;
  #tileImprovementRegistry: TileImprovementRegistry;
  #unitImprovementRegistry: UnitImprovementRegistry;
  #unitRegistry: UnitRegistry;

  constructor(
    player: Player,
    cityRegistry: CityRegistry = cityRegistryInstance,
    cityBuildRegistry: CityBuildRegistry = cityBuildRegistryInstance,
    cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
    goodyHutRegistry: GoodyHutRegistry = goodyHutRegistryInstance,
    leaderRegistry: LeaderRegistry = leaderRegistryInstance,
    pathFinderRegistry: PathFinderRegistry = pathFinderRegistryInstance,
    playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
    playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
    playerTreasuryRegistry: PlayerTreasuryRegistry = playerTreasuryRegistryInstance,
    playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance,
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
    unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance,
    unitRegistry: UnitRegistry = unitRegistryInstance
  ) {
    super(player, leaderRegistry);

    this.#cityRegistry = cityRegistry;
    this.#cityBuildRegistry = cityBuildRegistry;
    this.#cityGrowthRegistry = cityGrowthRegistry;
    this.#goodyHutRegistry = goodyHutRegistry;
    this.#pathFinderRegistry = pathFinderRegistry;
    this.#playerGovernmentRegistry = playerGovernmentRegistry;
    this.#playerResearchRegistry = playerResearchRegistry;
    this.#playerTreasuryRegistry = playerTreasuryRegistry;
    this.#playerWorldRegistry = playerWorldRegistry;
    this.#ruleRegistry = ruleRegistry;
    this.#terrainFeatureRegistry = terrainFeatureRegistry;
    this.#unitImprovementRegistry = unitImprovementRegistry;
    this.#tileImprovementRegistry = tileImprovementRegistry;
    this.#unitRegistry = unitRegistry;
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

  moveUnit(unit: Unit): void {
    let loopCheck = 0;

    while (unit.active() && unit.moves().value() >= 0.1) {
      if (loopCheck++ > 1e3) {
        console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
        console.log(
          `${unit.player().civilization().name()} ${unit.constructor.name}`
        );
        console.log(unit.actions());
        console.log(unit.actionsForNeighbours());
        unit.action(new NoOrders(unit.tile(), unit.tile(), unit));

        return;
      }

      const path = this.#unitPathData.get(unit);
      if (path) {
        const target = path.shift(),
          [move] = unit
            .actions(target)
            .filter((action) => action instanceof Move);
        if (move) {
          unit.action(move);

          if (path.length === 0) {
            this.#unitPathData.delete(unit);
          }

          return;
        }

        if (path.length > 0) {
          const newPath = Path.for(unit, unit.tile(), path.end());

          if (newPath) {
            this.#unitPathData.set(unit, newPath);

            // restart the loop
            continue;
          }
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
            Math.floor(Math.random() * 3) - 1
        )
        .map(([tile]: [Tile, number]): Tile => tile);

      if (!target) {
        // TODO: could do something a bit more intelligent here
        unit.action(new NoOrders(unit.tile(), unit.tile(), unit));

        return;
      }

      const actions = unit.actions(target),
        [action] = actions,
        lastMoves = this.#lastUnitMoves.get(unit) || [],
        currentTarget = this.#unitTargetData.get(unit);

      if (!action) {
        // TODO: could do something a bit more intelligent here
        unit.action(new NoOrders(unit.tile(), unit.tile(), unit));

        return;
      }

      if (currentTarget === target) {
        this.#unitTargetData.delete(unit);
      }

      lastMoves.push(target);

      this.#lastUnitMoves.set(unit, lastMoves.slice(-50));

      unit.action(action);
    }

    // If we're here, we still have some moves left, lets clear them up.
    // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
    if (unit.moves().value() > 0) {
      unit.action(new NoOrders(unit.tile(), unit.tile(), unit));
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

    playerWorld.entries().forEach((tile: Tile): void => {
      const [tileCity] = this.#cityRegistry.getByTile(tile),
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

  takeTurn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (error: Error) => any): void => {
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

              reject(
                new Error("SimpleAIClient: Couldn't pick an action to do.")
              );

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

                this.moveUnit(unit);

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
                [city] = this.#cityRegistry.getByTile(tile);

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

              this.moveUnit(unit as Unit);

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
                  available[Math.floor(available.length * Math.random())]
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
          Math.floor(availableFiltered.length * Math.random())
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

      cityBuild.build(wonders[Math.floor(Math.random() * wonders.length)]);
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
          .filter((tile: Tile) =>
            this.#cityRegistry
              .getByTile(tile)
              .some((city) => city.player() === player)
          )
      );
      this.#enemyUnitsToAttack.push(
        ...playerWorld
          .entries()
          .filter((tile: Tile) =>
            this.#unitRegistry
              .getByTile(tile)
              .some((unit) => unit.player() === player)
          )
      );

      return;
    }

    this.#citiesToLiberate.push(city.tile());
  }

  unitDestroyed(unit: Unit, player: Player | null): void {
    const [city] = this.#cityRegistry.getByTile(unit.tile()),
      tileUnits = this.#unitRegistry.getByTile(unit.tile());

    if (city && city.player() === this.player() && tileUnits.length < 2) {
      this.buildItemInCity(city);

      this.#playerTreasuryRegistry.getByPlayer(this.player()).buy(city);
    }
  }
}

export default SimpleAIClient;
