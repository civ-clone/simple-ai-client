"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.airWanted = exports.planAirTask = exports.paradropTarget = exports.nuclearTarget = exports.raidTarget = exports.fighterTarget = exports.canStrike = exports.isAggressive = exports.AIR_NEEDS = exports.MAX_PARATROOPERS = exports.PARATROOPERS_PER_CITY = exports.NUCLEAR_WANTED = exports.MAX_MISSILES = exports.MISSILES_PER_CITY = exports.MAX_STRIKERS = exports.STRIKERS_PER_CITY = exports.LAND_THREAT_DISTANCE = exports.AIR_THREAT_DISTANCE = exports.PARADROP_RANGE = exports.isParatrooperType = exports.airKindOf = void 0;
// Generic: aircraft, missiles, nuclear weapons and paratroopers at war (civ-clone/web-renderer#1124). Only for a ruleset
//  that says what each unit type is for with base-unit-role's `UnitRoles` (Civ2's `@UNITS` roles): a ruleset that
//  declares no roles (Civ1) has none of these kinds, so its aircraft do what they always have.
//
// After the original's computer players (OpenCiv2 `ai.cpp`), in our own terms:
//  - a **fighter** (an air superiority type) goes for the nearest enemy unit it would beat, alone or in the air, nearer
//    for a unit with a range or a lone one, when it can strike and still get back to refuel (`ai_air_pick_target`,
//    `ai_air_strike_target`, `:2575-2747`); otherwise it waits in, or flies back to, the nearest of its player's cities;
//  - a **bomber**, helicopter or cruise missile (an attack type that flies) raids the enemy city in reach this turn that
//    scores best: its size × 10, less 25 for each unit there, 40 more on the landmass the unit is over, 60 more for each
//    of its player's units beside it (`ai_air_raid_city`, `:2490`), then flies back to refuel;
//  - a **nuclear weapon** (a type that `Detonates`), only for a leader whose attack trait is aggressive, goes for the
//    enemy city the original's `ai_nuke_pick_target` (`:2335`) would: larger than 4, without an SDI Defence, of a
//    player at war whose military is half its own or more (and has no nuclear weapons), or half again as large, scored
//    by the enemy units around it, less 2 for each square of its own and 99 for each of a third player not at war, plus
//    half its size; only from a player with two or more, and only once the score reaches 10 (less for a player with
//    fewer than 5 cities);
//  - a **paratrooper** (a type that can `Paradrop`), unmoved in its player's city, drops into an empty enemy city at war
//    within its range, or beside it (`ai_orders_paratrooper`, `:3315`); otherwise it stays.
// An enemy is a player with no treaty (`isEnemy`), barbarians included; nuclear weapons and paratroopers want a war.
const Types_1 = require("@civ-clone/library-unit/Types");
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const attackOdds_1 = require("./attackOdds");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const traits_1 = require("@civ-clone/core-unit/traits");
const Aggressive_1 = require("@civ-clone/base-leader-trait-aggression/Aggression/Aggressive");
const AttackEndsTurn_1 = require("@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn");
const Detonates_1 = require("@civ-clone/base-unit-trait-detonates/Detonates");
const Paradrop_1 = require("@civ-clone/base-unit-trait-paradrop/Paradrop");
const Path_1 = require("@civ-clone/core-world-path/Path");
const SdiDefence_1 = require("@civ-clone/base-city-improvement-sdidefence/SdiDefence");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const explorers_1 = require("../City/explorers");
const fuel_1 = require("./fuel");
const rivals_1 = require("../Player/rivals");
const leaderTraits_1 = require("@civ-clone/base-leader-personality/lib/leaderTraits");
const rivals_2 = require("../Player/rivals");
const fuelRules_1 = require("@civ-clone/base-unit-fuel/lib/fuelRules");
// What `UnitType` (a class) is for in the air, by the ruleset's roles, or `null` for a type that doesn't fly or has no
//  role.
const airKindOf = (UnitType, ruleRegistry) => {
    if (!Object.prototype.isPrototypeOf.call(Types_1.Air, UnitType)) {
        return null;
    }
    const Type = UnitType;
    if ((0, roleOf_1.roleOf)(Type, ruleRegistry) === null) {
        return null;
    }
    if ((0, traits_1.hasTrait)(Type, Detonates_1.default, ruleRegistry)) {
        return 'nuclear';
    }
    if ((0, roleOf_1.hasRole)(Type, Roles_1.AirSuperiorityRole, ruleRegistry)) {
        return 'fighter';
    }
    if (!(0, roleOf_1.hasRole)(Type, Roles_1.AttackRole, ruleRegistry)) {
        return null;
    }
    return (0, traits_1.hasTrait)(Type, SingleUse_1.default, ruleRegistry) ? 'missile' : 'striker';
};
exports.airKindOf = airKindOf;
// Whether `UnitType` is a paratrooper: a type with a role that can `Paradrop`.
const isParatrooperType = (UnitType, ruleRegistry) => (0, roleOf_1.roleOf)(UnitType, ruleRegistry) !== null &&
    (0, traits_1.hasTrait)(UnitType, Paradrop_1.default, ruleRegistry);
