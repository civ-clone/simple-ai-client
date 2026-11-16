// Civ1: the AI's government (civ-clone/web-renderer#231), after v474.05's AI: OpenCivOne `AIEngine.cs`
//  `F0_25fb_0004_RecalculateStatsAndPolicies`, L340-366, every eighth turn (staggered by player), in this order:
//  1. Despotism, while what the player's cities spend supporting units would be free under it and outweighs what
//     Despotism costs their best tiles (`Var_e3c2`, summed in `CityWorker.cs` L1912-1916 and L3749-3752);
//  2. The Republic, if known, while its trade outweighs the unhappiness of the units away from home (`Var_db42`,
//     `CityWorker.cs` L1918-1925 and L3757-3760: `republicScore` below);
//  3. Communism, if known, with more than 10 cities;
//  4. Monarchy, if known.
// It never chooses Democracy. The original changes government on the spot, with no Anarchy
//  (`Diplomacy.cs` `F0_2517_04a1_ChangeCurrentGovernment`, L192ff, the AI's branch).
//
// Here, as for a human player, every change is a revolution and a spell of Anarchy. The revolution is the loaded
//  ruleset's, whichever it is: its `RevolutionTerms` rule (`base-government-change`) names its save key and interim
//  government, and `base-government-change`'s `lib/revolution` starts and finishes it as the ruleset's own wrappers do
//  (civ1-government's for Civ1, civ2-government's for Civ2). With no such rule the player never revolts. So:
//  - the player leaves Despotism as soon as it knows any other government, and never goes back to it by choice: step 1
//    would cost it Anarchy twice over, to and from it (and the save that raised the issue had a player stuck in it);
//  - once out of Despotism, it changes government only when the choice above comes out differently, and no sooner than
//    the policy's `revolutionTurns` after its last revolution;
//  - with none of 2-4 to choose, it takes the first of Monarchy, Communism and The Republic it knows, and Democracy only
//    when it knows none of those: Civ1's Democracy needs Philosophy and Literacy, not The Republic, so it can be the
//    first government a player learns, where the original would stay in Despotism.
import { isA } from '@civ-clone/core-unit/traits';
import {
  Communism,
  Democracy,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  chooseGovernment,
  pendingRevolution,
  revolution,
} from '@civ-clone/base-government-change/lib/revolution';
import { Air } from '@civ-clone/library-unit/Types';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import { Marketplace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import { PendingEffect } from '@civ-clone/core-pending-effect';
import MilitaryUnhappinessTolerance from '@civ-clone/base-leader-personality/Rules/Player/MilitaryUnhappinessTolerance';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Trade } from '@civ-clone/library-city/Yields';
import Unit from '@civ-clone/core-unit/Unit';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import { Terms } from '@civ-clone/base-government-change/Rules/RevolutionTerms';
import { rechoiceKey } from '@civ-clone/base-government-change/lib/rechoice';
import { revolutionTerms } from '@civ-clone/base-government-change/lib/terms';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { sum } from '@civ-clone/base-leader-personality/lib/combine';

export interface GovernmentPolicy {
  // The fewest turns between one revolution and the next, once out of Despotism.
  revolutionTurns: number;
}

export const defaultGovernmentPolicy: GovernmentPolicy = {
  revolutionTurns: 40,
};

// The turn of each player's last revolution, by its `PlayerGovernment`.
const lastRevolution = new WeakMap<PlayerGovernment, number>();

// v474.05's case for The Republic: for each of the player's cities, a point for each tile it works that gives trade
//  (The Republic adds one to each), less, for each unit of the city's that can attack and is away from it (or is an
//  aircraft), 7 − Ideology, or 5 − Ideology with a Marketplace: each such unit makes a citizen unhappy under The
//  Republic. Ideology is the leader's `MilitaryUnhappinessTolerance` (`base-leader-personality`). 0 or more favours
//  The Republic.
export const republicScore = (
  dependencies: Dependencies,
  player: Player
): number => {
  const tolerance = sum(
    dependencies.ruleRegistry,
    MilitaryUnhappinessTolerance,
    player
  );

  return dependencies.cityRegistry
    .getByPlayer(player)
    .reduce((total: number, city: City): number => {
      // What each square gives the city (`City#tileYields`), as the ruleset may change a square for its city.
      const rules = city.tileYieldRules(),
        tradeTiles = dependencies.workedTileRegistry
          .getByCity(city)
          .filter(
            (workedTile: WorkedTile): boolean =>
              reduceYield(city.tileYields(workedTile.tile(), rules), Trade) > 0
          ).length,
        unitsAway = dependencies.unitRegistry
          .getByCity(city)
          .filter(
            (unit: Unit): boolean =>
              unit.attack().value() > 0 &&
              (isA(unit, Air) || unit.tile() !== city.tile())
          ).length,
        perUnit =
          (dependencies.cityImprovementRegistry
            .getByCity(city)
            .some((improvement) => improvement instanceof Marketplace)
            ? 5
            : 7) - tolerance;

      return total + tradeTiles - perUnit * unitsAway;
    }, 0);
};

// The government the player would choose of those `available` to it.
export const preferredGovernment = (
  dependencies: Dependencies,
  player: Player,
  available: (typeof Government)[]
): typeof Government => {
  const knows = (GovernmentType: typeof Government): boolean =>
    available.includes(GovernmentType);

  if (knows(Republic) && republicScore(dependencies, player) >= 0) {
    return Republic;
  }

  if (
    knows(Communism) &&
    dependencies.cityRegistry.getByPlayer(player).length > 10
  ) {
    return Communism;
  }

  return [Monarchy, Communism, Republic, Democracy].find(knows) ?? Despotism;
};

