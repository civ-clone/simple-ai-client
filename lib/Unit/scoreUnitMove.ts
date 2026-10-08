// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out. The
//  exploring terms are `base-strategy-explore`'s, added in the order they always were around the others.
import {
  discoverableTilesTerm,
  goodyHutTerm,
  headingForTargetTerm,
  moveContext,
  moveGate,
  revisitTerm,
} from '@civ-clone/base-strategy-explore/lib/Unit/scoreExploration';
import { NavalTransport } from '@civ-clone/library-unit/Types';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import { SneakAttack } from '@civ-clone/library-unit/Actions';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import lookupActions from '@civ-clone/base-strategy-ai/lib/actionLookup';
import shouldAttack from '../shouldAttack';

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
    sneakAttack = lookup.sneakAttack as SneakAttack | undefined;

  if (sneakAttack && !shouldAttack(dependencies, player, sneakAttack.enemy())) {
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

  const tileUnits = dependencies.unitRegistry
      .getByTile(tile)
      .sort(
        (a: Unit, b: Unit): number => b.defence().value() - a.defence().value()
      ),
    [defender] = tileUnits,
    ourUnitsOnTile = tileUnits.some((unit: Unit) => unit.player() === player);

  if (
    unit instanceof NavalTransport &&
    unit.hasCapacity() &&
    tileUnits.length &&
    ourUnitsOnTile
  ) {
    score += 10;
  }

  if (
    unit instanceof NavalTransport &&
    unit.hasCargo() &&
    tile.isCoast() &&
    tile.isWater()
  ) {
    score += 16;
  }

  if (embark) {
    score += 16;
  }

  // TODO: move to far off continents
  if (disembark /* && tile.continentId !== unit.departureContinentId*/) {
    score += 16;
  }

  if (captureCity) {
    score += 100;
  }

  // TODO: weight attacking dependent on leader's personality
  if (attack && unit.attack().value() > defender.defence().value()) {
    score += 24 * (unit.attack().value() - defender.defence().value());
  }

  if (attack && unit.attack().value() >= defender.defence().value()) {
    score += 16;
  }

  // add some jeopardy
  if (attack && unit.attack().value() >= defender.defence().value() * (2 / 3)) {
    score += 8;
  }

  score += discoverableTilesTerm(context);
  score += headingForTargetTerm(context);

  return revisitTerm(context, score);
};

export default scoreUnitMove;