exports.isParatrooperType = isParatrooperType;
// The range of a paratrooper's drop, @COSMIC's 10 in Civ2.
exports.PARADROP_RANGE = 10;
// How far (in tiles) an enemy aircraft from one of a player's cities makes the city want a fighter, and how far an
//  enemy land unit.
exports.AIR_THREAT_DISTANCE = 8;
exports.LAND_THREAT_DISTANCE = 3;
// Strikers (bombers, helicopters) a player wants for each 3 of its cities while an enemy city is in reach, and the most.
exports.STRIKERS_PER_CITY = 1 / 3;
exports.MAX_STRIKERS = 4;
// Cruise missiles a player wants for each 4 of its cities while an enemy city is in reach, and the most.
exports.MISSILES_PER_CITY = 1 / 4;
exports.MAX_MISSILES = 2;
// The nuclear weapons a player keeps while a target is in reach: the original fires only with two or more.
exports.NUCLEAR_WANTED = 2;
// Paratroopers a player wants for each 4 of its cities while a weakly held enemy city is in drop range, and the most.
exports.PARATROOPERS_PER_CITY = 1 / 4;
exports.MAX_PARATROOPERS = 2;
// What each kind scores in production when the player has none of those it wants (`ProductionPolicy#needs`'s scale).
exports.AIR_NEEDS = {
    fighter: 2,
    striker: 2,
    missile: 1,
    nuclear: 2,
    paratrooper: 1,
};
// Whether `player`'s leader's attack trait is aggressive (base-leader-trait-aggression's `Aggressive`).
const isAggressive = (dependencies, player) => (0, leaderTraits_1.default)(dependencies.traitRegistry, player).some((trait) => trait instanceof Aggressive_1.default);
exports.isAggressive = isAggressive;
const atWar = (dependencies, player, other) => other !== player &&
    (0, treatyLevel_1.treatyLevel)(dependencies, player, other) === treatyLevel_1.TreatyLevel.War;
