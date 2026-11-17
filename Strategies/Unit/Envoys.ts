// Generic: a Caravan or Freight going to set up a trade route, and a Diplomat or Spy going on a mission, where the
//  ruleset makes either worth it (`lib/Unit/envoys`). Handles nothing in a ruleset that registers neither, Civ1's. A
//  unit walks to a square beside its target city, then carries out its route or mission from there, from a ship too.
//  A Caravan with nothing to go for on its own land waits to be ferried to one of the best cities overseas
//  (`lib/Unit/overseas`).
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import {
  isAgent,
  isEnvoy,
  isTrader,
  knownCitiesOn,
  missionFor,
  missionTarget,
  refuseTarget,
  refusedTarget,
  routeFor,
  routeHome,
  routePartner,
  routeScore,
  tradeTargets,
} from '../../lib/Unit/envoys';
import {
  overseasStateFor,
  planPassenger,
  travel,
} from '../../lib/Unit/overseas';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../../lib/City/explorers';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import { missionChoice } from '@civ-clone/base-unit-agent/lib/mission';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';
import { travelToPathEnd } from '../../lib/Unit/moveUnit';

// How many squares beside a target a unit tries to find a path to, nearest first.
const APPROACHES = 3;

// The ruleset's mission choice for one attempt: asked at most once for each city, as the ruleset's choice may draw.
type Choices = Map<City, string | undefined>;

export class Envoys extends AIStrategy {
  // Where each unit is going: kept until it gets there, or the city is gone or no longer a target.
  #targets: WeakMap<Unit, City> = new WeakMap();

  handles(action: PlayerAction): boolean {
    return (
      isUnitAction(action) &&
      isEnvoy(this.dependencies(), action.value() as Unit)
    );
  }

  // The city `unit` is going for: its target, or, aboard a ship, the city its overseas plan is for.
  #plannedCity(player: Player, unit: Unit): City | null {
    const target = this.#targets.get(unit);

    if (target !== undefined) {
      return target;
    }

    const passenger = overseasStateFor(this.memoryFor(player)).passengers.get(
      unit
    );

