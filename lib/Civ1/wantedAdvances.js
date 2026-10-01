"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1WantedAdvances = void 0;
// Civ1: the advances each leader wants before it stops researching (civ-clone/web-renderer#25, step 3; #155).
//
// v474.05 stops every AI's science at Robotics. Here Robotics is only where the shortest list ends:
//  - Militaristic leaders (Ideology −1) want nothing beyond it. Genghis Khan stops at Robotics, as in Civ1;
//  - normal militarism adds Recycling and Nuclear Power, which keep cities productive and clean. Gandhi carries on
//    until he has both;
//  - Civilized leaders (Ideology 1) add those and the advances behind the late Wonders and the spaceship: Computers,
//    Genetic Engineering, Space Flight, Plastics, Superconductor and Fusion Power;
//  - a Friendly mood adds Recycling and Nuclear Power, even to a Militaristic leader;
//  - an Aggressive mood, and a leader's policy (Perfectionist to Expansionist), add nothing.
// Future Technology (civ-clone/web-renderer#128) is never wanted.
//
// A variant changes what its leaders want by passing its own table.
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Aggressive_1 = require("@civ-clone/base-leader-trait-aggression/Aggression/Aggressive");
const Civilized_1 = require("@civ-clone/base-leader-trait-militarism/Militarism/Civilized");
const Friendly_1 = require("@civ-clone/base-leader-trait-aggression/Aggression/Friendly");
const Militaristic_1 = require("@civ-clone/base-leader-trait-militarism/Militarism/Militaristic");
const Normal_1 = require("@civ-clone/base-leader-trait-militarism/Militarism/Normal");
const productiveAndClean = [Advances_1.Recycling, Advances_1.NuclearPower];
exports.civ1WantedAdvances = {
    always: [Advances_1.Robotics],
    byTrait: [
        [Militaristic_1.default, []],
        [Normal_1.default, productiveAndClean],
        [
            Civilized_1.default,
            [
                ...productiveAndClean,
                Advances_1.Computers,
                Advances_1.GeneticEngineering,
                Advances_1.SpaceFlight,
                Advances_1.Plastics,
                Advances_1.Superconductor,
                Advances_1.FusionPower,
            ],
        ],
        [Friendly_1.default, productiveAndClean],
        [Aggressive_1.default, []],
    ],
};
exports.default = exports.civ1WantedAdvances;
//# sourceMappingURL=wantedAdvances.js.map