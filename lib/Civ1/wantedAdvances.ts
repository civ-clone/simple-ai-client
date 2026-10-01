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
import {
  Computers,
  FusionPower,
  GeneticEngineering,
  NuclearPower,
  Plastics,
  Recycling,
  Robotics,
  SpaceFlight,
  Superconductor,
} from '@civ-clone/civ1-science/Advances';
import Advance from '@civ-clone/core-science/Advance';
import Aggressive from '@civ-clone/base-leader-trait-aggression/Aggression/Aggressive';
import Civilized from '@civ-clone/base-leader-trait-militarism/Militarism/Civilized';
import Friendly from '@civ-clone/base-leader-trait-aggression/Aggression/Friendly';
import Militaristic from '@civ-clone/base-leader-trait-militarism/Militarism/Militaristic';
import NormalMilitarism from '@civ-clone/base-leader-trait-militarism/Militarism/Normal';
import Trait from '@civ-clone/core-civilization/Trait';
import { WantedAdvancesPolicy } from '../Science/wantedAdvances';

const productiveAndClean = [Recycling, NuclearPower] as (typeof Advance)[];

export const civ1WantedAdvances: WantedAdvancesPolicy = {
  always: [Robotics] as (typeof Advance)[],
  byTrait: [
    [Militaristic, []],
    [NormalMilitarism, productiveAndClean],
    [
      Civilized,
      [
        ...productiveAndClean,
        Computers,
        GeneticEngineering,
        SpaceFlight,
        Plastics,
        Superconductor,
        FusionPower,
      ] as (typeof Advance)[],
    ],
    [Friendly, productiveAndClean],
    [Aggressive, []],
  ] as [typeof Trait, (typeof Advance)[]][],
};

export default civ1WantedAdvances;
