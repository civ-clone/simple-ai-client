// Generic: a leader's personality on the three axes v474.05's AI reads, each −1, 0 or 1, as OpenCivOne names them:
//  - Mood: Friendly (−1), normal or Aggressive (1), from `Aggression`;
//  - Policy: Perfectionist (−1), normal or Expansionist (1), from `Development`;
//  - Ideology: Militaristic (−1), normal or Civilized (1), from `Militarism`, which is the other way round: Civilized is
//    `Militarism` 0.
// Each trait's value is 0, 0.5 or 1, and becomes −1, 0 or 1.
import Aggression from '@civ-clone/base-leader-trait-aggression/Aggression';
import Dependencies from './Dependencies';
import Development from '@civ-clone/base-leader-trait-development/Development';
import Leader from '@civ-clone/core-civilization/Leader';
import Militarism from '@civ-clone/base-leader-trait-militarism/Militarism';
import Player from '@civ-clone/core-player/Player';
import Trait from '@civ-clone/core-civilization/Trait';

// The class of the player's leader, or `null` for a player with no civilization or no leader yet.
const leaderOf = (player: Player): typeof Leader | null => {
  try {
    return player.civilization().leader()?.sourceClass<typeof Leader>() ?? null;
  } catch (e) {
    // `Player#civilization` throws until one is set.
    return null;
  }
};

// The traits of `player`'s leader, looked up by its class in the registry when asked rather than taken from the
//  leader, which keeps the ones registered when it was created.
export const leaderTraits = (
  dependencies: Dependencies,
  player: Player
): Trait[] => {
  const LeaderType = leaderOf(player);

  return LeaderType === null
    ? []
    : dependencies.traitRegistry.getByLeader(LeaderType);
};

// −1, 0 or 1 from the leader's `TraitType` trait, 0 if it has none.
const axis = (
  dependencies: Dependencies,
  player: Player,
  TraitType: typeof Trait
): number => {
  const trait = leaderTraits(dependencies, player).find(
    (trait: Trait): boolean => trait instanceof TraitType
  );

  return trait === undefined
    ? 0
    : Math.max(-1, Math.min(1, Math.round(trait.value() * 2 - 1)));
};

export const mood = (dependencies: Dependencies, player: Player): number =>
  axis(dependencies, player, Aggression);

export const policy = (dependencies: Dependencies, player: Player): number =>
  axis(dependencies, player, Development);

// `|| 0` so a normal leader is 0, not −0.
export const ideology = (dependencies: Dependencies, player: Player): number =>
  -axis(dependencies, player, Militarism) || 0;
