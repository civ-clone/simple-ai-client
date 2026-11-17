"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeTargets = exports.TRADE_TARGETS = exports.refusedTarget = exports.refuseTarget = exports.REFUSAL_TURNS = exports.wantsAgent = exports.wantsTrader = exports.isCovert = exports.routeFor = exports.missionFor = exports.missionTarget = exports.routePartner = exports.rankPartners = exports.routeHome = exports.routeScore = exports.robbed = exports.knownCitiesOn = exports.baseTradeOf = exports.isEnvoy = exports.isAgent = exports.isTrader = exports.missionsChosen = exports.tradeRoutesMatter = void 0;
// Generic: Caravans and Diplomats sent to other cities on purpose, where the ruleset makes that worth it: a Caravan to set
//  up a trade route where the ruleset says how many routes a city holds (base-city-trade-route's `TradeRouteLimit`,
//  which Civ2 registers), and a Diplomat or Spy on the mission the ruleset chooses for a computer player
//  (base-unit-agent's `MissionChoice`, which Civ2 answers with the original's `spy_city_mission_ai_choice`). Civ1
//  registers neither, so its Caravans and Diplomats do what they always have. From OpenCiv2's `ai_orders_caravan` and
//  `ai_orders_diplomat` (`src/auto/ai.cpp`) and `city_choose_production_try_special_unit` (`city_production.cpp`).
const Actions_1 = require("@civ-clone/library-unit/Actions");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const AdvanceStolen_1 = require("@civ-clone/base-unit-action-steal-technology/AdvanceStolen");
const Covert_1 = require("@civ-clone/base-unit-trait-covert/Covert");
const DiplomaticMissions_1 = require("@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions");
const MissionChoice_1 = require("@civ-clone/base-unit-agent/Rules/MissionChoice");
const PoisonWater_1 = require("@civ-clone/base-unit-action-poison-water/PoisonWater");
const Yields_1 = require("@civ-clone/library-city/Yields");
const TradeMissions_1 = require("@civ-clone/base-unit-trait-trade-missions/TradeMissions");
const TradeRouteRegistry_1 = require("@civ-clone/core-city/TradeRouteRegistry");
const TradeRouteLimit_1 = require("@civ-clone/base-city-trade-route/Rules/TradeRouteLimit");
const baseTrade_1 = require("@civ-clone/base-city-trade-route/lib/baseTrade");
const explorers_1 = require("../City/explorers");
const traits_1 = require("@civ-clone/core-unit/traits");
const mission_1 = require("@civ-clone/base-unit-agent/lib/mission");
const tradeRouteLimit_1 = require("@civ-clone/base-city-trade-route/lib/tradeRouteLimit");
// Whether the ruleset makes trade routes something to build Caravans for: it says how many a city holds.
const tradeRoutesMatter = (ruleRegistry) => ruleRegistry.get(TradeRouteLimit_1.default).length > 0;
exports.tradeRoutesMatter = tradeRoutesMatter;
// Whether the ruleset chooses a computer player's Diplomat and Spy missions.
const missionsChosen = (ruleRegistry) => ruleRegistry.get(MissionChoice_1.default).length > 0;
exports.missionsChosen = missionsChosen;
// A unit, or unit type, that sets up trade routes (a Caravan or Freight).
const isTrader = (unit, ruleRegistry) => (0, traits_1.hasTrait)(unit, TradeMissions_1.default, ruleRegistry);
exports.isTrader = isTrader;
// A unit, or unit type, that carries out missions in other players' cities (a Diplomat or Spy).
const isAgent = (unit, ruleRegistry) => (0, traits_1.hasTrait)(unit, DiplomaticMissions_1.default, ruleRegistry);
exports.isAgent = isAgent;
// Whether `unit` is one this module sends: a trader where routes matter, an agent where missions are chosen.
//  The rules' presence is asked first: it's the cheaper test, and the only one in a ruleset with neither (Civ1).
const isEnvoy = (dependencies, unit) => ((0, exports.tradeRoutesMatter)(dependencies.ruleRegistry) &&
    (0, exports.isTrader)(unit, dependencies.ruleRegistry)) ||
    ((0, exports.missionsChosen)(dependencies.ruleRegistry) &&
        (0, exports.isAgent)(unit, dependencies.ruleRegistry));