const hostile = (dependencies, player, other) => other !== player && (0, rivals_1.isEnemy)(dependencies, player, other);
// The squares `unit` can refuel on: its player's cities and the squares its player's other units are on (a carrier),
//  wherever the ruleset's `Refuel` rules say it refuels.
const refuellingTiles = (dependencies, player, unit) => [
    ...new Set([
        ...dependencies.cityRegistry
            .getByPlayer(player)
            .map((city) => city.tile()),
        ...dependencies.unitRegistry
            .getByPlayer(player)
            .filter((other) => other !== unit && !other.destroyed())
            .map((other) => other.tile()),
    ]),
].filter((tile) => (0, fuelRules_1.refuels)(dependencies.ruleRegistry, unit, tile));
// How far `tile` is from the nearest square `unit` refuels on: `Infinity` with none.
const homeDistance = (dependencies, player, unit, tile, home = refuellingTiles(dependencies, player, unit)) => home.reduce((nearest, other) => Math.min(nearest, tile.distanceFrom(other)), Infinity);
// Whether `unit` could strike `target` this turn and still get back to refuel before its fuel runs out: a missile only
//  needs to reach it; a unit whose attack ends its turn (a bomber) has its later turns' moves; another (a fighter) the
//  moves it has left after the strike. A unit with no fuel (a helicopter) can always.
const canStrike = (dependencies, player, unit, target) => {
    const distance = target.distanceFrom(unit.tile()), moves = Math.floor(unit.moves().value());
    if (distance > moves) {
        return false;
    }
    const state = (0, fuel_1.fuelFor)(dependencies, unit);
    if (state === null || unit.hasTrait(SingleUse_1.default)) {
        return true;
    }
    const left = unit.hasTrait(AttackEndsTurn_1.default)
        ? state.reach - unit.moves().value()
        : state.reach - distance;
    // From beside the target, where it strikes from.
    return homeDistance(dependencies, player, unit, target) - 1 <= left;
};
exports.canStrike = canStrike;
// Sets `unit` off for the first of `ranked` it has a path to. Returns whether there was one.
const flyTo = (dependencies, memory, unit, ranked) => {
    for (const tile of ranked) {
        if (tile === unit.tile()) {
            memory.unitPathData.delete(unit);
            return true;
        }
        const path = Path_1.default.for(unit, unit.tile(), tile, dependencies.pathFinderRegistry);
        if (path) {
            memory.unitPathData.set(unit, path);
            return true;
        }
    }
    return false;
};
// The squares beside `target` `unit` could strike from, nearest it first: a square with another player's units on it
//  can't be moved to.
const besideFor = (dependencies, player, unit, target) => target
    .getNeighbours()
    .filter((tile) => dependencies.unitRegistry
    .getByTile(tile)
    .every((other) => other.player() === player))
    .sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile()));
// The enemy unit `unit`, a fighter, goes for: on the target board, a unit in the air or alone on its square, that it
//  would beat, the nearest by the original's score (twice the distance, 1 less for one with a range, 1 less again for
//  one alone). `null` with none.
const fighterTarget = (dependencies, player, memory, unit) => {
    let best = null, bestScore = Infinity;
    memory.targets.enemyUnitsToAttack.forEach((tile) => {
        const units = dependencies.unitRegistry
            .getByTile(tile)
            .filter((other) => !other.destroyed()), enemies = units.filter((other) => hostile(dependencies, player, other.player()));
        if (enemies.length === 0 || enemies.length !== units.length) {
            return;
        }
        const flying = enemies.some((other) => (0, traits_1.isA)(other, Types_1.Air));
        if (!flying && units.length > 1) {
            return;
        }
        if ((0, attackOdds_1.attackOdds)(dependencies, unit, tile) < attackOdds_1.ATTACK_ODDS) {
            return;
        }
        const score = tile.distanceFrom(unit.tile()) * 2 -
            (enemies.some((other) => (0, fuel_1.fuelFor)(dependencies, other) !== null)
                ? 1
                : 0) -
            (units.length === 1 ? 1 : 0);
        if (score < bestScore) {
            bestScore = score;
            best = tile;
        }
    });
    return best;
};
exports.fighterTarget = fighterTarget;
// The enemy city `unit`, a bomber, helicopter or missile, raids this turn: in its reach, defended (a city with no one
//  in it is for land units to take), one it would beat, scoring best by the original's `ai_air_raid_city`. `null` with
//  none.
const raidTarget = (dependencies, player, memory, unit) => {
    const own = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other) => !other.destroyed())
        .map((other) => other.tile()), over = unit.tile().isLand()
        ? (0, explorers_1.continentOf)(dependencies.turn.value(), unit.tile())
        : null;
    let best = null, bestScore = -Infinity;
    [
        ...memory.targets.enemyCitiesToAttack,
        ...memory.targets.citiesToLiberate,
    ].forEach((tile) => {
        const city = dependencies.cityRegistry.getByTile(tile), defenders = dependencies.unitRegistry
            .getByTile(tile)
            .filter((other) => !other.destroyed());
        if (city === null ||
            !hostile(dependencies, player, city.player()) ||
            defenders.length === 0 ||
            !(0, exports.canStrike)(dependencies, player, unit, tile) ||
            (0, attackOdds_1.attackOdds)(dependencies, unit, tile) < attackOdds_1.ATTACK_ODDS) {
            return;
        }
        const score = dependencies.cityGrowthRegistry.getByCity(city).size() * 10 -
            25 * defenders.length +
            ((over === null || over === void 0 ? void 0 : over.has(tile)) ? 40 : 0) +
            60 *
                tile
                    .getNeighbours()
                    .filter((neighbour) => own.includes(neighbour)).length;
        if (score >= bestScore) {
            bestScore = score;
            best = tile;
        }
    });
    return best;
};
exports.raidTarget = raidTarget;
// Whether `city` has an SDI Defence, which stops a nuclear attack near it.
const hasSdi = (dependencies, city) => dependencies.cityImprovementRegistry
    .getByCity(city)
    .some((improvement) => improvement instanceof SdiDefence_1.default);
