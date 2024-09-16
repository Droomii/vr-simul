export interface YahooFinanceChartData {
  chart: {
    result: Array<{
      timestamp: number[]; // Date
      indicators: {
        quote: Array<{
          open: number[];   // Open
          high: number[];   // High
          low: number[];    // Low
          close: number[];  // Close
          volume: number[]; // Volume
        }>;
        adjclose: Array<{
          adjclose: number[]; // Adj Close
        }>;
      };
      events?: {
        dividends?: {
          [date: string]: {
            amount: number;
            date: number;
          };
        };
        splits?: {
          [date: string]: {
            date: number;
            numerator: number;
            denominator: number;
            splitRatio: string;
          };
        };
      };
    }>;
    error: null | string;
  };
}