exports.isEnvoy = isEnvoy;
// Each city's base trade (base-city-trade-route's `baseTrade`, which works out the city's yields), kept for the turn it
//  was read in and the player that held the city then: a Caravan's choice compares many cities, and a city's yields are
//  among the dearest things to work out. Every computer player shares it, so a city's value can be one read earlier in
//  the turn, before its owner worked it: close enough to rank route partners by.
const baseTrades = new WeakMap();
const baseTradeOf = (dependencies, city) => {
    const turn = dependencies.turn.value(), known = baseTrades.get(city);
    if (known !== undefined &&
        known.turn === turn &&
        known.owner === city.player()) {
        return known.value;
    }
    const value = (0, baseTrade_1.default)(city, Yields_1.Trade);
    baseTrades.set(city, { turn, owner: city.player(), value });
    return value;
};
exports.baseTradeOf = baseTradeOf;
// The city `unit` belongs to, if it still stands.
const homeOf = (unit) => {
    const home = unit.city();
    return home !== null && !home.destroyed() ? home : null;
};
// Whether `action` would break a treaty (it has an `enemy()`, as `moveUnit`'s `breaksTreaty` tells).
const breaksTreaty = (action) => typeof (action === null || action === void 0 ? void 0 : action.enemy) === 'function';
// The cities `player` knows of on `land`, standing (the registry lists destroyed cities too).
const knownCitiesOn = (dependencies, player, land) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    return dependencies.cityRegistry
        .entries()
        .filter((city) => !city.destroyed() &&
        land.has(city.tile()) &&
        playerWorld.includes(city.tile()));
};
exports.knownCitiesOn = knownCitiesOn;
// Whether anyone has stolen an advance from `city` (`CITYF_TECH_STOLEN`).
const robbed = (dependencies, city) => dependencies.interactionRegistry
    .entries()
    .some((interaction) => interaction instanceof AdvanceStolen_1.default &&
    interaction.city() === city);
