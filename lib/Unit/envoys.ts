// Generic: Caravans and Diplomats sent to other cities on purpose, where the ruleset makes that worth it: a Caravan to set
//  up a trade route where the ruleset says how many routes a city holds (base-city-trade-route's `TradeRouteLimit`,
//  which Civ2 registers), and a Diplomat or Spy on the mission the ruleset chooses for a computer player
//  (base-unit-agent's `MissionChoice`, which Civ2 answers with the original's `spy_city_mission_ai_choice`). Civ1
//  registers neither, so its Caravans and Diplomats do what they always have. From OpenCiv2's `ai_orders_caravan` and
//  `ai_orders_diplomat` (`src/auto/ai.cpp`) and `city_choose_production_try_special_unit` (`city_production.cpp`).
import {
  EstablishEmbassy,
  EstablishTradeRoute,
  IndustrialSabotage,
  InciteRevolt,
  InvestigateCity,
  StealTechnology,
} from '@civ-clone/library-unit/Actions';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import Action from '@civ-clone/core-unit/Action';
import AdvanceStolen from '@civ-clone/base-unit-action-steal-technology/AdvanceStolen';
import City from '@civ-clone/core-city/City';
import Covert from '@civ-clone/base-unit-trait-covert/Covert';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import DiplomaticMissions from '@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions';
import MissionChoice from '@civ-clone/base-unit-agent/Rules/MissionChoice';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import { Trade } from '@civ-clone/library-city/Yields';
import TradeMissions from '@civ-clone/base-unit-trait-trade-missions/TradeMissions';
import { instance as tradeRouteRegistryInstance } from '@civ-clone/core-city/TradeRouteRegistry';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import { TradeRouteRegistry } from '@civ-clone/core-city/TradeRouteRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import baseTrade from '@civ-clone/base-city-trade-route/lib/baseTrade';
import { continentOf } from '../City/explorers';
import { hasTrait } from '@civ-clone/core-unit/traits';
import { missionChoice } from '@civ-clone/base-unit-agent/lib/mission';
import tradeRouteLimit from '@civ-clone/base-city-trade-route/lib/tradeRouteLimit';

// Whether the ruleset makes trade routes something to build Caravans for: it says how many a city holds.
export const tradeRoutesMatter = (ruleRegistry: RuleRegistry): boolean =>
  ruleRegistry.get(TradeRouteLimit).length > 0;

// Whether the ruleset chooses a computer player's Diplomat and Spy missions.
export const missionsChosen = (ruleRegistry: RuleRegistry): boolean =>
  ruleRegistry.get(MissionChoice).length > 0;

// A unit, or unit type, that sets up trade routes (a Caravan or Freight).
export const isTrader = (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
): boolean => hasTrait(unit, TradeMissions, ruleRegistry);

// A unit, or unit type, that carries out missions in other players' cities (a Diplomat or Spy).
export const isAgent = (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
): boolean => hasTrait(unit, DiplomaticMissions, ruleRegistry);

// Whether `unit` is one this module sends: a trader where routes matter, an agent where missions are chosen.
//  The rules' presence is asked first: it's the cheaper test, and the only one in a ruleset with neither (Civ1).
export const isEnvoy = (dependencies: Dependencies, unit: Unit): boolean =>
  (tradeRoutesMatter(dependencies.ruleRegistry) &&
    isTrader(unit, dependencies.ruleRegistry)) ||
  (missionsChosen(dependencies.ruleRegistry) &&
    isAgent(unit, dependencies.ruleRegistry));

// Each city's base trade (base-city-trade-route's `baseTrade`, which works out the city's yields), kept for the turn it
//  was read in and the player that held the city then: a Caravan's choice compares many cities, and a city's yields are
//  among the dearest things to work out. Every computer player shares it, so a city's value can be one read earlier in
//  the turn, before its owner worked it: close enough to rank route partners by.
const baseTrades = new WeakMap<
  City,
  { turn: number; owner: Player; value: number }
>();

