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
// Here, as for a human player, every change is a revolution and a spell of Anarchy (`civ1-government`), so:
//  - the player leaves Despotism as soon as it knows any other government, and never goes back to it by choice: step 1
//    would cost it Anarchy twice over, to and from it (and the save that raised the issue had a player stuck in it);
//  - once out of Despotism, it changes government only when the choice above comes out differently, and no sooner than
//    the policy's `revolutionTurns` after its last revolution;
//  - with none of 2-4 to choose, it takes the first of Monarchy, Communism and The Republic it knows, and Democracy only
//    when it knows none of those: Civ1's Democracy needs Philosophy and Literacy, not The Republic, so it can be the
//    first government a player learns, where the original would stay in Despotism.
import {
  Anarchy,
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
} from '@civ-clone/civ1-government/lib/revolution';
import { Air } from '@civ-clone/library-unit/Types';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Government from '@civ-clone/core-government/Government';
import { Marketplace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { Trade } from '@civ-clone/library-city/Yields';
import Unit from '@civ-clone/core-unit/Unit';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import { ideology } from '../traits';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

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
//  Republic. 0 or more favours The Republic.
export const republicScore = (
  dependencies: Dependencies,
  player: Player
): number => {
  const playerIdeology = ideology(dependencies, player);

  return dependencies.cityRegistry
    .getByPlayer(player)
    .reduce((total: number, city: City): number => {
      const tradeTiles = dependencies.workedTileRegistry
          .getByCity(city)
          .filter(
            (workedTile: WorkedTile): boolean =>
              reduceYield(workedTile.tile().yields(player), Trade) > 0
          ).length,
        unitsAway = dependencies.unitRegistry
          .getByCity(city)
          .filter(
            (unit: Unit): boolean =>
              unit.attack().value() > 0 &&
              (unit instanceof Air || unit.tile() !== city.tile())
          ).length,
        perUnit =
          (dependencies.cityImprovementRegistry
            .getByCity(city)
            .some((improvement) => improvement instanceof Marketplace)
            ? 5
            : 7) - playerIdeology;

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

// At the start of the player's turn: a revolution if it would choose another government than the one it has, through
//  Anarchy like a human player, then `ChooseGovernment` once it's over.
export const startRevolution = (
  dependencies: Dependencies,
  player: Player,
  policy: GovernmentPolicy = defaultGovernmentPolicy
): void => {
  const playerGovernment = playerGovernmentOf(dependencies, player),
    turn = dependencies.turn.value(),
    last = lastRevolution.get(playerGovernment);

  if (
    playerGovernment.is(Anarchy) ||
    pendingRevolution(playerGovernment, dependencies.pendingEffectRegistry) !==
      null ||
    (!playerGovernment.is(Despotism) &&
      last !== undefined &&
      turn - last < policy.revolutionTurns)
  ) {
    return;
  }

  const preferred = preferredGovernment(
    dependencies,
    player,
    playerGovernment.available()
  );

  if (playerGovernment.is(preferred) || preferred === Despotism) {
    return;
  }

  lastRevolution.set(playerGovernment, turn);

  revolution(
    playerGovernment,
    dependencies.pendingEffectRegistry,
    dependencies.ruleRegistry,
    dependencies.turn
  );
};

// Once the Anarchy is over: the government it would choose now.
export const pickGovernment = (
  dependencies: Dependencies,
  playerGovernment: PlayerGovernment
): void =>
  chooseGovernment(
    playerGovernment,
    preferredGovernment(
      dependencies,
      playerGovernment.player(),
      playerGovernment.available()
    ),
    dependencies.pendingEffectRegistry,
    dependencies.turn
  );
