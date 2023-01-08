import ChartElement from "./ChartElement";
import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";

class Candle extends ChartElement<IStockHistory> {
    constructor(controller: ChartController) {
        super(controller, v => v);
    }

    draw() {
        const {ctx} = this;
        const {normalize} = this.controller;
        this.slicedData.map(({open, low, close, high}) => ({
            open: normalize(open),
            low: normalize(low),
            close: normalize(close),
            high: normalize(high)
        })).forEach(({low, close, open, high}, i) => {
            const x = i * (this.zoom) + 1;
            ctx.fillStyle = open < close ? "#cb6869" : "#218cd3";
            ctx.fillRect(Math.floor(x + (this.zoom - 1) / 2), this.height - high, 1, high - low);
            ctx.fillStyle = open < close ? "#e51a1c" : "#0f7cc4";
            ctx.fillRect(x, this.height - Math.max(open, close), this.zoom - 1, Math.max(Math.abs(open - close), 1));
        })
    }

    get range() {
        return this.slicedData.reduce((acc, {low, high}) => {
            acc.highest = Math.max(acc.highest, high);
            acc.lowest = Math.min(acc.lowest, low);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }
}

export default Candle