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
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
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
const turnEnd_1 = require("@civ-clone/civ1-unit/Rules/Player/turnEnd");
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
const awaitTimeout = (delay, reason) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay));
// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, and
//  the map wraps as it does in `Tile#distanceFrom`.
const movesBetween = (from, to) => {
    const map = from.map(), onAxis = (delta, size) => {
        const direct = Math.abs(delta);
        return Math.min(direct, Math.abs(size - direct));
    };
    return Math.max(onAxis(from.x() - to.x(), map.width()), onAxis(from.y() - to.y(), map.height()));
}, hasPlayerCity = (tile, player, cityRegistry = CityRegistry_1.instance) => {
    const city = cityRegistry.getByTile(tile);
    if (city === null) {
        return false;
    }
    return city.player() === player;
}, MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;
class SimpleAIClient extends AIClient_1.default {
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, engine = Engine_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, turn = Turn_1.instance, randomNumberGenerator = core_random_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance) {
        // The generator goes to `core-client`'s `Client`, which holds the one
        // `protected _randomNumberGenerator`. This class declared a second
        // `#randomNumberGenerator` shadowing it, which two `private` fields of the
        // same name cannot express.
        super(player, randomNumberGenerator);
        this._isACityTile = (tile) => this._cityRegistry
            .getByPlayer(this.player())
            .some((city) => city.tiles().includes(tile));
        this._shouldBuildCity = (tile) => {
            const isEarth = this._engine.option('earth', false), hasNoCities = this._cityRegistry.getByPlayer(this.player()).length === 0;
            if (isEarth && hasNoCities) {
                return true;
            }
            const terrainFeatures = this._terrainFeatureRegistry.getByTerrain(tile.terrain());
            return ((tile.terrain() instanceof Terrains_1.Grassland ||
                tile.terrain() instanceof Terrains_1.River ||
                tile.terrain() instanceof Terrains_1.Plains ||
                terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Oasis) ||
                terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Game)) &&
                tile.getSurroundingArea().score(this.player(), [
                    [Yields_2.Food, 4],
                    [Yields_2.Production, 2],
                    [Yields_2.Trade, 1],
                ]) >= 160 &&
                !tile
                    .getSurroundingArea(4)
                    .filter((tile) => this._cityRegistry.getByTile(tile) !== null).length);
        };
        this._shouldIrrigate = (tile) => {
            return ([Terrains_1.Desert, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.River].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                // TODO: doing this a lot already, need to make improvements a value object with a helper method
                !this._tileImprovementRegistry
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                this._isACityTile(tile) &&
                [...tile.getAdjacent(), tile].some((tile) => tile.terrain() instanceof Terrains_1.River ||
                    tile.isCoast() ||
                    (this._tileImprovementRegistry
                        .getByTile(tile)
                        .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                        this._cityRegistry.getByTile(tile) === null)));
        };
        this._shouldMine = (tile) => {
            return ([Terrains_1.Hills, Terrains_1.Mountains].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                !this._tileImprovementRegistry
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Mine) &&
                this._isACityTile(tile));
        };
        this._shouldRoad = (tile) => {
            return (!this._tileImprovementRegistry
                .getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Road) && this._isACityTile(tile));
        };
        this._lastUnitMoves = new Map();
        this._unitPathData = new Map();
        this._unitTargetData = new Map();
        // TODO: could be `City`/`Unit`s?
        this._citiesToLiberate = [];
        this._enemyCitiesToAttack = [];
        this._enemyUnitsToAttack = [];
        this._goodSitesForCities = [];
        this._landTilesToExplore = [];
        this._seaTilesToExplore = [];
        this._undefendedCities = [];
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
    aircraftFuel(unit) {
        var _a, _b, _c;
        const [, range] = (_a = turnEnd_1.aircraftRange.find(([UnitType]) => unit instanceof UnitType)) !== null && _a !== void 0 ? _a : [];
        if (range === undefined) {
            return null;
        }
        const turnsAloft = (_c = (_b = this._strategyNoteRegistry
            .getByKey((0, turnEnd_1.turnsAloftKey)(unit))) === null || _b === void 0 ? void 0 : _b.value()) !== null && _c !== void 0 ? _c : 0;
        return (unit.moves().value() +
            Math.max(0, range - turnsAloft - 1) * unit.movement().value());
    }
    // Whether an aircraft can still get home after taking `action`: moving costs 1 and a `Fighter` pays 1 to attack from
    //  where it is, but a `Bomber`'s attack ends its turn wherever it is.
    aircraftCanReturn(unit, action) {
        const fuel = this.aircraftFuel(unit);
        if (fuel === null) {
            return true;
        }
        const moving = action instanceof Actions_1.Move, from = moving ? action.to() : unit.tile(), remaining = !moving && unit instanceof Units_1.Bomber
            ? fuel - unit.moves().value()
            : fuel - 1;
        return [
            ...this._cityRegistry
                .getByPlayer(this.player())
                .map((city) => city.tile()),
            ...this.carriersFor(unit).map((carrier) => carrier.tile()),
        ].some((tile) => movesBetween(from, tile) <= remaining);
    }
    // Our `Carrier`s that `unit` could land on. One it's already aboard counts even when full: taking off frees its slot.
    carriersFor(unit) {
        return this._unitRegistry
            .getByPlayer(this.player())
            .filter((tileUnit) => tileUnit instanceof Types_1.NavalTransport &&
            !tileUnit.destroyed() &&
            (tileUnit.hasCapacity() || tileUnit.cargo().includes(unit)) &&
            tileUnit.canStow(unit));
    }
    scoreUnitMove(unit, tile) {
        const actions = unit.actions(tile), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, fortify, foundCity, noOrders, sneakAttack, } = actions.reduce((object, entity) => ({
            ...object,
            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
        }), {});
        if (sneakAttack && !this.shouldAttack(sneakAttack.enemy())) {
            return -10;
        }
        const [firstAction] = actions;
        if (firstAction && !this.aircraftCanReturn(unit, firstAction)) {
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
        const goodyHut = this._goodyHutRegistry.getByTile(tile);
        if (goodyHut !== null) {
            score += 60;
        }
        if ((foundCity && this._shouldBuildCity(tile)) ||
            (buildMine && this._shouldMine(tile)) ||
            (buildIrrigation && this._shouldIrrigate(tile)) ||
            (buildRoad && this._shouldRoad(tile))) {
            score += 24;
        }
        const tileUnits = this._unitRegistry
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
        const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());
        const discoverableTiles = tile
            .getNeighbours()
            .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile)).length;
        if (discoverableTiles > 0) {
            score += discoverableTiles * 3;
        }
        const target = this._unitTargetData.get(unit);
        if (target instanceof Tile_1.default &&
            tile.distanceFrom(target) < unit.tile().distanceFrom(target)) {
            score += 14;
        }
        const lastMoves = this._lastUnitMoves.get(unit) || [];
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
            const path = this._unitPathData.get(unit);
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
                    !this.shouldAttack(move.enemy())) ||
                    (move && !this.aircraftCanReturn(unit, move))) {
                    this._unitPathData.delete(unit);
                    continue;
                }
                if (move) {
                    unit.action(move);
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
                .map((tile) => [
                tile,
                this.scoreUnitMove(unit, tile),
            ])
                .filter(([, score]) => score > -1)
                .sort(([, a], [, b]) => b - a ||
                // if there's no difference, sort randomly
                Math.floor(this._randomNumberGenerator() * 3) - 1)
                .map(([tile]) => tile);
            if (!target) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            const actions = unit.actions(target), [action] = actions, lastMoves = this._lastUnitMoves.get(unit) || [], currentTarget = this._unitTargetData.get(unit);
            if (!action ||
                ((action instanceof Actions_1.SneakAttack ||
                    action instanceof Actions_1.SneakCaptureCity) &&
                    !this.shouldAttack(action.enemy()))) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            if (currentTarget === target) {
                this._unitTargetData.delete(unit);
            }
            lastMoves.push(target);
            this._lastUnitMoves.set(unit, lastMoves.slice(-50));
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
        this._citiesToLiberate.splice(0);
        this._enemyCitiesToAttack.splice(0);
        this._enemyUnitsToAttack.splice(0);
        this._goodSitesForCities.splice(0);
        this._landTilesToExplore.splice(0);
        this._seaTilesToExplore.splice(0);
        this._undefendedCities.splice(0);
        const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());
        playerWorld.entries().forEach((playerTile) => {
            const tile = playerTile.tile(), tileCity = this._cityRegistry.getByTile(tile), tileUnits = this._unitRegistry.getBy('tile', tile), existingTarget = this._undefendedCities.includes(tile) &&
                ![
                    ...this._unitTargetData.values(),
                    ...[...this._unitPathData.values()].map((path) => path.end()),
                ].includes(tile);
            if (tileCity &&
                tileCity.player() === this.player() &&
                !tileUnits.length &&
                !this._undefendedCities.includes(tile) &&
                !existingTarget) {
                this._undefendedCities.push(tile);
            }
            // TODO: when diplomacy exists, check diplomatic status with player
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                tileCity.originalPlayer() === this.player()) {
                this._citiesToLiberate.push(tile);
            }
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                !this._enemyCitiesToAttack.includes(tile)) {
                this._enemyCitiesToAttack.push(tile);
            }
            else if (tileUnits.length &&
                tileUnits.some((unit) => unit.player() !== this.player()) &&
                this._enemyUnitsToAttack.includes(tile)) {
                this._enemyUnitsToAttack.push(tile);
            }
            else if (tile.isLand() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                !this._landTilesToExplore.includes(tile) &&
                !existingTarget) {
                this._landTilesToExplore.push(tile);
            }
            else if (tile.isWater() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                this._seaTilesToExplore.includes(tile) &&
                !existingTarget) {
                this._seaTilesToExplore.push(tile);
            }
            if (this._shouldBuildCity(tile) &&
                this._goodSitesForCities.includes(tile) &&
                !existingTarget) {
                this._goodSitesForCities.push(tile);
            }
        });
        this._cityRegistry
            .getByPlayer(this.player())
            .forEach((city) => {
            const tileUnits = this._unitRegistry.getByTile(city.tile());
            (0, assignWorkers_1.default)(city, this._playerWorldRegistry, this._cityGrowthRegistry, this._workedTileRegistry);
            if (!tileUnits.length &&
                !this._undefendedCities.includes(city.tile())) {
                this._undefendedCities.push(city.tile());
            }
        });
        // An aircraft that has landed on one of our `Carrier`s stays aboard until it's given orders, so give it some.
        this._unitRegistry
            .getByPlayer(this.player())
            .flatMap((unit) => unit instanceof Types_1.NavalTransport && !unit.destroyed() ? unit.cargo() : [])
            .filter((unit) => this.aircraftFuel(unit) !== null && !unit.active())
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
            const aggressive = this.shouldAttack(item.players().filter((player) => player !== this.player())[0]);
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
                const [playerGovernment] = this._playerGovernmentRegistry.filter((playerGovernment) => playerGovernment.player() === this.player()), [playerResearch] = this._playerResearchRegistry.filter((playerScience) => playerScience.player() === this.player());
                if (playerResearch.completed(Advances_1.Monarchy) &&
                    !playerGovernment.is(Governments_1.Monarchy)) {
                    playerGovernment.set(new Governments_1.Monarchy());
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
                                console.log(this._unitImprovementRegistry.getByUnit(item));
                            }
                            // Do nothing, but shout about it
                            this.noOrders(item);
                            console.error("SimpleAIClient: Couldn't pick an action to do.");
                            break;
                        }
                        // Our `Carrier`s move first, so an aircraft only counts on one being where it'll be at the end of the turn.
                        if (item instanceof Unit_1.default &&
                            !item.waiting() &&
                            this.aircraftFuel(item) !== null &&
                            this._unitRegistry
                                .getByPlayer(this.player())
                                .some((carrier) => carrier instanceof Types_1.NavalTransport &&
                                carrier.canStow(item) &&
                                carrier.active() &&
                                carrier.moves().value() > 0)) {
                            item.setWaiting();
                            continue;
                        }
                        if (item instanceof Unit_1.default) {
                            const unit = item, tile = unit.tile(), target = this._unitTargetData.get(unit), actions = unit.actions(), { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload, } = actions.reduce((object, entity) => ({
                                ...object,
                                [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
                            }), {}), tileUnits = this._unitRegistry.getByTile(tile), lastUnitMoves = this._lastUnitMoves.get(unit);
                            if (!lastUnitMoves) {
                                this._lastUnitMoves.set(unit, [unit.tile()]);
                            }
                            if (unit instanceof Types_1.NavalTransport &&
                                unload &&
                                tile.isCoast() &&
                                unit
                                    .cargo()
                                    .some((unit) => !tile
                                    .getNeighbours()
                                    .some((tile) => (this._lastUnitMoves.get(unit) || []).includes(tile)))) {
                                unit.action(unload);
                                unit.setWaiting();
                                // skip out to allow the unloaded units to be moved.
                                continue;
                            }
                            if (unit instanceof Types_1.Worker) {
                                if (foundCity && this._shouldBuildCity(tile)) {
                                    unit.action(foundCity);
                                }
                                else if (buildIrrigation && this._shouldIrrigate(tile)) {
                                    unit.action(buildIrrigation);
                                }
                                else if (buildMine && this._shouldMine(tile)) {
                                    unit.action(buildMine);
                                }
                                else if (buildRoad && this._shouldRoad(tile)) {
                                    unit.action(buildRoad);
                                }
                                else if (!target && this._goodSitesForCities.length) {
                                    this._unitTargetData.set(unit, this._goodSitesForCities.shift());
                                }
                                await this.moveUnit(unit);
                                continue;
                            }
                            // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                            const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => this._unitImprovementRegistry
                                .getByUnit(tileUnit)
                                .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence() > tileUnit.defence()), city = this._cityRegistry.getByTile(tile);
                            if (fortify &&
                                city &&
                                (cityUnitWithLowerDefence ||
                                    tileUnits.length <=
                                        Math.ceil(this._cityGrowthRegistry.getByCity(city).size() / 5))) {
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
                                    this._undefendedCities.length > 0) {
                                    const [targetTile] = this._undefendedCities.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._undefendedCities.splice(this._undefendedCities.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit.attack().value() > 0 &&
                                    this._citiesToLiberate.length > 0) {
                                    const [targetTile] = this._citiesToLiberate
                                        .filter((tile) => unit instanceof Types_1.Land && tile.isLand())
                                        .sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._citiesToLiberate.splice(this._citiesToLiberate.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit.attack().value() > 0 &&
                                    this._enemyUnitsToAttack.length > 0) {
                                    const [targetTile] = this._enemyUnitsToAttack
                                        .filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
                                        (unit instanceof Types_1.Naval && tile.isWater()))
                                        .sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._enemyUnitsToAttack.splice(this._enemyUnitsToAttack.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Land &&
                                    unit.attack().value() > 0 &&
                                    this._enemyCitiesToAttack.length > 0) {
                                    const [targetTile] = this._enemyCitiesToAttack.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._enemyCitiesToAttack.splice(this._enemyCitiesToAttack.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Land &&
                                    this._landTilesToExplore.length > 0) {
                                    const [targetTile] = this._landTilesToExplore.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._landTilesToExplore.splice(this._landTilesToExplore.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
                                    }
                                }
                                else if (unit instanceof Types_1.Naval &&
                                    this._seaTilesToExplore.length > 0) {
                                    const [targetTile] = this._seaTilesToExplore.sort((a, b) => a.distanceFrom(unit.tile()) -
                                        b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, this._pathFinderRegistry);
                                    if (path) {
                                        this._seaTilesToExplore.splice(this._seaTilesToExplore.indexOf(targetTile), 1);
                                        this._unitPathData.set(unit, path);
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
                                item.research(available[Math.floor(available.length * this._randomNumberGenerator())]);
                            }
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
        const tile = city.tile(), cityBuild = this._cityBuildRegistry.getByCity(city), tileUnits = this._unitRegistry.getByTile(tile), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
            // TODO: Add auto-wonders or have more logic around this
            !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * this._randomNumberGenerator())].item(), getUnitByYield = (YieldType) => {
            const [[UnitType]] = availableUnits
                .map((buildItem) => {
                const UnitType = buildItem.item(), unitYield = new YieldType();
                this._ruleRegistry.process(Yield_1.BaseYield, UnitType, unitYield);
                return [UnitType, unitYield];
            })
                .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
            return UnitType;
        }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
        if (this._unitRegistry.getByTile(tile).length < 2 && getDefensiveUnit()) {
            cityBuild.build(getDefensiveUnit());
            return;
        }
        const cityGrowth = this._cityGrowthRegistry.getByCity(cityBuild.city());
        // Always Build Cities
        if (available.some((buildItem) => buildItem.item() === Units_1.Settlers) &&
            !this._unitRegistry
                .getByCity(cityBuild.city())
                .some((unit) => unit instanceof Units_1.Settlers) &&
            // TODO: use expansionist leader trait
            this._unitRegistry
                .getByPlayer(this.player())
                .filter((unit) => unit instanceof Units_1.Settlers).length < 3 &&
            cityGrowth.size() > 1) {
            cityBuild.build(Units_1.Settlers);
            return;
        }
        if (this._citiesToLiberate.length > 0 ||
            this._enemyCitiesToAttack.length > 0 ||
            this._enemyUnitsToAttack.length > 4) {
            cityBuild.build(getOffensiveUnit());
            return;
        }
        if (tileUnits.filter((unit) => this._unitImprovementRegistry
            .getByUnit(unit)
            .filter((improvement) => improvement instanceof UnitImprovements_1.Fortified)).length < 2 ||
            this._undefendedCities.length) {
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
            cityBuild.build(wonders[Math.floor(this._randomNumberGenerator() * wonders.length)]);
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
        const playerWorld = this._playerWorldRegistry.getByPlayer(this.player());
        if (destroyed) {
            // REVENGE!
            this._enemyCitiesToAttack.push(...playerWorld
                .entries()
                .filter((playerTile) => hasPlayerCity(playerTile.tile(), this.player(), this._cityRegistry))
                .map((playerTile) => playerTile.tile()));
            this._enemyUnitsToAttack.push(...playerWorld
                .entries()
                .filter((playerTile) => this._unitRegistry
                .getByTile(playerTile.tile())
                .some((unit) => unit.player() === player))
                .map((playerTile) => playerTile.tile()));
            return;
        }
        this._citiesToLiberate.push(city.tile());
    }
    unitDestroyed(unit, player) {
        const city = this._cityRegistry.getByTile(unit.tile()), tileUnits = this._unitRegistry.getByTile(unit.tile());
        if (city && city.player() === this.player() && tileUnits.length < 2) {
            this.buildItemInCity(city);
            this._playerTreasuryRegistry
                .getByPlayerAndType(this.player(), Gold_1.default)
                .buy(city);
        }
    }
    async canNegotiate(unit) {
        const surroundingPlayers = Array.from(new Set(unit
            .tile()
            .getNeighbours()
            .flatMap((tile) => this._unitRegistry
            .getByTile(tile)
            .map((tileUnit) => tileUnit.player())
            .filter((player) => player !== this.player()))));
        if (surroundingPlayers.length === 0) {
            return;
        }
        await surroundingPlayers
            .filter((player) => this._interactionRegistry
            .getByPlayer(player)
            .filter((interaction) => interaction instanceof Negotiation_1.default &&
            interaction.isBetween(player, this.player()))
            .every((interaction) => this._turn.value() - interaction.when() >
            MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION))
            .reduce((promise, player) => promise.then(() => this.handleNegotiation(player)), Promise.resolve());
    }
    async handleNegotiation(player) {
        const negotiation = new Negotiation_1.default(this.player(), player, this._ruleRegistry);
        negotiation.proceed(new Initiate_1.default(this.player(), negotiation, this._ruleRegistry));
        while (!negotiation.terminated()) {
            const lastInteraction = negotiation.lastInteraction(), players = lastInteraction !== null
                ? lastInteraction.for()
                : negotiation.players().slice(1);
            await players.reduce(async (promise, player) => promise
                .then(async () => {
                const client = this._clientRegistry.getByPlayer(player), nextSteps = negotiation.nextSteps(), resultPromise = Promise.race([
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
        this._interactionRegistry.register(negotiation);
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
        unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit, this._ruleRegistry));
    }
    shouldAttack(player) {
        // TODO: These scores should be cached, at lest for the duration of the Turn...
        const ourPower = this._unitRegistry
            .getByPlayer(this.player())
            .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), enemyPower = this._unitRegistry
            .getByPlayer(player)
            .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), 
        // TODO: use Traits
        // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
        confidence = 1;
        return ourPower * confidence >= enemyPower;
    }
}
exports.SimpleAIClient = SimpleAIClient;
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map