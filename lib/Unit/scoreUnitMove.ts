// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out.
import { Fortifiable, NavalTransport } from '@civ-clone/library-unit/Types';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import lookupActions from '../actionLookup';
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
    {
      attack,
      buildIrrigation,
      buildMine,
      buildRoad,
      captureCity,
      disembark,
      embark,
      fortify,
      foundCity,
      noOrders,
      sneakAttack,
    } = lookupActions(actions);

  if (sneakAttack && !shouldAttack(dependencies, player, sneakAttack.enemy())) {
    return -10;
  }

  const [firstAction] = actions;

  if (
    firstAction &&
    !knowledge.canReturnAfter(dependencies, player, unit, firstAction)
  ) {
    return -1;
  }

  if (
    !actions.length ||
    (actions.length === 1 && noOrders) ||
    (unit instanceof Fortifiable && actions.length === 2 && fortify && noOrders)
  ) {
    return -1;
  }

  let score = 0;

  const goodyHut = dependencies.goodyHutRegistry.getByTile(tile);

  if (goodyHut !== null) {
    score += 60;
  }

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
  // TODO: compares the `Yield`s, not their values, so it's never true. Kept: #153 changes no play.
  if (attack && unit.attack() > defender.defence()) {
    score += 24 * (unit.attack().value() - defender.defence().value());
  }

  if (attack && unit.attack().value() >= defender.defence().value()) {
    score += 16;
  }

  // add some jeopardy
  if (attack && unit.attack().value() >= defender.defence().value() * (2 / 3)) {
    score += 8;
  }

  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  const discoverableTiles = tile
    .getNeighbours()
    .filter(
      (neighbouringTile: Tile): boolean =>
        !playerWorld.includes(neighbouringTile)
    ).length;

  if (discoverableTiles > 0) {
    score += discoverableTiles * 3;
  }

  const target = memory.unitTargetData.get(unit);

  if (
    target instanceof Tile &&
    tile.distanceFrom(target) < unit.tile().distanceFrom(target)
  ) {
    score += 14;
  }

  const lastMoves = memory.lastUnitMoves.get(unit) || [];

  if (!lastMoves.includes(tile)) {
    score *= 4;
  }

  return score;
};

export default scoreUnitMove;
