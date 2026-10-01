// Generic: sets the player's tax, luxury and science rates at the end of its turn, the way v474.05's AI does but for
//  one departure (`lib/tradeRates`), and calms its cities again if the luxury rate changed
//  (civ-clone/web-renderer#154).
//
// It runs at the end of the turn, after `preventDisorder`, rather than at the start: the engine judges disorder at the
//  player's turn start, before the AI's turn begins, so rates set then would come a turn late. Set here, they're the
//  rates the engine shares each city's trade out by at that turn start.
import { Rates, startingRates, tradeRates } from '../tradeRates';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { DisorderPolicy, UncalmedReason, calmCities } from '../City/disorder';
import Knowledge from '../Knowledge';
import Luxuries from '@civ-clone/base-trade-rate-luxuries/Luxuries';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import PlayerTradeRates from '@civ-clone/core-trade-rate/PlayerTradeRates';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import Research from '@civ-clone/base-trade-rate-research/Research';
import Tax from '@civ-clone/base-trade-rate-tax/Tax';
import TradeRate from '@civ-clone/core-trade-rate/TradeRate';
import { ideology } from '../traits';

// The ruleset's part. `Civ1/tradeRates` has Civ1's.
export interface TradeRatePolicy {
  // Whether `city` is in civil disorder this turn.
  inDisorder(dependencies: Dependencies, city: City): boolean;
  // Whether `city` is on the edge of civil disorder.
  onTheEdge(dependencies: Dependencies, city: City): boolean;
  // Whether `player` has stopped researching for good.
  scienceStopped(dependencies: Dependencies, player: Player): boolean;
}

// Luxuries beyond the original's, for the cities `preventDisorder` couldn't calm: one step while any of them would
//  otherwise starve (`food`) or has no tile left to take an Entertainer from (`tiles`). A city that will grow into
//  disorder (`growth`) is calm now, and is calmed at its new size the turn it grows, so it adds nothing.
export const extraLuxuries = (uncalmed: Iterable<UncalmedReason>): number =>
  [...uncalmed].some((reason: UncalmedReason): boolean => reason !== 'growth')
    ? 1
    : 0;

// The engine keeps rates as percentages, the original in tenths.
const tenths = (rate: TradeRate): number => Math.round(rate.value() / 10);

const gold = (dependencies: Dependencies, player: Player): number =>
  dependencies.playerTreasuryRegistry
    .getByPlayer(player)
    .reduce(
      (total: number, treasury: PlayerTreasury): number =>
        total + treasury.value(),
      0
    );

// Sets the player's rates for the turn ahead, and returns them, in tenths. Returns `null`, and changes nothing, for a
//  player whose ruleset has no tax, luxury and science rates.
export const adjustTradeRates = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  disorderPolicy: DisorderPolicy,
  policy: TradeRatePolicy
): Rates | null => {
  let playerTradeRates: PlayerTradeRates;

  try {
    playerTradeRates =
      dependencies.playerTradeRatesRegistry.getByPlayer(player);
  } catch (e) {
    return null;
  }

  const science = playerTradeRates.get(Research),
    tax = playerTradeRates.get(Tax),
    luxuries = playerTradeRates.get(Luxuries);

  if (!science || !tax || !luxuries) {
    return null;
  }

  const turn = dependencies.turn.value(),
    playerIdeology = ideology(dependencies, player),
    cities = dependencies.cityRegistry.getByPlayer(player),
    luxuriesBefore = luxuries.value(),
    rates = tradeRates({
      // The original sets a new player's rates when the game starts. The engine starts everyone at its own, so they're
      //  replaced on the player's first turn.
      rates:
        turn <= 1
          ? startingRates(playerIdeology)
          : {
              luxuries: tenths(luxuries),
              science: tenths(science),
              tax: tenths(tax),
            },
      inDisorder: cities.some((city: City): boolean =>
        policy.inDisorder(dependencies, city)
      ),
      onTheEdge: cities.some((city: City): boolean =>
        policy.onTheEdge(dependencies, city)
      ),
      turn,
      gold: gold(dependencies, player),
      ideology: playerIdeology,
      scienceStopped: policy.scienceStopped(dependencies, player),
      extraLuxuries: extraLuxuries(memory.uncalmedCities.values()),
    });

  playerTradeRates.setAll([
    [Tax, rates.tax * 10],
    [Research, rates.science * 10],
    [Luxuries, rates.luxuries * 10],
  ]);

  // More luxuries may calm a city with fewer Entertainers, or one that couldn't be calmed; fewer may leave one in
  //  disorder.
  if (luxuries.value() !== luxuriesBefore) {
    calmCities(dependencies, player, memory, knowledge, disorderPolicy);
  }

  return rates;
};

export default adjustTradeRates;