export const baseTradeOf = (dependencies: Dependencies, city: City): number => {
  const turn = dependencies.turn.value(),
    known = baseTrades.get(city);

  if (
    known !== undefined &&
    known.turn === turn &&
    known.owner === city.player()
  ) {
    return known.value;
  }

  const value = baseTrade(city, Trade);

  baseTrades.set(city, { turn, owner: city.player(), value });

  return value;
};

// The city `unit` belongs to, if it still stands.
const homeOf = (unit: Unit): City | null => {
  const home = unit.city();

  return home !== null && !home.destroyed() ? home : null;
};

// Whether `action` would break a treaty (it has an `enemy()`, as `moveUnit`'s `breaksTreaty` tells).
const breaksTreaty = (action: unknown): boolean =>
  typeof (action as { enemy?: unknown } | undefined)?.enemy === 'function';

// The cities `player` knows of on `land`, standing (the registry lists destroyed cities too).
export const knownCitiesOn = (
  dependencies: Dependencies,
  player: Player,
  land: Set<Tile>
): City[] => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  return dependencies.cityRegistry
    .entries()
    .filter(
      (city: City): boolean =>
        !city.destroyed() &&
        land.has(city.tile()) &&
        playerWorld.includes(city.tile())
    );
};

// Whether anyone has stolen an advance from `city` (`CITYF_TECH_STOLEN`).
export const robbed = (dependencies: Dependencies, city: City): boolean =>
  dependencies.interactionRegistry
    .entries()
    .some(
      (interaction): boolean =>
        interaction instanceof AdvanceStolen &&
        (interaction as unknown as AdvanceStolen).city() === city
    );

// What a route from `home` to `city` is worth to a Caravan, as `ai_orders_caravan` (`ai.cpp:3122-3166`) scores it:
//  both cities' base trade times the distance between them, over 24, halved for one of the player's own cities and
//  again where `home` already has a route there, less a fifth for each route `city` holds. The original weighs a foreign
//  city by its owner's attitude; the client can't read one, so it counts as neutral.
export const routeScore = (
  dependencies: Dependencies,
  player: Player,
  home: City,
  city: City,
  tradeRouteRegistry: TradeRouteRegistry = tradeRouteRegistryInstance,
  homeTrade: number = baseTradeOf(dependencies, home)
): number => {
  let score =
    ((homeTrade + baseTradeOf(dependencies, city)) *
      home.tile().distanceFrom(city.tile())) /
    24;

  if (city.player() === player) {
    score /= 2;
  }

  if (
    tradeRouteRegistry
      .getByCity(home)
      .some((route): boolean => route.to() === city)
  ) {
    score /= 2;
  }

  return ((5 - tradeRouteRegistry.getByCity(city).length) * score) / 5;
};

// The city a Caravan's route starts from: its home, or with none its player's nearest city, as the ruleset's route
//  rows have it.
export const routeHome = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): City | null =>
  homeOf(unit) ??
  [...dependencies.cityRegistry.getByPlayer(player)].sort(
    (a: City, b: City): number =>
      a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile())
  )[0] ??
  null;

// `candidates` worth a route from `unit`'s home (`routeScore` above 0), best first, never the home itself.
export const rankPartners = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates: City[]
): [City, number][] => {
  const home = routeHome(dependencies, player, unit);

  if (home === null) {
    return [];
  }

  const homeTrade = baseTradeOf(dependencies, home);

  return candidates
    .filter((city: City): boolean => city !== home)
    .map((city: City): [City, number] => [
      city,
      routeScore(
        dependencies,
        player,
        home,
        city,
        tradeRouteRegistryInstance,
        homeTrade
      ),
    ])
    .filter(([, score]): boolean => score > 0)
    .sort(([, a], [, b]): number => b - a);
};

