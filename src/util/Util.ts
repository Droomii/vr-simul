import IStockHistory from "../define/IStockHistory";

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
            }

            return acc;
        }, [{...data[0]}])
    }
}

export default Util;