// Generic: the chance an attack wins, for a ruleset whose battles are fought in rounds (a `CombatResolver` rule is
//  registered, as base-combat-rounds' is in Civ2). Without one, `Attack` keeps its single roll and `scoreUnitMove`
//  keeps comparing strengths as it always has, so a game with no resolver (Civ1) never comes here.
import {
  combatOdds,
  rollRange,
} from '@civ-clone/base-combat-rounds/lib/rounds';
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import CombatResolver from '@civ-clone/core-unit/Rules/CombatResolver';
import DefenderRank from '@civ-clone/core-unit/Rules/DefenderRank';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { applyCombatModifiers } from '@civ-clone/base-combat-rounds/lib/CombatModifiers';
import { combatTerms } from '@civ-clone/base-combat-rounds/lib/combatRoundsRules';
import strength from '@civ-clone/core-unit/strength';

// The steps a strength of 1 is rolled in. base-combat-rounds leaves the scale to the ruleset's resolver and doesn't
//  say what it is, so the odds are worked out at 8 steps to 1, Civilization II's (`unit_attack_strength`). Another
//  scale moves the odds only through ties, which go to the defender.
export const ODDS_STRENGTH_SCALE = 8;

// The odds a unit attacks at: a little better than even, so a battle it's sent into is one it expects to win.
export const ATTACK_ODDS = 0.6;

// The odds a unit attacks at when the enemy stands next to one of its player's cities: the alternative is the enemy
//  attacking the city, so a fair chance is worth taking.
export const DEFEND_CITY_ODDS = 0.25;

// Whether battles are fought in rounds: a `CombatResolver` rule is registered.
export const fightsInRounds = (ruleRegistry: RuleRegistry): boolean =>
  ruleRegistry.get(CombatResolver).length > 0;

// The unit on `tile` that would defend against `attacker`, and the strengths they'd fight at, as `Attack` chooses it:
//  the best `DefenderRank` score when there are such rules, otherwise the strongest defence. Equal scores keep the
//  square's order.
export const defenderFor = (
  ruleRegistry: RuleRegistry,
  attacker: Unit,
  tileUnits: Unit[]
): [Unit, Attack, Defence] | null => {
  const ranked = ruleRegistry.get(DefenderRank).length > 0;

  return (
    tileUnits
      .map((candidate: Unit): [[Unit, Attack, Defence], number] => {
        const [attack, defence] = strength(attacker, candidate, ruleRegistry);

        if (!ranked) {
          return [[candidate, attack, defence], defence.value()];
        }

        const answer = ruleRegistry
            .process(DefenderRank, attacker, candidate, attack, defence)
            .find((score: number | undefined): boolean => score !== undefined),
          score = answer === undefined ? defence.value() : answer;

        return [
          [candidate, attack, defence],
          Number.isNaN(score) ? -Infinity : score,
        ];
      })
      .sort(([, a], [, b]): number => (a === b ? 0 : b > a ? 1 : -1))
      .map(([candidate]) => candidate)[0] ?? null
  );
};

// The chance `attacker` beats whichever unit defends `tile`, from the terms the battle would be fought at (strengths
//  after the ruleset's `CombatModifiers`, the attack scaled by the moves it has left, and both sides' firepower) and
//  the hit points each has left. 0 with no one there to fight.
export const attackOdds = (
  dependencies: Dependencies,
  attacker: Unit,
  tile: Tile
): number => {
  const { ruleRegistry } = dependencies,
    defending = defenderFor(
      ruleRegistry,
      attacker,
      dependencies.unitRegistry.getByTile(tile)
    );

  if (defending === null) {
    return 0;
  }

  const [defender, attack, defence] = defending,
    terms = applyCombatModifiers(
      ruleRegistry,
      attacker,
      defender,
      combatTerms(
        attacker,
        defender,
        attack,
        defence,
        Math.min(1, attacker.moves().value())
      )
    ),
    [attackerHitPoints] = attacker.hitPoints(),
    [defenderHitPoints] = defender.hitPoints();

  return combatOdds(
    rollRange(terms.attack, ODDS_STRENGTH_SCALE),
    rollRange(terms.defence, ODDS_STRENGTH_SCALE),
    attackerHitPoints,
    defenderHitPoints,
    Math.max(0, terms.attackerFirepower),
    Math.max(0, terms.defenderFirepower)
  );
};

// The odds `player` attacks `tile` at (`ATTACK_ODDS`), or `DEFEND_CITY_ODDS` when the enemy there is next to one of its
//  cities.
export const oddsWanted = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): number =>
  tile
    .getNeighbours()
    .some(
      (neighbour: Tile): boolean =>
        dependencies.cityRegistry.getByTile(neighbour)?.player() === player
    )
    ? DEFEND_CITY_ODDS
    : ATTACK_ODDS;

export default attackOdds;
