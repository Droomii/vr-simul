import IStockHistory from "../define/IStockHistory";
import {YahooFinanceChartData} from "../define/YahooFinanceChartData";

const DAY = 86400000;
const WEEK = DAY * 7;
const FIRST_MONDAY = DAY * 3;

class Util {
  private static tolerance = 10e-20;
  private static mul = 12;

  static dropDecimal(num: number, decimalPoint: number, method = Math.floor): number {
    return method(num * 10 ** decimalPoint) / 10 ** decimalPoint;
  }

  static roundDecimal(num: number, decimalPoint: number): number {
    return Math.round(num * 10 ** decimalPoint) / 10 ** decimalPoint;
  }

  static getRsi(closePrices: number[]) {
    let sumGain = 0;
    let sumLoss = 0;
    for (let i = 1; i < closePrices.length; i++) {
      const difference = closePrices[i] - closePrices[i - 1];
      if (difference >= 0) {
        sumGain += difference;
      } else {
        sumLoss -= difference;
      }
    }

    if (sumGain === 0) return 0;
    if (Math.abs(sumLoss) < this.tolerance) return 100;

    const relativeStrength = sumGain / sumLoss;

    return 100.0 - (100.0 / (1 + relativeStrength));
  }

  static getHeatColor(rate: number): string {
    const r = rate > 0 ? 255 : 255 + Math.floor(Math.max(rate, -10) * this.mul);
    const g = 255 - Math.floor(Math.min(Math.abs(rate), 10) * (rate < 0 ? this.mul / 1.5 : this.mul));
    const b = rate < 0 ? 255 : 255 - Math.floor(Math.min(rate, 10) * this.mul);

    return `rgb(${r}, ${g}, ${b})`;
  }

  static getProgressColor(progressRate: number, opacity = 1): string {
    return `rgba(${105 + Math.floor(progressRate * 1.5)},${155 - Math.floor(progressRate * 0.5)},${255 - Math.floor(progressRate * 1.5)}, ${opacity})`;
  }

  static normalize(val: number, lowest: number, highest: number) {
    return (val - lowest) / (highest - lowest);
  }

  static parseData(priceData: string, splitData: string): IStockHistory[] {
    let ratio = 1;
    const splits: Record<string, number> = splitData ? splitData
      .split("\n")
      .slice(1)
      .map(v => v.split(","))
      .reduce<Record<string, number>>((acc, [date, split]) => {
        const splitValues = split.split(":").map(Number);
        const splitNumber = splitValues[0] / splitValues[1];
        ratio *= splitNumber;

        acc[date] = splitNumber;
        return acc;
      }, {}) : {};

    const result = priceData
      .split("\n")
      .slice(1)
      .map(v => v.split(","))
      .map(([date, open, high, low, close, , volume]) => {
        if (splits[date]) {
          ratio = Util.roundDecimal(ratio / splits[date], 8)
        }
        return {
          date: new Date(date).getTime(),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          ratio: Number(ratio),
          split: splits[date],
          volume: Number(volume ?? 0)
        }
      });

    if (!result.slice(-1)[0].close) {
      return result.slice(0, -1);
    }

    return result;
  }

  static convertChartDataToCSV(chartData: YahooFinanceChartData): { priceDataCSV: string, splitDataCSV: string } {
    const priceHeader = "Date,Open,High,Low,Close,Adj Close,Volume\n";
    const splitHeader = "Date,Stock Splits\n";

    // Extract price data (Date, Open, High, Low, Close, Adj Close, Volume)
    const priceDataCSV = chartData.chart.result[0].timestamp.map((timestamp, index) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
      const open = chartData.chart.result[0].indicators.quote[0].open[index];
      const high = chartData.chart.result[0].indicators.quote[0].high[index];
      const low = chartData.chart.result[0].indicators.quote[0].low[index];
      const close = chartData.chart.result[0].indicators.quote[0].close[index];
      const adjClose = chartData.chart.result[0].indicators.adjclose[0].adjclose[index];
      const volume = chartData.chart.result[0].indicators.quote[0].volume[index];

      return `${date},${open},${high},${low},${close},${adjClose},${volume}`;
    }).join("\n");

    // Extract split data (Date, Stock Splits)
    const splits = chartData.chart.result[0].events?.splits || {};
    const splitDataCSV = Object.keys(splits).map((timestamp) => {
      const date = new Date(Number(timestamp) * 1000).toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      const splitRatio = `${splits[timestamp].numerator}:${splits[timestamp].denominator}`;
      return `${date},${splitRatio}`;
    }).join("\n");

    // Return the CSV strings
    return {
      priceDataCSV: priceHeader + priceDataCSV,
      splitDataCSV: splitHeader + splitDataCSV
    };
  }

  static parseYFJsonData(chartData: YahooFinanceChartData): IStockHistory[] {
    let ratio = 1;
    const splits = chartData.chart.result[0].events?.splits || {};

    const result = chartData.chart.result[0].timestamp.map((timestamp, index) => {
      const open = chartData.chart.result[0].indicators.quote[0].open[index];
      const high = chartData.chart.result[0].indicators.quote[0].high[index];
      const low = chartData.chart.result[0].indicators.quote[0].low[index];
      const close = chartData.chart.result[0].indicators.quote[0].close[index];
      const volume = chartData.chart.result[0].indicators.quote[0].volume[index];

      // Check if there is a split for the current date
      if (splits[timestamp]) {
        const splitRatio = splits[timestamp].numerator / splits[timestamp].denominator;
        ratio = Util.roundDecimal(ratio / splitRatio, 8);
      }

      return {
        date: timestamp * 1000,  // Convert to milliseconds
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        ratio: Number(ratio),
        split: splits[timestamp] ? splits[timestamp].numerator / splits[timestamp].denominator : undefined,
        volume: Number(volume ?? 0),
      };
    });

    // If the last entry has no valid closing price, discard it
    if (!result.slice(-1)[0].close) {
      return result.slice(0, -1);
    }

    return result;
  }

  static getWeek(date: number) {
    return Math.floor((new Date(date).getTime() + FIRST_MONDAY) / WEEK)
  }

  static toWeek(data: IStockHistory[]): IStockHistory[] {
    if (!data.length) return [];
    return data.reduce((acc, v) => {
      const lastData = acc.at(-1);
      if (!lastData) return acc;
      const thisWeek = this.getWeek(v.date);
      const lastWeek = this.getWeek(lastData.date);
      if (lastWeek < thisWeek) {
        acc.push({...v})
      } else {
        lastData.high = Math.max(lastData.high, v.high);
        lastData.low = Math.min(lastData.low, v.low);
        lastData.close = v.close;
      }

      return acc;
    }, [{...data[0]}])
  }

  static toMonth(data: IStockHistory[]): IStockHistory[] {
    if (!data.length) return [];
    return data.reduce((acc, v) => {
      const lastData = acc.at(-1);
      if (!lastData) return acc;
      const thisMonth = new Date(v.date).getMonth();
      const lastMonth = new Date(lastData.date).getMonth();
      if (thisMonth !== lastMonth) {
        acc.push({...v})
      } else {
        lastData.high = Math.max(lastData.high, v.high);
        lastData.low = Math.min(lastData.low, v.low);
        lastData.close = v.close;
        lastData.volume += v.volume;
      }

      return acc;
    }, [{...data[0]}])
  }
}

export default Util;