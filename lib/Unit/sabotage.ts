// Generic: whether a Spy's sabotage of a unit (base-unit-action-sabotage-unit's `SabotageUnit`, which a ruleset offers
//  ahead of moving and attacking) is worth the risk to the Spy, which is lost unless it escapes.
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// The share of the Spy's own cost a target has to be worth.
export const SABOTAGE_WORTH = 1 / 2;

// What a unit of `unit`'s type costs to build, by the ruleset's `BuildCost` rules: 0 for one it doesn't price.
export const unitCost = (dependencies: Dependencies, unit: Unit): number => {
  const cost = new BuildItem(
    unit.constructor as unknown as IBuildable,
    null,
    dependencies.ruleRegistry
  )
    .cost()
    .value();

  return Number.isFinite(cost) ? cost : 0;
};

// Whether `spy` should sabotage the unit on `tile`: one worth at least `SABOTAGE_WORTH` of the Spy's cost, or one that
//  can attack and stands next to one of `player`'s cities.
export const worthSabotaging = (
  dependencies: Dependencies,
  player: Player,
  spy: Unit,
  tile: Tile
): boolean => {
  const [target] = dependencies.unitRegistry
    .getByTile(tile)
    .filter((unit: Unit): boolean => unit.player() !== player);

  if (!target) {
    return false;
  }

  if (
    target.attack().value() > 0 &&
    tile
      .getNeighbours()
      .some(
        (neighbour: Tile): boolean =>
          dependencies.cityRegistry.getByTile(neighbour)?.player() === player
      )
  ) {
    return true;
  }

  return (
    unitCost(dependencies, target) >=
    unitCost(dependencies, spy) * SABOTAGE_WORTH
  );
};

export default worthSabotaging;