const playerGovernmentOf = (
  dependencies: Dependencies,
  player: Player
): PlayerGovernment =>
  dependencies.playerGovernmentRegistry.getByPlayer(player);

// The loaded ruleset's revolution (`RevolutionTerms`), or `null` with a warning, once per rule registry, when there is
//  none: no ruleset registered one, or two copies of base-government-change are installed and the rule is the other
//  copy's class.
const warnedNoTerms = new WeakSet<RuleRegistry>();

export const termsFor = (dependencies: Dependencies): Terms | null => {
  const terms = revolutionTerms(dependencies.ruleRegistry);

  if (terms === null && !warnedNoTerms.has(dependencies.ruleRegistry)) {
    warnedNoTerms.add(dependencies.ruleRegistry);

    console.warn(
      'simple-ai-client: no `RevolutionTerms` rule (base-government-change), so computer players cannot change government.'
    );
  }

  return terms;
};

// The revolution the player would start now, if any: the ruleset's terms, its `PlayerGovernment` and the government it
//  would choose, while it isn't in a revolution or the interim already, and it wants another government (never back
//  to Despotism), no sooner than the policy's `revolutionTurns` after its last revolution once out of Despotism.
const revolutionWanted = (
  dependencies: Dependencies,
  player: Player,
  policy: GovernmentPolicy
): {
  terms: Terms;
  playerGovernment: PlayerGovernment;
  preferred: typeof Government;
} | null => {
  const terms = termsFor(dependencies);

  if (terms === null) {
    return null;
  }

  const playerGovernment = playerGovernmentOf(dependencies, player),
    turn = dependencies.turn.value(),
    last = lastRevolution.get(playerGovernment);

  if (
    playerGovernment.is(terms.Interim) ||
    pendingRevolution(
      terms.key,
      playerGovernment,
      dependencies.pendingEffectRegistry
    ) !== null ||
    (!playerGovernment.is(Despotism) &&
      last !== undefined &&
      turn - last < policy.revolutionTurns)
  ) {
    return null;
  }

  const preferred = preferredGovernment(
    dependencies,
    player,
    playerGovernment.available()
  );

  if (playerGovernment.is(preferred) || preferred === Despotism) {
    return null;
  }

  return { terms, playerGovernment, preferred };
};

// At the start of the player's turn: a revolution if it would choose another government than the one it has, through
//  the ruleset's interim government (Anarchy) like a human player, then `ChooseGovernment` once it's over.
export const startRevolution = (
  dependencies: Dependencies,
  player: Player,
  policy: GovernmentPolicy = defaultGovernmentPolicy
): void => {
  const wanted = revolutionWanted(dependencies, player, policy);

  if (wanted === null) {
    return;
  }

  const { terms, playerGovernment } = wanted;

  lastRevolution.set(playerGovernment, dependencies.turn.value());

  revolution(
    terms.key,
    terms.Interim,
    playerGovernment,
    dependencies.pendingEffectRegistry,
    dependencies.ruleRegistry,
    dependencies.turn,
    'chosen'
  );
};

// The offer of a revolution when an advance makes `GovernmentType` available (`player:government:available`, from
//  base-government-change's `offerGovernments`; Civ2's rules make it, Civ1's don't). The player takes it when it's
//  the government it would start a revolution for now (`startRevolution`'s choice, a turn sooner), and declines it
//  otherwise. Taking it is what civ2-government's `acceptRevolutionOffer` does, through the ruleset's
//  `RevolutionTerms`: the record of a government chosen this turn is dropped first, so the revolution always has its
//  interim (Anarchy), as the original's offer does. Answers whether it took the offer.
export const acceptRevolutionOffer = (
  dependencies: Dependencies,
  player: Player,
  GovernmentType: typeof Government,
  policy: GovernmentPolicy = defaultGovernmentPolicy
): boolean => {
  const wanted = revolutionWanted(dependencies, player, policy);

  if (wanted === null || wanted.preferred !== GovernmentType) {
    return false;
  }

  const { terms, playerGovernment } = wanted;

  lastRevolution.set(playerGovernment, dependencies.turn.value());

  // As civ2-government's `acceptRevolutionOffer` does. For a computer player this drops nothing today: the record is
  //  only written while a `MayRechoose` rule lets the player choose again, and civ2-government's lets only persons.
  dependencies.pendingEffectRegistry
    .getByTarget(playerGovernment)
    .filter(
      (pendingEffect: PendingEffect): boolean =>
        pendingEffect.handler() === rechoiceKey(terms.key)
    )
    .forEach((pendingEffect: PendingEffect): void =>
      dependencies.pendingEffectRegistry.unregister(pendingEffect)
    );

  revolution(
    terms.key,
    terms.Interim,
    playerGovernment,
    dependencies.pendingEffectRegistry,
    dependencies.ruleRegistry,
    dependencies.turn,
    'chosen'
  );

  return true;
};

// Once the interim is over: the government it would choose now. Whatever started the revolution (this player's
//  choice, or its cities' disorder), it is the ruleset's, under its key. `false` when the ruleset names no revolution,
//  so the choice is left unmade.
export const pickGovernment = (
  dependencies: Dependencies,
  playerGovernment: PlayerGovernment
): boolean => {
  const terms = termsFor(dependencies);

  if (terms === null) {
    return false;
  }

  chooseGovernment(
    terms.key,
    playerGovernment,
    preferredGovernment(
      dependencies,
      playerGovernment.player(),
      playerGovernment.available()
    ),
    dependencies.pendingEffectRegistry,
    dependencies.turn
  );

  return true;
};