// The enemy city `unit`, a nuclear weapon, goes for, after the original's `ai_nuke_pick_target`; `null` with none, or
//  when its player's leader isn't aggressive, or it has fewer than 2 such weapons.
const nuclearTarget = (dependencies, player, unit) => {
    if (!(0, exports.isAggressive)(dependencies, player)) {
        return null;
    }
    const ownNuclear = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other) => !other.destroyed() &&
        (0, exports.airKindOf)(other.constructor, dependencies.ruleRegistry) === 'nuclear').length;
    if (ownNuclear < 2) {
        return null;
    }
    const ownCities = dependencies.cityRegistry.getByPlayer(player), ownPower = (0, rivals_2.powerOfPlayer)(dependencies, player), reach = Math.floor(unit.movement().value()), hasNuclear = (other) => dependencies.unitRegistry
        .getByPlayer(other)
        .some((otherUnit) => !otherUnit.destroyed() && otherUnit.hasTrait(Detonates_1.default));
    let best = null, bestScore = -1;
    dependencies.cityRegistry.entries().forEach((city) => {
        const owner = city.player(), size = dependencies.cityGrowthRegistry.getByCity(city).size();
        if (owner === player ||
            !atWar(dependencies, player, owner) ||
            size <= 4 ||
            hasSdi(dependencies, city)) {
            return;
        }
        const theirPower = (0, rivals_2.powerOfPlayer)(dependencies, owner);
        if (!(theirPower * 2 >= ownPower * 3 ||
            (!hasNuclear(owner) && theirPower * 2 >= ownPower))) {
            return;
        }
        let score = Math.floor(size / 2);
        [city.tile(), ...city.tile().getNeighbours()].forEach((tile) => {
            const units = dependencies.unitRegistry
                .getByTile(tile)
                .filter((other) => !other.destroyed());
            if (units.length === 0) {
                return;
            }
            const tileOwner = units[0].player();
            if (tileOwner === player) {
                score -= 2;
            }
            else if (atWar(dependencies, player, tileOwner)) {
                score += units.length;
            }
            else {
                score -= 99;
            }
        });
        if (score > bestScore &&
            ownCities.some((own) => own.tile().distanceFrom(city.tile()) <= reach)) {
            bestScore = score;
            best = city.tile();
        }
    });
    return best !== null &&
        bestScore >= 10 - Math.max(0, 5 - ownCities.length) &&
        (0, exports.canStrike)(dependencies, player, unit, best)
        ? best
        : null;
};
exports.nuclearTarget = nuclearTarget;
// Where `unit`, a paratrooper in its player's city with all its moves, drops: an empty city of a player at war within
//  its range, the largest, onto the city itself or, failing that, the empty square beside it furthest from where it
//  stands (the original also counts the square's defence and a fortress there, which aren't read here); `null` with
//  none, or where one of its player's units is beside the city already, as the original.
const paradropTarget = (dependencies, player, unit) => {
    const from = unit.tile(), city = dependencies.cityRegistry.getByTile(from);
    if (city === null ||
        city.player() !== player ||
        unit.moves().value() < unit.movement().value()) {
        return null;
    }
    const [target] = dependencies.cityRegistry
        .entries()
        .filter((other) => atWar(dependencies, player, other.player()) &&
        other.tile().distanceFrom(from) <= exports.PARADROP_RANGE &&
        dependencies.unitRegistry
            .getByTile(other.tile())
            .every((other) => other.destroyed()))
        .sort((a, b) => dependencies.cityGrowthRegistry.getByCity(b).size() -
        dependencies.cityGrowthRegistry.getByCity(a).size());
    if (!target) {
        return null;
    }
    const around = [target.tile(), ...target.tile().getNeighbours()].filter((tile) => tile.isLand() && tile.distanceFrom(from) <= exports.PARADROP_RANGE);
    if (around.some((tile) => dependencies.unitRegistry
        .getByTile(tile)
        .some((other) => other.player() === player && !other.destroyed()))) {
        return null;
    }
    const [best] = around
        .filter((tile) => dependencies.unitRegistry
        .getByTile(tile)
        .every((other) => other.destroyed()))
        .map((tile) => [
        tile,
        (tile === target.tile() ? 500 : 0) + tile.distanceFrom(from),
    ])
        .sort(([, a], [, b]) => b - a);
    return best ? best[0] : null;
};
exports.paradropTarget = paradropTarget;
// Gives `unit` (an aircraft, missile or nuclear weapon of a kind `airKindOf` knows) its task for the turn, with a path
//  where it moves (`memory.unitPathData`).
const planAirTask = (dependencies, player, memory, unit) => {
    const kind = (0, exports.airKindOf)(unit.constructor, dependencies.ruleRegistry);
    if (kind === null) {
        return null;
    }
    const target = kind === 'fighter'
        ? (0, exports.fighterTarget)(dependencies, player, memory, unit)
        : kind === 'nuclear'
            ? (0, exports.nuclearTarget)(dependencies, player, unit)
            : (0, exports.raidTarget)(dependencies, player, memory, unit);
    if (target !== null &&
        (kind !== 'fighter' || (0, exports.canStrike)(dependencies, player, unit, target))) {
        if (target.isNeighbourOf(unit.tile())) {
            memory.unitPathData.delete(unit);
            return { task: 'strike', target };
        }
        if (flyTo(dependencies, memory, unit, besideFor(dependencies, player, unit, target))) {
            return { task: 'strike', target };
        }
    }
    // Nothing to strike: where it refuels, or back to the nearest such square.
    const home = refuellingTiles(dependencies, player, unit);
    if (home.includes(unit.tile()) || (kind !== 'fighter' && home.length === 0)) {
        memory.unitPathData.delete(unit);
        return { task: 'stay', target: null };
    }
    if (flyTo(dependencies, memory, unit, [...home].sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())))) {
        return { task: 'home', target: null };
    }
    return { task: 'stay', target: null };
};
exports.planAirTask = planAirTask;
// What `player` wants of `kind`, given `city` could build one, as `[wanted, have]` (have counting those on order); `null`
//  when `city` shouldn't build one. `reach` is how far the kind reaches from the city in squares (its type's moves):
//  - a fighter while an enemy aircraft is within 8 of the city or an enemy land unit within 3: one more than the enemy
//    aircraft in reach of it, at most one for each of its player's cities;
//  - a bomber or helicopter while a defended enemy city is in reach: one for each 3 cities, at most 4; a cruise
//    missile the same, one for each 4 cities, at most 2;
//  - a nuclear weapon, for an aggressive leader, while a city larger than 4 of a player at war is in reach: 2;
//  - a paratrooper while a city of a player at war with at most one unit in it is in drop range: one for each 4
//    cities, at most 2.
const airWanted = (dependencies, player, targets, city, kind, reach) => {
    const cities = dependencies.cityRegistry.getByPlayer(player), units = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((unit) => !unit.destroyed()), isKind = (UnitType) => kind === 'paratrooper'
        ? (0, exports.isParatrooperType)(UnitType, dependencies.ruleRegistry)
        : (0, exports.airKindOf)(UnitType, dependencies.ruleRegistry) === kind, have = units.filter((unit) => isKind(unit.constructor)).length +
        cities.filter((other) => {
            const building = dependencies.cityBuildRegistry
                .getByCity(other)
                .building();
            return building !== null && isKind(building.item());
        }).length, near = (tile, distance) => tile.distanceFrom(city.tile()) <= distance, enemyCitiesNear = (distance, test) => [...targets.enemyCitiesToAttack, ...targets.citiesToLiberate]
        .map((tile) => dependencies.cityRegistry.getByTile(tile))
        .filter((other) => other !== null && near(other.tile(), distance) && test(other));
    if (kind === 'fighter') {
        const enemiesNear = targets.enemyUnitsToAttack.flatMap((tile) => dependencies.unitRegistry
            .getByTile(tile)
            .filter((other) => !other.destroyed() &&
            hostile(dependencies, player, other.player()))), aircraft = enemiesNear.filter((other) => (0, traits_1.isA)(other, Types_1.Air) && near(other.tile(), exports.AIR_THREAT_DISTANCE)), landThreat = enemiesNear.some((other) => (0, traits_1.isA)(other, Types_1.Land) && near(other.tile(), exports.LAND_THREAT_DISTANCE));
        if (aircraft.length === 0 && !landThreat) {
            return null;
        }
        // The original keeps fewer than the strongest person's bombers and helicopters + 2; with no person here, 1 more
        //  than the enemy aircraft in reach of its cities.
        return [Math.min(cities.length, aircraft.length + 1), have];
    }
    if (kind === 'paratrooper') {
        const weak = enemyCitiesNear(exports.PARADROP_RANGE, (other) => atWar(dependencies, player, other.player()) &&
            dependencies.unitRegistry
                .getByTile(other.tile())
                .filter((unit) => !unit.destroyed()).length <= 1);
        return weak.length === 0
            ? null
            : [
                Math.min(exports.MAX_PARATROOPERS, Math.ceil(cities.length * exports.PARATROOPERS_PER_CITY)),
                have,
            ];
    }
    if (kind === 'nuclear') {
        if (!(0, exports.isAggressive)(dependencies, player)) {
            return null;
        }
        const targets = enemyCitiesNear(reach, (other) => atWar(dependencies, player, other.player()) &&
            dependencies.cityGrowthRegistry.getByCity(other).size() > 4);
        return targets.length === 0 ? null : [exports.NUCLEAR_WANTED, have];
    }
    const defended = enemyCitiesNear(reach, (other) => hostile(dependencies, player, other.player()) &&
        dependencies.unitRegistry
            .getByTile(other.tile())
            .some((unit) => !unit.destroyed()));
    if (defended.length === 0) {
        return null;
    }
    return kind === 'missile'
        ? [
            Math.min(exports.MAX_MISSILES, Math.ceil(cities.length * exports.MISSILES_PER_CITY)),
            have,
        ]
        : [
            Math.min(exports.MAX_STRIKERS, Math.ceil(cities.length * exports.STRIKERS_PER_CITY)),
            have,
        ];
};
exports.airWanted = airWanted;
exports.default = exports.planAirTask;
//# sourceMappingURL=airWar.js.map