    return passenger
      ? this.dependencies().cityRegistry.getByTile(passenger.target)
      : null;
  }

  // Whether a Caravan aboard a ship sets up a route with `city` beside it: its planned city, or one worth a route
  //  (`routeScore` above 0) and scoring at least as well from its home.
  #worthFromShip(player: Player, unit: Unit, city: City): boolean {
    const planned = this.#plannedCity(player, unit);

    if (planned === null) {
      return false;
    }

    if (city === planned) {
      return true;
    }

    const dependencies = this.dependencies(),
      home = routeHome(dependencies, player, unit);

    if (home === null || home === city) {
      return false;
    }

    const score = routeScore(dependencies, player, home, city);

    return (
      score > 0 && score >= routeScore(dependencies, player, home, planned)
    );
  }

  // The route or mission `unit` carries out on a city beside it: its target, or from a ship, for a Caravan, a city worth
  //  as much (`#worthFromShip`). Returns whether it took one; `offeredNothing` is told when it stood beside its target
  //  and nothing there was on offer.
  #actBeside(
    player: Player,
    unit: Unit,
    choices: Choices,
    offeredNothing: (city: City) => void = (): void => {}
  ): boolean {
    const dependencies = this.dependencies(),
      trader = isTrader(unit, dependencies.ruleRegistry),
      atSea = !unit.tile().isLand(),
      target = this.#targets.get(unit) ?? null;

    for (const tile of unit.tile().getNeighbours()) {
      const city = dependencies.cityRegistry.getByTile(tile);

      if (
        city === null ||
        (city !== target &&
          !(trader && atSea && this.#worthFromShip(player, unit, city)))
      ) {
        continue;
      }

      const offered = unit.actions(tile);

      let action: Action | null;

      if (trader) {
        action = routeFor(offered);
      } else {
        if (!choices.has(city)) {
          choices.set(
            city,
            missionChoice(unit, city, dependencies.ruleRegistry)
          );
        }

        action = missionFor(
          dependencies,
          unit,
          city,
          offered,
          (): string | undefined => choices.get(city)
        );
      }

      if (action === null) {
        if (city === target) {
          offeredNothing(city);
        }

        continue;
      }

      this.#targets.delete(unit);
      unit.action(action);

      return true;
    }

    return false;
  }

  // A path for `unit` to a square beside `city` it can stand on: `null` with none, `undefined` when it's beside it now.
  #approach(unit: Unit, city: City): Path | null | undefined {
    if (unit.tile().isNeighbourOf(city.tile())) {
      return undefined;
    }

    const candidates = city
      .tile()
      .getNeighbours()
      .filter(
        (tile: Tile): boolean =>
          tile.isLand() === unit.tile().isLand() &&
          this.dependencies().cityRegistry.getByTile(tile) === null &&
          this.dependencies()
            .unitRegistry.getByTile(tile)
            .every((other: Unit): boolean => other.player() === unit.player())
      )
      .sort(
        (a: Tile, b: Tile): number =>
          a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
      )
      .slice(0, APPROACHES);

    for (const tile of candidates) {
      const path = Path.for(
        unit,
        unit.tile(),
        tile,
        this.dependencies().pathFinderRegistry
      );

      if (path && path.length > 0) {
        return path;
      }
    }

    return null;
  }

  // Whether `city` is still worth `unit` going to: it stands, and for a Diplomat or Spy it's still another player's with
  //  no treaty between them.
  #stillTarget(player: Player, unit: Unit, city: City | undefined): boolean {
    if (city === undefined || city.destroyed()) {
      return false;
    }

    return isAgent(unit, this.dependencies().ruleRegistry)
      ? city.player() !== player &&
          treatyLevel(this.dependencies(), player, city.player()) <
            TreatyLevel.Ceasefire
      : true;
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      dependencies = this.dependencies(),
      memory = this.memoryFor(player),
      choices: Choices = new Map(),
      giveUp = (city: City): void => {
        refuseTarget(dependencies, unit, city);
        this.#targets.delete(unit);
        memory.unitPathData.delete(unit);
      };

    // A target no longer worth going to is dropped before anything is asked of it.
    if (!this.#stillTarget(player, unit, this.#targets.get(unit))) {
      this.#targets.delete(unit);
    }

    if (this.#actBeside(player, unit, choices, giveUp)) {
      return true;
    }

    // At sea, a passenger waits to be put ashore (`TravelOverseas`).
    if (!unit.tile().isLand()) {
      return false;
    }

    if (!this.#stillTarget(player, unit, this.#targets.get(unit))) {
      this.#targets.delete(unit);
      memory.unitPathData.delete(unit);

      const candidates = knownCitiesOn(
          dependencies,
          player,
          continentOf(dependencies.turn.value(), unit.tile())
        ).filter(
          (city: City): boolean => !refusedTarget(dependencies, unit, city)
        ),
        target = isTrader(unit, dependencies.ruleRegistry)
          ? routePartner(dependencies, player, unit, candidates)
          : missionTarget(dependencies, player, unit, candidates);

      if (target === null) {
        // A Caravan with no partner on its own land goes overseas, to one of the best of the cities it knows there.
        if (isTrader(unit, dependencies.ruleRegistry)) {
          const passenger = planPassenger(
            dependencies,
            player,
            memory,
            unit,
            'trader',
            tradeTargets(dependencies, player, unit)
          );

          if (passenger) {
            if (!travel(dependencies, player, memory, unit, passenger)) {
              await travelToPathEnd(
                dependencies,
                player,
                memory,
                this.knowledge(),
                unit
              );
            }

            if (unit.active() && unit.moves().value() > 0) {
              noOrders(dependencies, unit);
            }

            return true;
          }
        }

        return false;
      }

      overseasStateFor(memory).passengers.delete(unit);
      this.#targets.set(unit, target);
    }

    const target = this.#targets.get(unit)!;

    if (!memory.unitPathData.has(unit)) {
      const path = this.#approach(unit, target);

      // Nowhere beside it to reach from here: another target next time.
      if (path === null) {
        giveUp(target);
        noOrders(dependencies, unit);

        return true;
      }

      if (path !== undefined) {
        memory.unitPathData.set(unit, path);
      }
    }

    if (memory.unitPathData.has(unit)) {
      await travelToPathEnd(
        dependencies,
        player,
        memory,
        this.knowledge(),
        unit
      );
    }

    // A step blocked on the way leaves the target as it is: a new path is found next turn.
    if (
      unit.active() &&
      unit.moves().value() > 0 &&
      !this.#actBeside(player, unit, choices, giveUp)
    ) {
      noOrders(dependencies, unit);
    }

    return true;
  }
}

export default Envoys;
