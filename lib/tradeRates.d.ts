export interface Rates {
  luxuries: number;
  science: number;
  tax: number;
}
export interface TradeRateState {
  rates: Rates;
  inDisorder: boolean;
  onTheEdge: boolean;
  turn: number;
  gold: number;
  ideology: number;
  scienceStopped: boolean;
  extraLuxuries?: number;
}
export declare const MAX_LUXURIES = 4;
export declare const startingRates: (ideology: number) => Rates;
export declare const LUXURY_REDUCTION_BELOW = 10;
export declare const tradeRates: ({
  rates,
  inDisorder,
  onTheEdge,
  turn,
  gold,
  ideology,
  scienceStopped,
  extraLuxuries,
}: TradeRateState) => Rates;
export default tradeRates;
