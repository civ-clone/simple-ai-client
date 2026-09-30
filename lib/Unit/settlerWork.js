"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlerWork = void 0;
const settlerWork = (dependencies, player, memory, knowledge, unit, tile, target, { buildIrrigation, buildMine, buildRoad, foundCity }) => {
    if (foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) {
        unit.action(foundCity);
    }
    else if (buildIrrigation &&
        knowledge.shouldIrrigate(dependencies, player, tile)) {
        unit.action(buildIrrigation);
    }
    else if (buildMine && knowledge.shouldMine(dependencies, player, tile)) {
        unit.action(buildMine);
    }
    else if (buildRoad && knowledge.shouldRoad(dependencies, player, tile)) {
        unit.action(buildRoad);
    }
    else if (!target && memory.targets.goodSitesForCities.length) {
        memory.unitTargetData.set(unit, memory.targets.goodSitesForCities.shift());
    }
};
exports.settlerWork = settlerWork;
exports.default = exports.settlerWork;
//# sourceMappingURL=settlerWork.js.map