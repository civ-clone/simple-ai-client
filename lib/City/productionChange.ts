// Generic: what changing what a city builds would cost it. A ruleset may take part of a city's shields when it changes
//  from one item to another (Civ2's change penalty, by core-city-build's `ProductionChanged` rules); this asks those
//  rules, rather than knowing any ruleset's own, so with none registered (Civ1) nothing is ever lost and nothing here
//  changes what a city builds.
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import ProductionChanged from '@civ-clone/core-city-build/Rules/ProductionChanged';

// Whether the ruleset has any rule for what a change of item keeps.
export const hasChangeRules = (dependencies: Dependencies): boolean =>
  dependencies.ruleRegistry.get(ProductionChanged).length > 0;

// The progress `cityBuild` would keep if it changed to `to` now: the first answer of the `ProductionChanged` rules, asked
//  as `CityBuild#build` asks them, from the item it's building (or the one it last cleared) and its progress as it is.
//  `CityBuild` asks from where the turn started when the build has already changed this turn, which it keeps to
//  itself; so a second change in a turn is judged from the first change's result here.
export const progressAfterChange = (
  dependencies: Dependencies,
  cityBuild: CityBuild,
  to: IBuildable
): number => {
  const progress = cityBuild.progress().value(),
    from = cityBuild.building()?.item() ?? cityBuild.cleared()?.item ?? null;

  if (from === to) {
    return progress;
  }

  const [answer] = dependencies.ruleRegistry.process(
    ProductionChanged,
    cityBuild,
    from,
    to,
    progress
  );

  return answer ?? progress;
};

// Whether changing `cityBuild` to `to` now would lose shields.
export const changeLosesShields = (
  dependencies: Dependencies,
  cityBuild: CityBuild,
  to: IBuildable
): boolean =>
  progressAfterChange(dependencies, cityBuild, to) <
  cityBuild.progress().value();

export default progressAfterChange;
