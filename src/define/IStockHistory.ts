export interface IStockHistory {
    date: number;
    open: number;
    close: number;
    high: number;
    low: number;
    split?: number;
    volume: number;
    ratio: number;
}