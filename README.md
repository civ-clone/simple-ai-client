# simple-ai-client

A computer player for `civ1-*` rules, built from [`core-strategy`](https://github.com/civ-clone/core-strategy)
strategies.

`SimpleAIClient` is a
[`StrategyAIClient`](https://github.com/civ-clone/core-strategy-ai-client). Each turn it offers `BeforeTurn` to every
strategy that handles it. Then it offers each of the player's mandatory actions, one at a time, until a strategy
handles it, and finally offers `AfterTurn`. The turn ends at the first action nothing handles, normally `EndTurn`.

The client itself keeps only two things:

- Civ1's handling of failed, unhandled and runaway actions;
- the `cityLost` and `unitDestroyed` hooks that `Rules/` call during other players' turns.

## The strategy pack

Importing the package (`index.ts`) registers the pack into the game's `StrategyRegistry`, as `registerRules` does for
its rules. For now that's `defaultGame.strategies`. Importing `SimpleAIClient` alone doesn't register it: until the
package index has been imported, the default registry is empty, and the client logs `Can't process` for the first unit
or city action and ends its turn. In `registerStrategies.ts`, `createStrategies(dependencies,
knowledge)` builds the pack and `register(game)` registers it. In registration order:

| Strategy                                  | Handles                                      | Does                                                                           | Kind    |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ------- |
| `Strategies/Turn/SurveyTargets`           | `BeforeTurn`                                 | refills the player's target board from what it can see                         | generic |
| `Strategies/Turn/ReviewCities`            | `BeforeTurn`                                 | assigns city workers and notes undefended cities                               | generic |
| `Strategies/Turn/WakeCarrierAircraft`     | `BeforeTurn`                                 | gives orders to aircraft resting on carriers                                   | generic |
| `Strategies/Civ1/StartRevolution`         | `BeforeTurn`                                 | starts a revolution once Monarchy is known                                     | Civ1    |
| `Strategies/Unit/WaitForCarrier`          | a unit's action                              | makes an aircraft wait until carriers have moved (handles it only then)        | generic |
| `Strategies/Unit/UnloadTransport`         | a unit's action                              | unloads a transport at the coast (handles it only then)                        | generic |
| `Strategies/Unit/FoundCapital`            | a `Worker`'s action                          | from turn 5, founds a player's first city where it stands (handles it only then) | generic |
| `Strategies/Unit/WorkerTurn`              | a `Worker`'s action                          | founds a city, irrigates, mines, builds a road or heads for a city site, then moves | generic |
| `Strategies/Unit/Garrison`                | a unit's action                              | fortifies in an under-defended city (handles it only then)                     | generic |
| `Strategies/Unit/MissionAndMove`          | a unit's action                              | takes a mission if the unit has no target, then moves; handles it unless the unit has nothing to do | generic |
| `Strategies/Unit/StandDown`               | a unit's action                              | goes to a city that wants it, is disbanded if not worth its upkeep, or waits in or heads for a city; always handles it | generic |
| `Strategies/City/BuildExplorerShip`       | a `CityBuild` choice                         | builds a ship to explore with, if the player has 2+ cities and no ship (handles it only then) | generic |
| `Strategies/Civ1/ChooseProduction`        | a `CityBuild` choice                         | picks what the city builds, by each player's `ProductionPolicy`               | Civ1    |
| `Strategies/Science/ChooseResearch`       | a `PlayerResearch` choice                    | picks research at random, an advance the leader wants first                    | generic |
| `Strategies/Civ1/ChooseGovernment`        | a `PlayerGovernment` choice                  | picks Monarchy after Anarchy                                                   | Civ1    |
| `Strategies/Diplomacy/NegotiationAnswers` | `ChooseFromList` for `negotiation.next-step` | answers each negotiation step; any other list gets a random pick               | generic |
| `Strategies/City/PreventDisorder`         | `AfterTurn`                                  | keeps cities out of civil disorder, by the ruleset's `DisorderPolicy`          | generic |
| `Strategies/Turn/TradeRates`              | `AfterTurn`                                  | sets the tax, luxury and science rates, by the ruleset's `TradeRatePolicy`     | generic |

A unit with nothing to do (civ-clone/web-renderer#230), no mission, no path and no step that scores above nothing, is
passed over by `MissionAndMove` rather than left to wander, and `StandDown` (`lib/Unit/standDown.ts`) takes it: a unit
that could defend a city goes to the nearest of the player's cities it can reach that still wants a defender or a unit
for martial law, counting those already on their way; failing that it's disbanded if the ruleset's `StandDownPolicy`
says so; otherwise it waits in the city it's in, unfortified and ready for the next mission, or heads for the nearest
city it can reach (a ship for the sea beside one, then into port), or with none, fortifies where it is. Civ1's policy (`lib/Civ1/standDown.ts`) disbands
a unit its home city pays shields for when the city has none to spare. Run for one unit, `MissionAndMove` returning
`false` means the unit has nothing left to explore or attack.

`PreventDisorder` (`lib/City/disorder.ts`) runs once the player's units have moved, since where they stand changes how
unhappy a city is. For each city the ruleset's `CivilDisorder` rules would find in disorder at the player's next turn
start, as it stands or once it has grown, it makes Entertainers from the worked tiles giving the least food, then the
fewest shields, then the least trade, until the rules find it calm. It stops short of a food deficit, and of stopping a
city growing to keep it calm at its next size. The cities it can't calm are noted in the player's memory
(`uncalmedCities`, with why), for civ-clone/web-renderer#154's luxury rate. A city that started the turn in disorder
also switches to the first improvement it can build of the policy's list, and spends up to the policy's share of the
treasury on it. Civ1's policy (`lib/Civ1/disorder.ts`) is v474.05's: Temple, Marketplace, Cathedral, Colosseum, and an
eighth of the treasury. Entertainers made this way are put back to work at the end of the next turn, and remade only if
they're still needed.

`TradeRates` (`lib/Turn/adjustTradeRates.ts`) runs straight after it and sets the rates for the turn ahead with
v474.05's routine (`lib/tradeRates.ts`, in tenths): luxuries go up one when a city was in disorder this turn, and down
one every fourth turn while no city is in disorder or on the edge of it; science is the leader's Ideology
(`lib/traits.ts`: Militaristic −1, Civilized 1) plus half of what luxuries leave, one more while the treasury holds more
than the turn number + 100, or none at all once the player has stopped researching (below); tax takes the rest. A player
starts at Ideology + 3 science and 1 luxury. Luxuries also go up one while any city `PreventDisorder` couldn't calm
would otherwise starve or has no tile left to take an Entertainer from, and whenever the luxury rate changes every city
is calmed again. One departure from v474.05: luxuries fall all the way back to 0 when no city needs them, where the
original keeps 1 or 2 for good. Civ1's policy (`lib/Civ1/tradeRates.ts`) reads disorder from `civ1-city-happiness`, and
takes a city larger than 5 with as many happy citizens as unhappy ones to be on the edge.

A player stops researching for good once it has every advance its leader wants (`lib/Science/wantedAdvances.ts`), by
the ruleset's `WantedAdvancesPolicy`. Until then `ChooseResearch` picks among the wanted advances available, if any are,
in the same single random draw. v474.05 stops every AI at Robotics. Civ1's table (`lib/Civ1/wantedAdvances.ts`) starts
there: Militaristic leaders want nothing more; normal militarism and a Friendly mood add Recycling and Nuclear Power;
Civilized leaders add Computers, Genetic Engineering, Space Flight, Plastics, Superconductor and Fusion Power. Future
Technology is never wanted.

Strategies are game-wide and stateless. Each is a thin adapter over a module in `lib/`. It's given the shared
registries (`lib/Dependencies.ts`) and the ruleset's judgements (`lib/Knowledge.ts`; Civ1's are in
`lib/Civ1/knowledge.ts`).

Each player's working memory is looked up by player in `lib/MemoryRegistry.ts`. It holds the player's targets, unit
paths and recent moves, and the cities its last turn left in disorder.

The unit strategies share one context per action (`Strategies/lib/unitTurnContextFor.ts`), so a unit's actions are
read once per turn, however many strategies look at it.

Generic files import only `core-*`, `base-*` and `library-*` packages and other generic files. Everything Civ1 is in a
`Civ1/` folder.

## Adding to or overriding the pack

The pack registers no `Priority` rules, so it runs in registration order. A plugin strategy registered later with no
`Priority` rule runs after the whole pack. `StandDown` handles every unit that reaches it, so a unit strategy registered
that way never gets to act.

- **To run ahead of the pack**, give your strategy a `Priority` rule (`Rules/Priority` in `core-strategy`). Any
  `Priority` value puts a strategy ahead of one with none. For example, a plugin that adds Caravans registers a
  strategy whose `handles` matches Caravans' actions, plus a `Priority` rule for it. Its `attempt` returns `true` when
  it has dealt with the Caravan, and `false` to let the pack carry on.
- **To replace one of the pack's strategies**, run ahead of it the same way and always return `true` for the actions
  you take over.
- **To run after one of them**, give both a `Priority` rule, with yours the lower priority. Alternatively, build your
  own registry with `createStrategies(...)` and register yours after it.

`SimpleAIClient`'s last constructor argument is the `StrategyRegistry` to use, and it defaults to the game-wide one. A
client given its own registries needs a strategy registry built over those same registries:
`registry.register(...createStrategies(createDependencies({ cityRegistry, … })))`.

## Running one strategy directly

A strategy can be run for one unit or city, for example to automate a human player's unit:
`await new MissionAndMove(dependenciesFor(game), civ1Knowledge).attempt(action)`. Here `action` is the unit's
mandatory action, which is also where the player comes from.