// The city a Caravan sets off for: the best route partner on its own land (`routeScore`), never its home city, or
//  `null`. A Caravan with no home has its player's nearest city as home, as the ruleset's route rows do.
export const routePartner = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates: City[] = knownCitiesOn(
    dependencies,
    player,
    continentOf(dependencies.turn.value(), unit.tile())
  )
): City | null => {
  const [best] = rankPartners(dependencies, player, unit, candidates);

  return best ? best[0] : null;
};

// The city a Diplomat or Spy sets off for, as `ai_orders_diplomat` (`ai.cpp:3216-3290`) chooses for a computer player:
//  another player's city on its own land with no treaty between them (a computer player's agent leaves a treaty
//  partner's cities alone), worth more at war, less already robbed, and the nearer the better. `null` with none.
export const missionTarget = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates: City[] = knownCitiesOn(
    dependencies,
    player,
    continentOf(dependencies.turn.value(), unit.tile())
  )
): City | null => {
  const [best] = candidates
    .filter((city: City): boolean => {
      const owner = city.player();

      return (
        owner !== player &&
        treatyLevel(dependencies, player, owner) < TreatyLevel.Ceasefire
      );
    })
    .map((city: City): [City, number] => {
      const level = treatyLevel(dependencies, player, city.player());

      let score =
        (100 + (level === TreatyLevel.War ? 100 : 50)) /
        (unit.tile().distanceFrom(city.tile()) + 1);

      if (robbed(dependencies, city)) {
        score /= 2;
      }

      return [city, score];
    })
    .sort(([, a], [, b]): number => b - a);

  return best ? best[0] : null;
};

// The mission rows by the names the ruleset's `MissionChoice` gives them. Matched by exact class: the treaty-breaking
//  forms (`SneakStealTechnology` and the like) extend these and are never taken.
const MISSIONS: { [name: string]: Function } = {
  'establish-embassy': EstablishEmbassy,
  'incite-revolt': InciteRevolt,
  'industrial-sabotage': IndustrialSabotage,
  'investigate-city': InvestigateCity,
  'poison-water': PoisonWater,
  'steal-technology': StealTechnology,
};

const exactly = (actions: Action[], name: string): Action | undefined =>
  actions.find(
    (action: Action): boolean =>
      action.constructor === MISSIONS[name] && !breaksTreaty(action)
  );

// The mission `unit` carries out on `city` of the `offered` actions: the one the ruleset chooses (`MissionChoice`, asked
//  once here), or, when that one isn't offered, what the original falls back on when a mission can't be carried out:
//  a theft with nothing to take becomes a sabotage, or an embassy under a treaty (`unit_spy.cpp:432-437`); an incited
//  revolt the player can't pay for becomes a theft (`:851`); an embassy there already is becomes an investigation
//  (`:290`). `null` when there's nothing to do.
export const missionFor = (
  dependencies: Dependencies,
  unit: Unit,
  city: City,
  offered: Action[],
  // The ruleset's choice, asked here unless the caller already has it (`undefined` is an answer: no choice).
  choose: () => string | undefined = (): string | undefined =>
    missionChoice(unit, city, dependencies.ruleRegistry)
): Action | null => {
  const chosen = choose();

  if (chosen === undefined) {
    return null;
  }

  const underTreaty =
      treatyLevel(dependencies, unit.player(), city.player()) >=
      TreatyLevel.Ceasefire,
    fallbacks: { [name: string]: string[] } = {
      'steal-technology': [
        underTreaty ? 'establish-embassy' : 'industrial-sabotage',
      ],
      'incite-revolt': [
        'steal-technology',
        underTreaty ? 'establish-embassy' : 'industrial-sabotage',
      ],
      'poison-water': [
        'steal-technology',
        underTreaty ? 'establish-embassy' : 'industrial-sabotage',
      ],
      'establish-embassy': ['investigate-city'],
    },
    [action] = [chosen, ...(fallbacks[chosen] ?? [])]
      .map((name: string): Action | undefined => exactly(offered, name))
      .filter((action): action is Action => action !== undefined);

  return action ?? null;
};

