// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out. The
//  exploring terms are `base-strategy-explore`'s, added in the order they always were around the others.
import { ferries, ferriesByCargo } from './carriesUnits';
import { isPassenger } from './overseas';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import {
  discoverableTilesTerm,
  goodyHutTerm,
  headingForTargetTerm,
  moveContext,
  moveGate,
  revisitTerm,
} from '@civ-clone/base-strategy-explore/lib/Unit/scoreExploration';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import {
  AbortMove,
  Overruled,
  SneakAttack,
  SneakMove,
} from '@civ-clone/library-unit/Actions';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { alliedCityAt } from '../Player/treaties';
import lookupActions from '@civ-clone/base-strategy-ai/lib/actionLookup';
import strength from '@civ-clone/core-unit/strength';
import attackOdds, { fightsInRounds, oddsWanted } from './attackOdds';
import worthSabotaging from './sabotage';

// What a step onto an ally's city is worth to a damaged unit: it's repaired there a little and its turn ends
//  (civ2-unit's `AlliedRepair`), better than a step worth nothing, worse than any job, battle or exploring.
export const ALLIED_REPAIR_SCORE = 8;

// Whether `lookup` (the actions on a tile) has the ruleset's repair in an ally's city (civ2-unit's `AlliedRepair`, offered
//  to the land units it covers), so that the repair is what a step there does. Other units keep their own actions there:
//  a Caravan's trade route or help with a Wonder, a Diplomat's embassy.
export const offersAlliedRepair = (lookup: {
  [name: string]: unknown;
}): boolean => lookup.alliedRepair !== undefined;

// Whether `unit` takes the repair on offer (`offersAlliedRepair`): only when it's damaged.
export const takesAlliedRepair = (unit: Unit): boolean => unit.damage() > 0;

export const scoreUnitMove = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile
): number => {
  const actions = unit.actions(tile),
    lookup = lookupActions(actions),
    {
      attack,
      buildIrrigation,
      buildMine,
      buildRoad,
      captureCity,
      disembark,
      embark,
      foundCity,
    } = lookup,
    sneakAttack = lookup.sneakAttack as SneakAttack | undefined,
    sneakMove = lookup.sneakMove as SneakMove | undefined,
    abortMove = lookup.abortMove as AbortMove | undefined,
    overruled = lookup.overruled as Overruled | undefined;

  // A computer player keeps its treaties (`breaksTreaty`), and doesn't walk onto a treaty partner's land
  //  (civ-clone/web-renderer#287) or try what a Senate would overrule.
  if (sneakAttack || sneakMove || abortMove || overruled) {
    return -10;
  }

  // An ally's city can't be entered (Civ2): where the step would be the repair, it's worth taking only to a damaged unit
  //  (`takesAlliedRepair`).
  if (
    offersAlliedRepair(lookup) &&
    alliedCityAt(dependencies, player, tile) !== null
  ) {
    return takesAlliedRepair(unit) ? ALLIED_REPAIR_SCORE : -10;
  }

  // A Spy steps onto another player's lone unit only to sabotage one worth it (`actionToTake`).
  if (
    lookup.sabotageUnit !== undefined &&
    !worthSabotaging(dependencies, player, unit, tile)
  ) {
    return -10;
  }

  const context = moveContext(
      dependencies,
      player,
      memory,
      knowledge,
      unit,
      tile,
      actions,
      lookup
    ),
    gate = moveGate(context);

  if (gate !== null) {
    return gate;
  }

  let score = 0;

  score += goodyHutTerm(context);

  if (
    (foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) ||
    (buildMine && knowledge.shouldMine(dependencies, player, tile)) ||
    (buildIrrigation && knowledge.shouldIrrigate(dependencies, player, tile)) ||
    (buildRoad && knowledge.shouldRoad(dependencies, player, tile))
  ) {
    score += 24;
  }

  const tileUnits = dependencies.unitRegistry.getByTile(tile),
    // The strengths a battle here would be fought at (terrain, City Walls, fortified), against the unit that would
    //  defend: the strongest against this attacker.
    [attackStrength, defenceStrength] = attack
      ? tileUnits
          .map((tileUnit: Unit): [number, number] => {
            const [attackYield, defenceYield] = strength(
              unit,
              tileUnit,
              dependencies.ruleRegistry
            );

            return [attackYield.value(), defenceYield.value()];
          })
          .sort(([, a], [, b]): number => b - a)[0]
      : [0, 0],
    ourUnitsOnTile = tileUnits.some((unit: Unit) => unit.player() === player);

  // A transport for passengers: by its cargo where the ruleset's transports carry other things (`ferriesByCargo`).
  const ferry = (
    ferriesByCargo(dependencies.ruleRegistry)
      ? ferries(unit, dependencies.ruleRegistry)
      : unit instanceof NavalTransport
  )
    ? (unit as NavalTransport)
    : null;

  if (ferry && ferry.hasCapacity() && tileUnits.length && ourUnitsOnTile) {
    score += 10;
  }

  if (ferry && ferry.hasCargo() && tile.isCoast() && tile.isWater()) {
    score += 16;
  }

  // Only a passenger boards: a land unit with work at home, next to a ship exploring the coast, used to climb aboard
  //  and be carried off, or sink with it (civ-clone/web-renderer#211). Passengers board in `TravelOverseas`, so a
  //  move onto a ship scores nothing here.
  if (embark && !isPassenger(memory, unit)) {
    return -10;
  }

  if (disembark) {
    score += 16;
  }

  if (captureCity) {
    score += 100;
  }

  // Battles fought in rounds, with hit points and firepower (a `CombatResolver` is registered): the odds decide. A unit
  //  attacks only at the odds it wants (`oddsWanted`), and the better they are the more the attack is worth. Otherwise
  //  (a single roll, as in Civ1) the strengths are compared.
  if (attack && fightsInRounds(dependencies.ruleRegistry)) {
    const odds = attackOdds(dependencies, unit, tile);

    if (odds < oddsWanted(dependencies, player, tile)) {
      return -10;
    }

    score += 24 + 40 * odds;
  } else {
    if (attack && attackStrength > defenceStrength) {
      score += 24 * (attackStrength - defenceStrength);
    }

    if (attack && attackStrength >= defenceStrength) {
      score += 16;
    }

    // add some jeopardy
    if (attack && attackStrength >= defenceStrength * (2 / 3)) {
      score += 8;
    }
  }

  score += discoverableTilesTerm(context);
  score += headingForTargetTerm(context);

  return revisitTerm(context, score);
};

export default scoreUnitMove;
