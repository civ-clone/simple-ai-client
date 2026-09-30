"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
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
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const PlayerGovernment_1 = require("@civ-clone/core-government/PlayerGovernment");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const core_random_1 = require("@civ-clone/core-random");
const Memory_1 = require("./lib/Memory");
const aircraft_1 = require("./lib/Civ1/aircraft");
const terrain_1 = require("./lib/Civ1/terrain");
const knowledge_1 = require("./lib/Civ1/knowledge");
const reviewCities_1 = require("./lib/Turn/reviewCities");
const chooseNegotiationStep_1 = require("./lib/Diplomacy/chooseNegotiationStep");
const orders_1 = require("./lib/Unit/orders");
const moveUnit_1 = require("./lib/Unit/moveUnit");
const scoreUnitMove_1 = require("./lib/Unit/scoreUnitMove");
const government_1 = require("./lib/Civ1/government");
const surveyTargets_1 = require("./lib/Turn/surveyTargets");
const wakeCarrierAircraft_1 = require("./lib/Turn/wakeCarrierAircraft");
const hasPlayerCity = (tile, player, cityRegistry = CityRegistry_1.instance) => {
    const city = cityRegistry.getByTile(tile);
    if (city === null) {
        return false;
    }
    return city.player() === player;
};
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
        this._knowledge = knowledge_1.default;
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
        return (0, scoreUnitMove_1.default)(this._dependencies, this.player(), this._memory, this._knowledge, unit, tile);
    }
    // Not `async`: the promise is handed back as it is, so awaiting this takes the same ticks as awaiting `moveUnit`.
    moveUnit(unit) {
        return (0, moveUnit_1.default)(this._dependencies, this.player(), this._memory, this._knowledge, unit);
    }
    preProcessTurn() {
        (0, surveyTargets_1.default)(this._dependencies, this.player(), this._memory, this._knowledge);
        (0, reviewCities_1.default)(this._dependencies, this.player(), this._memory.targets, this._knowledge);
        (0, wakeCarrierAircraft_1.default)(this._dependencies, this.player(), this._knowledge);
    }
    async chooseFromList(meta) {
        if (meta.key() !== 'negotiation.next-step') {
            return super.chooseFromList(meta);
        }
        return (0, chooseNegotiationStep_1.default)(this._dependencies, this.player(), meta);
    }
    takeTurn() {
        return new Promise(async (resolve, reject) => {
            try {
                let loopCheck = 0;
                this.preProcessTurn();
                (0, government_1.startRevolution)(this._dependencies, this.player());
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
                            (0, orders_1.noOrders)(this._dependencies, item);
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
                        (0, orders_1.skipUnit)(this._dependencies, item);
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
}
exports.SimpleAIClient = SimpleAIClient;
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map