// The route `unit` sets up on `city` of the `offered` actions: the ruleset's `EstablishTradeRoute`, never its help with
//  a Wonder (Classic: a computer player's Caravan always sets up a route, `unit_caravan_enter_city`). `null` with none.
export const routeFor = (offered: Action[]): Action | null =>
  offered.find(
    (action: Action): boolean =>
      action.constructor === EstablishTradeRoute && !breaksTreaty(action)
  ) ?? null;

// Whether `type` is a Spy rather than a Diplomat.
export const isCovert = (
  type: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
): boolean => hasTrait(type, Covert, ruleRegistry);

// What a city's production wants of traders and agents, as `city_choose_production_try_special_unit` decides:
//  - a Caravan where routes matter, from a city with a route slot to spare and base trade to share, and no Caravan of its
//    own out or on order (`CITYF_HAD_CARAVAN`);
//  - a Diplomat or Spy where missions are chosen, while none is on order, the player has fewer agents than its cities
//    on that land, and another player it has no treaty with has a city there (`city_choose_production_diplomat_score`).
export const wantsTrader = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  ownTraders: number,
  tradeRouteRegistry: TradeRouteRegistry = tradeRouteRegistryInstance
): boolean =>
  tradeRoutesMatter(dependencies.ruleRegistry) &&
  ownTraders === 0 &&
  tradeRouteRegistry.getByCity(city).length <
    tradeRouteLimit(city, dependencies.ruleRegistry) &&
  baseTradeOf(dependencies, city) > 0;

export const wantsAgent = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  agents: number,
  agentsOnOrder: number
): boolean => {
  if (!missionsChosen(dependencies.ruleRegistry) || agentsOnOrder > 0) {
    return false;
  }

  const land = continentOf(dependencies.turn.value(), city.tile()),
    cities = dependencies.cityRegistry
      .entries()
      .filter(
        (other: City): boolean => !other.destroyed() && land.has(other.tile())
      );

  return (
    agents <
      cities.filter((other: City): boolean => other.player() === player)
        .length &&
    cities.some(
      (other: City): boolean =>
        other.player() !== player &&
        treatyLevel(dependencies, player, other.player()) <
          TreatyLevel.Ceasefire
    )
  );
};

// How long a unit leaves alone a city it found nothing to do at, or no way to stand beside, before trying it again.
export const REFUSAL_TURNS = 10;

// The cities each unit has given up on, with the turn it did.
const refusals = new WeakMap<Unit, Map<City, number>>();

export const refuseTarget = (
  dependencies: Dependencies,
  unit: Unit,
  city: City
): void => {
  const refused = refusals.get(unit) ?? new Map<City, number>();

  refused.set(city, dependencies.turn.value());
  refusals.set(unit, refused);
};

// Whether `unit` gave up on `city` within the last `REFUSAL_TURNS` turns.
export const refusedTarget = (
  dependencies: Dependencies,
  unit: Unit,
  city: City
): boolean => {
  const turn = refusals.get(unit)?.get(city);

  return turn !== undefined && dependencies.turn.value() - turn < REFUSAL_TURNS;
};

// How many cities overseas a Caravan with nothing to go for at home considers: a few, so that its plan isn't dropped
//  each time the best of them changes by a little.
export const TRADE_TARGETS = 3;

// The cities overseas a Caravan with nothing to go for on its own land would set up a route with, best first, as the
//  candidates for `lib/Unit/overseas`: the cities its player knows of on other land, leaving out any `refused`.
export const tradeTargets = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  refused: (city: City) => boolean = (city: City): boolean =>
    refusedTarget(dependencies, unit, city)
): Tile[] => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player),
    land = continentOf(dependencies.turn.value(), unit.tile());

  return rankPartners(
    dependencies,
    player,
    unit,
    dependencies.cityRegistry
      .entries()
      .filter(
        (city: City): boolean =>
          !city.destroyed() &&
          !land.has(city.tile()) &&
          playerWorld.includes(city.tile()) &&
          !refused(city)
      )
  )
    .slice(0, TRADE_TARGETS)
    .map(([city]): Tile => city.tile());
};
