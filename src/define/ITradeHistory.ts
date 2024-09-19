export interface ITradeHistory {
  date: number;
  type: 'buy' | 'sell';
  price: number;
  count: number;
}
