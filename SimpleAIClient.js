"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const ChoiceMeta_1 = require("@civ-clone/core-client/ChoiceMeta");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const ExchangeKnowledge_1 = require("@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Initiate_1 = require("@civ-clone/core-diplomacy/Negotiation/Initiate");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const PlayerGovernment_1 = require("@civ-clone/core-government/PlayerGovernment");
const Negotiation_1 = require("@civ-clone/core-diplomacy/Negotiation");
const OfferPeace_1 = require("@civ-clone/library-diplomacy/Proposals/OfferPeace");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Resolution_1 = require("@civ-clone/core-diplomacy/Proposal/Resolution");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Tile_1 = require("@civ-clone/core-world/Tile");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const assignWorkers_1 = require("@civ-clone/civ1-city/lib/assignWorkers");
const Decline_1 = require("@civ-clone/core-diplomacy/Proposal/Decline");
const core_random_1 = require("@civ-clone/core-random");
const Memory_1 = require("./lib/Memory");
const aircraft_1 = require("./lib/Civ1/aircraft");
const terrain_1 = require("./lib/Civ1/terrain");
const shouldAttack_1 = require("./lib/shouldAttack");
const awaitTimeout = (delay, reason) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay));
const hasPlayerCity = (tile, player, cityRegistry = CityRegistry_1.instance) => {
    const city = cityRegistry.getByTile(tile);
    if (city === null) {
        return false;
    }
    return city.player() === player;
}, MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;
class SimpleAIClient extends AIClient_1.default {
    // The working memory under the names it had as fields, for tests and debugging that reach in for it.
    get _lastUnitMoves() {
        return this._memory.lastUnitMoves;
    }
    get _unitPathData() {
        return this._memory.unitPathData;
    }
    get _unitTargetData() {
        return this._memory.unitTargetData;
    }
    get _citiesToLiberate() {
        return this._memory.targets.citiesToLiberate;
    }
    get _enemyCitiesToAttack() {
        return this._memory.targets.enemyCitiesToAttack;
    }
    get _enemyUnitsToAttack() {
        return this._memory.targets.enemyUnitsToAttack;
    }
    get _goodSitesForCities() {
        return this._memory.targets.goodSitesForCities;
    }
    get _landTilesToExplore() {
        return this._memory.targets.landTilesToExplore;
    }
    get _seaTilesToExplore() {
        return this._memory.targets.seaTilesToExplore;
    }
    get _undefendedCities() {
        return this._memory.targets.undefendedCities;
    }
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, engine = Engine_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, turn = Turn_1.instance, randomNumberGenerator = core_random_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance) {
        // The generator goes to `core-client`'s `Client`, which holds the one
        // `protected _randomNumberGenerator`. This class declared a second
        // `#randomNumberGenerator` shadowing it, which two `private` fields of the
        // same name cannot express.
        super(player, randomNumberGenerator);
        this._memory = (0, Memory_1.createMemory)();
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
    scoreUnitMove(unit, tile) {
        const actions = unit.actions(tile), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, fortify, foundCity, noOrders, sneakAttack, } = actions.reduce((object, entity) => ({
            ...object,
            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
        }), {});
        if (sneakAttack &&
            !(0, shouldAttack_1.default)(this._dependencies, this.player(), sneakAttack.enemy())) {
            return -10;
        }
        const [firstAction] = actions;
        if (firstAction &&
            !(0, aircraft_1.aircraftCanReturn)(this._dependencies, this.player(), unit, firstAction)) {
            return -1;
        }
        if (!actions.length ||
            (actions.length === 1 && noOrders) ||
            (unit instanceof Types_1.Fortifiable &&
                actions.length === 2 &&
                fortify &&
                noOrders)) {
            return -1;
        }
        let score = 0;
        const goodyHut = this._dependencies.goodyHutRegistry.getByTile(tile);
        if (goodyHut !== null) {
            score += 60;
        }
        if ((foundCity && (0, terrain_1.shouldBuildCity)(this._dependencies, this.player(), tile)) ||
            (buildMine && (0, terrain_1.shouldMine)(this._dependencies, this.player(), tile)) ||
            (buildIrrigation &&
                (0, terrain_1.shouldIrrigate)(this._dependencies, this.player(), tile)) ||
            (buildRoad && (0, terrain_1.shouldRoad)(this._dependencies, this.player(), tile))) {
            score += 24;
        }
        const tileUnits = this._dependencies.unitRegistry
            .getByTile(tile)
            .sort((a, b) => b.defence().value() - a.defence().value()), [defender] = tileUnits, ourUnitsOnTile = tileUnits.some((unit) => unit.player() === this.player());
        if (unit instanceof Types_1.NavalTransport &&
            unit.hasCapacity() &&
            tileUnits.length &&
            ourUnitsOnTile) {
            score += 10;
        }
        if (unit instanceof Types_1.NavalTransport &&
            unit.hasCargo() &&
            tile.isCoast() &&
            tile.isWater()) {
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
        if (attack &&
            unit.attack().value() >= defender.defence().value() * (2 / 3)) {
            score += 8;
        }
        const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(this.player());
        const discoverableTiles = tile
            .getNeighbours()
            .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile)).length;
        if (discoverableTiles > 0) {
            score += discoverableTiles * 3;
        }
        const target = this._memory.unitTargetData.get(unit);
        if (target instanceof Tile_1.default &&
            tile.distanceFrom(target) < unit.tile().distanceFrom(target)) {
            score += 14;
        }
        const lastMoves = this._memory.lastUnitMoves.get(unit) || [];
        if (!lastMoves.includes(tile)) {
            score *= 4;
        }
        return score;
    }
    async moveUnit(unit) {
        let loopCheck = 0;
        while (unit.active() && unit.moves().value() >= 0.1) {
            if (loopCheck++ > 1e3) {
                console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
                console.log(`${unit.player().civilization().name()} ${unit.constructor.name}`);
                console.log(unit.actions());
                console.log(unit.actionsForNeighbours());
                this.noOrders(unit);
                return;
            }
            const path = this._memory.unitPathData.get(unit);
            if (path) {
                const target = path.shift(), moves = unit
                    .actions(target)
                    .filter((action) => action instanceof Actions_1.Move), 
                // Passing through, fly over a `City` or `Carrier` rather than landing on it, which would end the turn.
                [move] = path.length > 0 && unit.moves().value() > 1
                    ? [
                        ...moves.filter((action) => action.constructor === Actions_1.Move),
                        ...moves,
                    ]
                    : moves;
                if ((move instanceof Actions_1.SneakCaptureCity &&
                    !(0, shouldAttack_1.default)(this._dependencies, this.player(), move.enemy())) ||
                    (move &&
                        !(0, aircraft_1.aircraftCanReturn)(this._dependencies, this.player(), unit, move))) {
                    this._memory.unitPathData.delete(unit);
                    continue;
                }
                if (move) {
                    unit.action(move);
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
                .map((tile) => [
                tile,
                this.scoreUnitMove(unit, tile),
            ])
                .filter(([, score]) => score > -1)
                .sort(([, a], [, b]) => b - a ||
                // if there's no difference, sort randomly
                Math.floor(this._dependencies.randomNumberGenerator() * 3) - 1)
                .map(([tile]) => tile);
            if (!target) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            const actions = unit.actions(target), [action] = actions, lastMoves = this._memory.lastUnitMoves.get(unit) || [], currentTarget = this._memory.unitTargetData.get(unit);
            if (!action ||
                ((action instanceof Actions_1.SneakAttack ||
                    action instanceof Actions_1.SneakCaptureCity) &&
                    !(0, shouldAttack_1.default)(this._dependencies, this.player(), action.enemy()))) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            if (currentTarget === target) {
                this._memory.unitTargetData.delete(unit);
            }
            lastMoves.push(target);
            this._memory.lastUnitMoves.set(unit, lastMoves.slice(-50));
            unit.action(action);
        }
        await this.canNegotiate(unit);
        // If we're here, we still have some moves left, lets clear them up.
        // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
        if (unit.moves().value() > 0) {
            this.noOrders(unit);
        }
    }
    preProcessTurn() {
        this._memory.targets.citiesToLiberate.splice(0);
        this._memory.targets.enemyCitiesToAttack.splice(0);
        this._memory.targets.enemyUnitsToAttack.splice(0);
        this._memory.targets.goodSitesForCities.splice(0);
        this._memory.targets.landTilesToExplore.splice(0);
        this._memory.targets.seaTilesToExplore.splice(0);
        this._memory.targets.undefendedCities.splice(0);
        const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(this.player());
        playerWorld.entries().forEach((playerTile) => {
            const tile = playerTile.tile(), tileCity = this._dependencies.cityRegistry.getByTile(tile), tileUnits = this._dependencies.unitRegistry.getBy('tile', tile), existingTarget = this._memory.targets.undefendedCities.includes(tile) &&
                ![
                    ...this._memory.unitTargetData.values(),
                    ...[...this._memory.unitPathData.values()].map((path) => path.end()),
                ].includes(tile);
            if (tileCity &&
                tileCity.player() === this.player() &&
                !tileUnits.length &&
                !this._memory.targets.undefendedCities.includes(tile) &&
                !existingTarget) {
                this._memory.targets.undefendedCities.push(tile);
            }
            // TODO: when diplomacy exists, check diplomatic status with player
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                tileCity.originalPlayer() === this.player()) {
                this._memory.targets.citiesToLiberate.push(tile);
            }
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                !this._memory.targets.enemyCitiesToAttack.includes(tile)) {
                this._memory.targets.enemyCitiesToAttack.push(tile);
            }
            else if (tileUnits.length &&
                tileUnits.some((unit) => unit.player() !== this.player()) &&
                this._memory.targets.enemyUnitsToAttack.includes(tile)) {
                this._memory.targets.enemyUnitsToAttack.push(tile);
            }
            else if (tile.isLand() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                !this._memory.targets.landTilesToExplore.includes(tile) &&
                !existingTarget) {
                this._memory.targets.landTilesToExplore.push(tile);
            }
            else if (tile.isWater() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                this._memory.targets.seaTilesToExplore.includes(tile) &&
                !existingTarget) {
                this._memory.targets.seaTilesToExplore.push(tile);
            }
            if ((0, terrain_1.shouldBuildCity)(this._dependencies, this.player(), tile) &&
                this._memory.targets.goodSitesForCities.includes(tile) &&
                !existingTarget) {
                this._memory.targets.goodSitesForCities.push(tile);
            }
        });
        this._dependencies.cityRegistry
            .getByPlayer(this.player())
            .forEach((city) => {
            const tileUnits = this._dependencies.unitRegistry.getByTile(city.tile());
            (0, assignWorkers_1.default)(city, this._dependencies.playerWorldRegistry, this._dependencies.cityGrowthRegistry, this._dependencies.workedTileRegistry);
            if (!tileUnits.length &&
                !this._memory.targets.undefendedCities.includes(city.tile())) {
                this._memory.targets.undefendedCities.push(city.tile());
            }
        });
        // An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
        this._dependencies.unitRegistry
            .getByPlayer(this.player())
            .flatMap((unit) => unit instanceof Types_1.NavalTransport && !unit.destroyed() ? unit.cargo() : [])
            .filter((unit) => (0, aircraft_1.aircraftFuel)(this._dependencies, unit) !== null && !unit.active())
            .forEach((aircraft) => {
            aircraft.setBusy();
            aircraft.setActive();
        });
    }
    async chooseFromList(meta) {
        if (meta.key() !== 'negotiation.next-step') {
            return super.chooseFromList(meta);
        }
        const score = (item) => {
            const aggressive = (0, shouldAttack_1.default)(this._dependencies, this.player(), item.players().filter((player) => player !== this.player())[0]);
            if (aggressive) {
                return item instanceof Decline_1.default ? 10 : -1;
            }
            return item instanceof ExchangeKnowledge_1.default
                ? 30
                : item instanceof OfferPeace_1.default
                    ? 20
                    : item instanceof Accept_1.default
                        ? 10
                        : 0;
        };
        const [topChoice] = meta.choices().sort((actionA, actionB) => {
            return (
            // TODO: This isn't `unknown`...
            score(actionB.value()) -
                score(actionA.value()));
        });
        return topChoice.value();
    }
    takeTurn() {
        return new Promise(async (resolve, reject) => {
            try {
                let loopCheck = 0;
                this.preProcessTurn();
                const [playerGovernment] = this._dependencies.playerGovernmentRegistry.filter((playerGovernment) => playerGovernment.player() === this.player()), [playerResearch] = this._dependencies.playerResearchRegistry.filter((playerScience) => playerScience.player() === this.player());
                // Through a revolution, like a human player: Anarchy first, then
                // `ChooseGovernment` below once it's over.
                if (playerResearch.completed(Advances_1.Monarchy) &&
                    !playerGovernment.is(Governments_1.Monarchy, Governments_1.Anarchy) &&
                    (0, revolution_1.pendingRevolution)(playerGovernment, this._dependencies.pendingEffectRegistry) === null) {
                    (0, revolution_1.revolution)(playerGovernment, this._dependencies.pendingEffectRegistry, this._dependencies.ruleRegistry, this._dependencies.turn);
                }
                while (this.player().hasMandatoryActions()) {
                    const action = this.player().mandatoryAction(), item = action.value();
                    try {
                        // TODO: Remove this when it's working as expected
                        if (loopCheck++ > 1e3) {
                            // TODO: raise warning - notification?
                            console.log('');
                            console.log('');
                            console.log(item);
                            if (item instanceof Unit_1.default) {
                                console.log(item.actions());
                                item
                                    .tile()
                                    .getNeighbours()
                                    .forEach((tile) => console.log(item.actions(tile)));
                                console.log(item.active());
                                console.log(item.busy());
                                console.log(item.moves().value());
                                console.log(this._dependencies.unitImprovementRegistry.getByUnit(item));
                            }
                            // Do nothing, but shout about it
                            this.noOrders(item);
                            console.error("SimpleAIClient: Couldn't pick an action to do.");
                            break;
                        }
                        // Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn.
                        if (item instanceof Unit_1.default &&
                            !item.waiting() &&
                            (0, aircraft_1.aircraftFuel)(this._dependencies, item) !== null &&
                            this._dependencies.unitRegistry
                                .getByPlayer(this.player())
                                .some((carrier) => carrier instanceof Types_1.NavalTransport &&
                                carrier.canStow(item) &&
                                carrier.active() &&
                                carrier.moves().value() > 0)) {
                            item.setWaiting();
                            continue;
                        }
                        if (item instanceof Unit_1.default) {
                            const unit = item, tile = unit.tile(), target = this._memory.unitTargetData.get(unit), actions = unit.actions(), { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload, } = actions.reduce((object, entity) => ({
                                ...object,
                                [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
                            }), {}), tileUnits = this._dependencies.unitRegistry.getByTile(tile), lastUnitMoves = this._memory.lastUnitMoves.get(unit);
                            if (!lastUnitMoves) {
                                this._memory.lastUnitMoves.set(unit, [unit.tile()]);
                            }
                            if (unit instanceof Types_1.NavalTransport &&
                                unload &&
                                tile.isCoast() &&
                                unit
                                    .cargo()
                                    .some((unit) => !tile
                                    .getNeighbours()
                                    .some((tile) => (this._memory.lastUnitMoves.get(unit) || []).includes(tile)))) {
                                unit.action(unload);
                                unit.setWaiting();
                                // skip out to allow the unloaded units to be moved.
                                continue;
                            }
                            if (unit instanceof Types_1.Worker) {
                                if (foundCity &&
                                    (0, terrain_1.shouldBuildCity)(this._dependencies, this.player(), tile)) {
                                    unit.action(foundCity);
                                }
                                else if (buildIrrigation &&
                                    (0, terrain_1.shouldIrrigate)(this._dependencies, this.player(), tile)) {
                                    unit.action(buildIrrigation);
                                }
                                else if (buildMine &&
                                    (0, terrain_1.shouldMine)(this._dependencies, this.player(), tile)) {
                                    unit.action(buildMine);
                                }
                                else if (buildRoad &&
                                    (0, terrain_1.shouldRoad)(this._dependencies, this.player(), tile)) {
                                    unit.action(buildRoad);
                                }
                                else if (!target &&
                                    this._memory.targets.goodSitesForCities.length) {
                                    this._memory.unitTargetData.set(unit, this._memory.targets.goodSitesForCities.shift());
                                }
                                await this.moveUnit(unit);
                                continue;
                            }
                            // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                            const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => this._dependencies.unitImprovementRegistry
                                .getByUnit(tileUnit)
                                .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence() > tileUnit.defence()), city = this._dependencies.cityRegistry.getByTile(tile);
                            if (fortify &&
                                city &&
                                (cityUnitWithLowerDefence ||
                                    tileUnits.length <=
                                        Math.ceil(this._dependencies.cityGrowthRegistry
                                            .getByCity(city)
                                            .size() / 5))) {
                                unit.action(fortify);
                                if (cityUnitWithLowerDefence) {
                                    cityUnitWithLowerDefence.activate();
                                }
                                continue;
                            }
                            if (!target) {
                                // TODO: all the repetition - sort this.
                                if (unit instanceof Types_1.Fortifiable &&
                                    unit.defence().value() > 0 &&
                                    this._memory.targets.undefendedCities.length > 0) {
                                    const [targetTile] = this._memory.targets.undefendedCities.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.undefendedCities.splice(this._memory.targets.undefendedCities.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit.attack().value() > 0 &&
                                    this._memory.targets.citiesToLiberate.length > 0) {
                                    const [targetTile] = this._memory.targets.citiesToLiberate
                                        .filter((tile) => unit instanceof Types_1.Land && tile.isLand())
                                        .sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.citiesToLiberate.splice(this._memory.targets.citiesToLiberate.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit.attack().value() > 0 &&
                                    this._memory.targets.enemyUnitsToAttack.length > 0) {
                                    const [targetTile] = this._memory.targets.enemyUnitsToAttack
                                        .filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
                                        (unit instanceof Types_1.Naval && tile.isWater()))
                                        .sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.enemyUnitsToAttack.splice(this._memory.targets.enemyUnitsToAttack.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Land &&
                                    unit.attack().value() > 0 &&
                                    this._memory.targets.enemyCitiesToAttack.length > 0) {
                                    const [targetTile] = this._memory.targets.enemyCitiesToAttack.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.enemyCitiesToAttack.splice(this._memory.targets.enemyCitiesToAttack.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Land &&
                                    this._memory.targets.landTilesToExplore.length > 0) {
                                    const [targetTile] = this._memory.targets.landTilesToExplore.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.landTilesToExplore.splice(this._memory.targets.landTilesToExplore.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Naval &&
                                    this._memory.targets.seaTilesToExplore.length > 0) {
                                    const [targetTile] = this._memory.targets.seaTilesToExplore.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._dependencies.pathFinderRegistry);
                                    if (path) {
                                        this._memory.targets.seaTilesToExplore.splice(this._memory.targets.seaTilesToExplore.indexOf(targetTile), 1);
                                        this._memory.unitPathData.set(unit, path);
                                    }
                                }
                            }
                            await this.moveUnit(unit);
                            continue;
                        }
                        if (item instanceof CityBuild_1.default) {
                            this.buildItemInCity(item.city());
                            continue;
                        }
                        if (item instanceof PlayerResearch_1.default) {
                            const available = item.available();
                            if (available.length) {
                                item.research(available[Math.floor(available.length *
                                    this._dependencies.randomNumberGenerator())]);
                            }
                            continue;
                        }
                        if (item instanceof PlayerGovernment_1.default) {
                            const available = item.available();
                            (0, revolution_1.chooseGovernment)(item, available.includes(Governments_1.Monarchy)
                                ? Governments_1.Monarchy
                                : available[0], this._dependencies.pendingEffectRegistry, this._dependencies.turn);
                            continue;
                        }
                        if (action instanceof EndTurn_1.default) {
                            break;
                        }
                        console.log(`Can't process: '${item.constructor.name}'`);
                        break;
                    }
                    catch (e) {
                        if (!(item instanceof Unit_1.default)) {
                            throw e;
                        }
                        // One unit's failed move shouldn't cost the player the rest of their turn, so log it, stop that unit for
                        //  this turn and carry on with the others (civ-clone/web-renderer#79).
                        console.error(`SimpleAIClient: ${item.constructor.name} ${item.id()} couldn't act and was skipped this turn:`, e);
                        this.skipUnit(item);
                    }
                }
                resolve();
            }
            catch (e) {
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
        });
    }
    buildItemInCity(city) {
        const tile = city.tile(), cityBuild = this._dependencies.cityBuildRegistry.getByCity(city), tileUnits = this._dependencies.unitRegistry.getByTile(tile), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
            // TODO: Add auto-wonders or have more logic around this
            !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length *
            this._dependencies.randomNumberGenerator())].item(), getUnitByYield = (YieldType) => {
            const [[UnitType]] = availableUnits
                .map((buildItem) => {
                const UnitType = buildItem.item(), unitYield = new YieldType();
                this._dependencies.ruleRegistry.process(Yield_1.BaseYield, UnitType, unitYield);
                return [UnitType, unitYield];
            })
                .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
            return UnitType;
        }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
        if (this._dependencies.unitRegistry.getByTile(tile).length < 2 &&
            getDefensiveUnit()) {
            cityBuild.build(getDefensiveUnit());
            return;
        }
        const cityGrowth = this._dependencies.cityGrowthRegistry.getByCity(cityBuild.city());
        // Always Build Cities
        if (available.some((buildItem) => buildItem.item() === Units_1.Settlers) &&
            !this._dependencies.unitRegistry
                .getByCity(cityBuild.city())
                .some((unit) => unit instanceof Units_1.Settlers) &&
            // TODO: use expansionist leader trait
            this._dependencies.unitRegistry
                .getByPlayer(this.player())
                .filter((unit) => unit instanceof Units_1.Settlers).length < 3 &&
            cityGrowth.size() > 1) {
            cityBuild.build(Units_1.Settlers);
            return;
        }
        if (this._memory.targets.citiesToLiberate.length > 0 ||
            this._memory.targets.enemyCitiesToAttack.length > 0 ||
            this._memory.targets.enemyUnitsToAttack.length > 4) {
            cityBuild.build(getOffensiveUnit());
            return;
        }
        if (tileUnits.filter((unit) => this._dependencies.unitImprovementRegistry
            .getByUnit(unit)
            .filter((improvement) => improvement instanceof UnitImprovements_1.Fortified)).length < 2 ||
            this._memory.targets.undefendedCities.length) {
            cityBuild.build(getDefensiveUnit());
            return;
        }
        // If we have resources to burn, build a wonder
        if (cityBuild
            .city()
            .yields()
            .filter((cityYield) => cityYield instanceof Yields_2.Production)
            .some((cityYield) => cityYield.value() > 4)) {
            const wonders = availableWonders.map((cityBuild) => cityBuild.item());
            cityBuild.build(wonders[Math.floor(this._dependencies.randomNumberGenerator() * wonders.length)]);
        }
        if (randomSelection) {
            cityBuild.build(randomSelection);
        }
    }
    cityLost(city, player, destroyed) {
        // Can't retaliate against ourselves, we deserved it...
        if (!player) {
            return;
        }
        const playerWorld = this._dependencies.playerWorldRegistry.getByPlayer(this.player());
        if (destroyed) {
            // REVENGE!
            this._memory.targets.enemyCitiesToAttack.push(...playerWorld
                .entries()
                .filter((playerTile) => hasPlayerCity(playerTile.tile(), this.player(), this._dependencies.cityRegistry))
                .map((playerTile) => playerTile.tile()));
            this._memory.targets.enemyUnitsToAttack.push(...playerWorld
                .entries()
                .filter((playerTile) => this._dependencies.unitRegistry
                .getByTile(playerTile.tile())
                .some((unit) => unit.player() === player))
                .map((playerTile) => playerTile.tile()));
            return;
        }
        this._memory.targets.citiesToLiberate.push(city.tile());
    }
    unitDestroyed(unit, player) {
        const city = this._dependencies.cityRegistry.getByTile(unit.tile()), tileUnits = this._dependencies.unitRegistry.getByTile(unit.tile());
        if (city && city.player() === this.player() && tileUnits.length < 2) {
            this.buildItemInCity(city);
            this._dependencies.playerTreasuryRegistry
                .getByPlayerAndType(this.player(), Gold_1.default)
                .buy(city);
        }
    }
    async canNegotiate(unit) {
        const surroundingPlayers = Array.from(new Set(unit
            .tile()
            .getNeighbours()
            .flatMap((tile) => this._dependencies.unitRegistry
            .getByTile(tile)
            .map((tileUnit) => tileUnit.player())
            .filter((player) => player !== this.player()))));
        if (surroundingPlayers.length === 0) {
            return;
        }
        await surroundingPlayers
            .filter((player) => this._dependencies.interactionRegistry
            .getByPlayer(player)
            .filter((interaction) => interaction instanceof Negotiation_1.default &&
            interaction.isBetween(player, this.player()))
            .every((interaction) => this._dependencies.turn.value() - interaction.when() >
            MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION))
            .reduce((promise, player) => promise.then(() => this.handleNegotiation(player)), Promise.resolve());
    }
    async handleNegotiation(player) {
        const negotiation = new Negotiation_1.default(this.player(), player, this._dependencies.ruleRegistry);
        negotiation.proceed(new Initiate_1.default(this.player(), negotiation, this._dependencies.ruleRegistry));
        while (!negotiation.terminated()) {
            const lastInteraction = negotiation.lastInteraction(), players = lastInteraction !== null
                ? lastInteraction.for()
                : negotiation.players().slice(1);
            await players.reduce(async (promise, player) => promise
                .then(async () => {
                const client = this._dependencies.clientRegistry.getByPlayer(player), nextSteps = negotiation.nextSteps(), resultPromise = Promise.race([
                    client.chooseFromList(new ChoiceMeta_1.ChoiceMeta(nextSteps, 'negotiation.next-step', negotiation)),
                    client instanceof AIClient_1.default
                        ? awaitTimeout(500, new Error(`Timeout waiting for ${client.player().id()} (${client.player().civilization().sourceClass().name}) - sent ${nextSteps.length} options`))
                        : new Promise(() => { }),
                ]);
                const interaction = await resultPromise;
                if (!interaction) {
                    return;
                }
                negotiation.proceed(interaction);
                if (interaction instanceof Resolution_1.default) {
                    await interaction.proposal().resolve(interaction);
                }
                // Sleep for a bit to ensure any other async actions have taken place
                await awaitTimeout(20);
            })
                .catch((reason) => console.error(reason)), Promise.resolve());
            if (negotiation.terminated()) {
                break;
            }
        }
        this._dependencies.interactionRegistry.register(negotiation);
        return negotiation;
    }
    skipUnit(unit) {
        try {
            this.noOrders(unit);
        }
        catch (e) {
            // `NoOrders` is only a fallback here, so if it fails too, make sure the unit stops being a mandatory action.
            unit.moves().set(0);
            unit.setActive(false);
        }
    }
    noOrders(unit) {
        unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit, this._dependencies.ruleRegistry));
    }
}
exports.SimpleAIClient = SimpleAIClient;
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map