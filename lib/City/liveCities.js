"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveCities = void 0;
const liveCities = (dependencies) => dependencies.cityRegistry
    .entries()
    .filter((city) => !city.destroyed());
exports.liveCities = liveCities;
exports.default = exports.liveCities;
//# sourceMappingURL=liveCities.js.map