exports.robbed = robbed;
// What a route from `home` to `city` is worth to a Caravan, as `ai_orders_caravan` (`ai.cpp:3122-3166`) scores it:
//  both cities' base trade times the distance between them, over 24, halved for one of the player's own cities and
//  again where `home` already has a route there, less a fifth for each route `city` holds. The original weighs a foreign
//  city by its owner's attitude; the client can't read one, so it counts as neutral.
const routeScore = (dependencies, player, home, city, tradeRouteRegistry = TradeRouteRegistry_1.instance, homeTrade = (0, exports.baseTradeOf)(dependencies, home)) => {
    let score = ((homeTrade + (0, exports.baseTradeOf)(dependencies, city)) *
        home.tile().distanceFrom(city.tile())) /
        24;
    if (city.player() === player) {
        score /= 2;
    }
    if (tradeRouteRegistry
        .getByCity(home)
        .some((route) => route.to() === city)) {
        score /= 2;
    }
    return ((5 - tradeRouteRegistry.getByCity(city).length) * score) / 5;
};
exports.routeScore = routeScore;
// The city a Caravan's route starts from: its home, or with none its player's nearest city, as the ruleset's route
//  rows have it.
const routeHome = (dependencies, player, unit) => {
    var _a, _b;
    return (_b = (_a = homeOf(unit)) !== null && _a !== void 0 ? _a : [...dependencies.cityRegistry.getByPlayer(player)].sort((a, b) => a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile()))[0]) !== null && _b !== void 0 ? _b : null;
};
exports.routeHome = routeHome;
// `candidates` worth a route from `unit`'s home (`routeScore` above 0), best first, never the home itself.
const rankPartners = (dependencies, player, unit, candidates) => {
    const home = (0, exports.routeHome)(dependencies, player, unit);
    if (home === null) {
        return [];
    }
    const homeTrade = (0, exports.baseTradeOf)(dependencies, home);
    return candidates
        .filter((city) => city !== home)
        .map((city) => [
        city,
        (0, exports.routeScore)(dependencies, player, home, city, TradeRouteRegistry_1.instance, homeTrade),
    ])
        .filter(([, score]) => score > 0)
        .sort(([, a], [, b]) => b - a);
};
exports.rankPartners = rankPartners;
// The city a Caravan sets off for: the best route partner on its own land (`routeScore`), never its home city, or
//  `null`. A Caravan with no home has its player's nearest city as home, as the ruleset's route rows do.
const routePartner = (dependencies, player, unit, candidates = (0, exports.knownCitiesOn)(dependencies, player, (0, explorers_1.continentOf)(dependencies.turn.value(), unit.tile()))) => {
    const [best] = (0, exports.rankPartners)(dependencies, player, unit, candidates);
    return best ? best[0] : null;
};
exports.routePartner = routePartner;
// The city a Diplomat or Spy sets off for, as `ai_orders_diplomat` (`ai.cpp:3216-3290`) chooses for a computer player:
//  another player's city on its own land with no treaty between them (a computer player's agent leaves a treaty
//  partner's cities alone), worth more at war, less already robbed, and the nearer the better. `null` with none.
const missionTarget = (dependencies, player, unit, candidates = (0, exports.knownCitiesOn)(dependencies, player, (0, explorers_1.continentOf)(dependencies.turn.value(), unit.tile()))) => {
    const [best] = candidates
        .filter((city) => {
        const owner = city.player();
        return (owner !== player &&
            (0, treatyLevel_1.treatyLevel)(dependencies, player, owner) < treatyLevel_1.TreatyLevel.Ceasefire);
    })
        .map((city) => {
        const level = (0, treatyLevel_1.treatyLevel)(dependencies, player, city.player());
        let score = (100 + (level === treatyLevel_1.TreatyLevel.War ? 100 : 50)) /
            (unit.tile().distanceFrom(city.tile()) + 1);
        if ((0, exports.robbed)(dependencies, city)) {
            score /= 2;
        }
        return [city, score];
    })
        .sort(([, a], [, b]) => b - a);
    return best ? best[0] : null;
};
exports.missionTarget = missionTarget;
// The mission rows by the names the ruleset's `MissionChoice` gives them. Matched by exact class: the treaty-breaking
//  forms (`SneakStealTechnology` and the like) extend these and are never taken.
const MISSIONS = {
    'establish-embassy': Actions_1.EstablishEmbassy,
    'incite-revolt': Actions_1.InciteRevolt,
    'industrial-sabotage': Actions_1.IndustrialSabotage,
    'investigate-city': Actions_1.InvestigateCity,
    'poison-water': PoisonWater_1.default,
    'steal-technology': Actions_1.StealTechnology,
};
const exactly = (actions, name) => actions.find((action) => action.constructor === MISSIONS[name] && !breaksTreaty(action));
// The mission `unit` carries out on `city` of the `offered` actions: the one the ruleset chooses (`MissionChoice`, asked
//  once here), or, when that one isn't offered, what the original falls back on when a mission can't be carried out:
//  a theft with nothing to take becomes a sabotage, or an embassy under a treaty (`unit_spy.cpp:432-437`); an incited
//  revolt the player can't pay for becomes a theft (`:851`); an embassy there already is becomes an investigation
//  (`:290`). `null` when there's nothing to do.
const missionFor = (dependencies, unit, city, offered, 
// The ruleset's choice, asked here unless the caller already has it (`undefined` is an answer: no choice).
choose = () => (0, mission_1.missionChoice)(unit, city, dependencies.ruleRegistry)) => {
    var _a;
    const chosen = choose();
    if (chosen === undefined) {
        return null;
    }
    const underTreaty = (0, treatyLevel_1.treatyLevel)(dependencies, unit.player(), city.player()) >=
        treatyLevel_1.TreatyLevel.Ceasefire, fallbacks = {
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
    }, [action] = [chosen, ...((_a = fallbacks[chosen]) !== null && _a !== void 0 ? _a : [])]
        .map((name) => exactly(offered, name))
        .filter((action) => action !== undefined);
    return action !== null && action !== void 0 ? action : null;
};
exports.missionFor = missionFor;
// The route `unit` sets up on `city` of the `offered` actions: the ruleset's `EstablishTradeRoute`, never its help with
//  a Wonder (Classic: a computer player's Caravan always sets up a route, `unit_caravan_enter_city`). `null` with none.
const routeFor = (offered) => {
    var _a;
    return (_a = offered.find((action) => action.constructor === Actions_1.EstablishTradeRoute && !breaksTreaty(action))) !== null && _a !== void 0 ? _a : null;
};
exports.routeFor = routeFor;
// Whether `type` is a Spy rather than a Diplomat.
const isCovert = (type, ruleRegistry) => (0, traits_1.hasTrait)(type, Covert_1.default, ruleRegistry);
exports.isCovert = isCovert;
// What a city's production wants of traders and agents, as `city_choose_production_try_special_unit` decides:
//  - a Caravan where routes matter, from a city with a route slot to spare and base trade to share, and no Caravan of its
//    own out or on order (`CITYF_HAD_CARAVAN`);
//  - a Diplomat or Spy where missions are chosen, while none is on order, the player has fewer agents than its cities
//    on that land, and another player it has no treaty with has a city there (`city_choose_production_diplomat_score`).
const wantsTrader = (dependencies, player, city, ownTraders, tradeRouteRegistry = TradeRouteRegistry_1.instance) => (0, exports.tradeRoutesMatter)(dependencies.ruleRegistry) &&
    ownTraders === 0 &&
    tradeRouteRegistry.getByCity(city).length <
        (0, tradeRouteLimit_1.default)(city, dependencies.ruleRegistry) &&
    (0, exports.baseTradeOf)(dependencies, city) > 0;
