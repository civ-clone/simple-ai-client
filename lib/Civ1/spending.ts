// Civ1: how a computer player spends its treasury (civ-clone/web-renderer#233, `City/spendTreasury`).
//
// v474.05's AI (OpenCivOne `CityWorker.cs` `F0_1d12_0045_ProcessCityState`, L1144-1215) puts gold into a city's build
//  each turn at 2 gold a shield, and only into a build with shields in it: up to a third of the treasury for a unit in
//  a city with no unit on its tile, an eighth for an improvement in a city in disorder, a 64th for a unit that suits its
//  plan for the continent, and a 512th more in every city once it holds over 2,000. Otherwise it hoards: the turn-204
//  save that raised the issue had a computer player on 1,477 gold with cities making 0 or 1 shields. Here the player
//  keeps a reserve and spends the rest at the ruleset's own price, a whole build at a time.
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import { SpendingPolicy } from '../City/spendTreasury';

export const civ1SpendingPolicy: SpendingPolicy = {
  // 30 gold, and 10 more for each city: a few turns of improvements' upkeep, and the eighth of the treasury a city in
  //  disorder may spend (`Civ1/disorder`). In the arena (civ-clone/web-renderer#233), keeping back what v474.05's rates
  //  routine counts as plenty instead (the turn + 100, over which it puts a step more into science) left most players
  //  never spending at all by turn 150, and built fewer improvements and grew less than this, for no more advances by
  //  turn 300. Kept this low, the treasury rarely reaches the turn + 100, so that step of science mostly goes to tax,
  //  and the tax to builds.
  reserve: (dependencies: Dependencies, player: Player): number =>
    30 + 10 * dependencies.cityRegistry.getByPlayer(player).length,
  minTurns: 5,
  wonderRemaining: 0.25,
};

export default civ1SpendingPolicy;