exports.wantsTrader = wantsTrader;
const wantsAgent = (dependencies, player, city, agents, agentsOnOrder) => {
    if (!(0, exports.missionsChosen)(dependencies.ruleRegistry) || agentsOnOrder > 0) {
        return false;
    }
    const land = (0, explorers_1.continentOf)(dependencies.turn.value(), city.tile()), cities = dependencies.cityRegistry
        .entries()
        .filter((other) => !other.destroyed() && land.has(other.tile()));
    return (agents <
        cities.filter((other) => other.player() === player)
            .length &&
        cities.some((other) => other.player() !== player &&
            (0, treatyLevel_1.treatyLevel)(dependencies, player, other.player()) <
                treatyLevel_1.TreatyLevel.Ceasefire));
};
exports.wantsAgent = wantsAgent;
// How long a unit leaves alone a city it found nothing to do at, or no way to stand beside, before trying it again.
exports.REFUSAL_TURNS = 10;
// The cities each unit has given up on, with the turn it did.
const refusals = new WeakMap();
const refuseTarget = (dependencies, unit, city) => {
    var _a;
    const refused = (_a = refusals.get(unit)) !== null && _a !== void 0 ? _a : new Map();
    refused.set(city, dependencies.turn.value());
    refusals.set(unit, refused);
};
exports.refuseTarget = refuseTarget;
// Whether `unit` gave up on `city` within the last `REFUSAL_TURNS` turns.
const refusedTarget = (dependencies, unit, city) => {
    var _a;
    const turn = (_a = refusals.get(unit)) === null || _a === void 0 ? void 0 : _a.get(city);
    return turn !== undefined && dependencies.turn.value() - turn < exports.REFUSAL_TURNS;
};
exports.refusedTarget = refusedTarget;
// How many cities overseas a Caravan with nothing to go for at home considers: a few, so that its plan isn't dropped
//  each time the best of them changes by a little.
exports.TRADE_TARGETS = 3;
// The cities overseas a Caravan with nothing to go for on its own land would set up a route with, best first, as the
//  candidates for `lib/Unit/overseas`: the cities its player knows of on other land, leaving out any `refused`.
const tradeTargets = (dependencies, player, unit, refused = (city) => (0, exports.refusedTarget)(dependencies, unit, city)) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), land = (0, explorers_1.continentOf)(dependencies.turn.value(), unit.tile());
    return (0, exports.rankPartners)(dependencies, player, unit, dependencies.cityRegistry
        .entries()
        .filter((city) => !city.destroyed() &&
        !land.has(city.tile()) &&
        playerWorld.includes(city.tile()) &&
        !refused(city)))
        .slice(0, exports.TRADE_TARGETS)
        .map(([city]) => city.tile());
};
exports.tradeTargets = tradeTargets;
//# sourceMappingURL=envoys.js.map